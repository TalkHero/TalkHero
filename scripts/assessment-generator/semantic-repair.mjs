const DEFAULT_SIMILARITY_THRESHOLD = 0.94;
const DEFAULT_MAX_REPAIRS = 10;
const DEFAULT_CANDIDATE_ATTEMPTS = 3;
const EMBEDDING_BATCH_SIZE = 100;

function parseNumberEnvironmentVariable(
  name,
  fallback,
) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(
      `${name} must be a valid number. Received: "${rawValue}".`,
    );
  }

  return parsedValue;
}

function getSimilarityThreshold() {
  const threshold = parseNumberEnvironmentVariable(
    "QUESTION_SIMILARITY_THRESHOLD",
    DEFAULT_SIMILARITY_THRESHOLD,
  );

  if (threshold <= 0 || threshold > 1) {
    throw new Error(
      "QUESTION_SIMILARITY_THRESHOLD must be greater than 0 and not greater than 1.",
    );
  }

  return threshold;
}

function getMaxRepairs() {
  const maxRepairs = parseNumberEnvironmentVariable(
    "QUESTION_MAX_SEMANTIC_REPAIRS",
    DEFAULT_MAX_REPAIRS,
  );

  if (
    !Number.isInteger(maxRepairs) ||
    maxRepairs < 0
  ) {
    throw new Error(
      "QUESTION_MAX_SEMANTIC_REPAIRS must be a non-negative integer.",
    );
  }

  return maxRepairs;
}

function buildSemanticText(question) {
  const parts = [
    question?.prompt,
    question?.passage,
    Array.isArray(question?.options)
      ? question.options.join(" | ")
      : null,
    question?.correct_answer,
  ];

  return parts
    .filter(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0,
    )
    .map((value) => value.trim())
    .join("\n");
}

function cosineSimilarity(vectorA, vectorB) {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !== vectorB.length ||
    vectorA.length === 0
  ) {
    throw new Error(
      "Cannot calculate cosine similarity for invalid vectors.",
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    const valueA = vectorA[index];
    const valueB = vectorB[index];

    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
}

async function createEmbeddings({
  client,
  model,
  texts,
}) {
  if (texts.length === 0) {
    return [];
  }

  const embeddings = [];

  for (
    let startIndex = 0;
    startIndex < texts.length;
    startIndex += EMBEDDING_BATCH_SIZE
  ) {
    const batch = texts.slice(
      startIndex,
      startIndex + EMBEDDING_BATCH_SIZE,
    );

    const response = await client.embeddings.create({
      model,
      input: batch,
      encoding_format: "float",
    });

    const orderedData = [...response.data].sort(
      (itemA, itemB) =>
        itemA.index - itemB.index,
    );

    embeddings.push(
      ...orderedData.map((item) => item.embedding),
    );
  }

  if (embeddings.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, received ${embeddings.length}.`,
    );
  }

  return embeddings;
}

function findHighestConflict({
  questions,
  questionEmbeddings,
  referenceQuestions,
  referenceEmbeddings,
  threshold,
}) {
  let highestConflict = null;

  function registerConflict(conflict) {
    if (
      conflict.similarity < threshold
    ) {
      return;
    }

    if (
      !highestConflict ||
      conflict.similarity >
        highestConflict.similarity
    ) {
      highestConflict = conflict;
    }
  }

  /*
   * Compare every newly generated question with the existing
   * local/Supabase question bank.
   */
  for (
    let questionIndex = 0;
    questionIndex < questions.length;
    questionIndex += 1
  ) {
    for (
      let referenceIndex = 0;
      referenceIndex < referenceQuestions.length;
      referenceIndex += 1
    ) {
      const similarity = cosineSimilarity(
        questionEmbeddings[questionIndex],
        referenceEmbeddings[referenceIndex],
      );

      registerConflict({
        type: "existing-bank",
        replaceIndex: questionIndex,
        partnerIndex: referenceIndex,
        similarity,
      });
    }
  }

  /*
   * Compare newly generated questions with one another.
   * For a pair, the later question is replaced.
   */
  for (
    let firstIndex = 0;
    firstIndex < questions.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < questions.length;
      secondIndex += 1
    ) {
      const similarity = cosineSimilarity(
        questionEmbeddings[firstIndex],
        questionEmbeddings[secondIndex],
      );

      registerConflict({
        type: "generated-bank",
        replaceIndex: secondIndex,
        partnerIndex: firstIndex,
        similarity,
      });
    }
  }

  return highestConflict;
}

function getHighestCandidateSimilarity({
  candidateEmbedding,
  referenceEmbeddings,
  currentEmbeddings,
}) {
  let highestSimilarity = 0;

  for (const embedding of referenceEmbeddings) {
    highestSimilarity = Math.max(
      highestSimilarity,
      cosineSimilarity(
        candidateEmbedding,
        embedding,
      ),
    );
  }

  for (const embedding of currentEmbeddings) {
    highestSimilarity = Math.max(
      highestSimilarity,
      cosineSimilarity(
        candidateEmbedding,
        embedding,
      ),
    );
  }

  return highestSimilarity;
}

function formatSimilarity(value) {
  return value.toFixed(3);
}

export async function repairSemanticDuplicates({
  client,
  questions,
  referenceQuestions,
  generateReplacement,
}) {
  const embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL ||
    "text-embedding-3-small";

  const threshold = getSimilarityThreshold();
  const maxRepairs = getMaxRepairs();

  const validReferenceQuestions =
    referenceQuestions.filter(
      (question) =>
        typeof question?.prompt === "string" &&
        question.prompt.trim().length > 0,
    );

  console.log("");
  console.log("Running semantic duplicate repair...");
  console.log(`Embedding model: ${embeddingModel}`);
  console.log(`Similarity threshold: ${threshold}`);
  console.log(
    `Reference questions: ${validReferenceQuestions.length}`,
  );

  const workingQuestions = [...questions];

  const referenceTexts =
    validReferenceQuestions.map(buildSemanticText);

  const questionTexts =
    workingQuestions.map(buildSemanticText);

  console.log(
    `Creating embeddings for ${
      referenceTexts.length + questionTexts.length
    } question(s)...`,
  );

  const referenceEmbeddings =
    await createEmbeddings({
      client,
      model: embeddingModel,
      texts: referenceTexts,
    });

  const questionEmbeddings =
    await createEmbeddings({
      client,
      model: embeddingModel,
      texts: questionTexts,
    });

  let repairCount = 0;

  while (true) {
    const conflict = findHighestConflict({
      questions: workingQuestions,
      questionEmbeddings,
      referenceQuestions:
        validReferenceQuestions,
      referenceEmbeddings,
      threshold,
    });

    if (!conflict) {
      console.log(
        `Semantic duplicate repair completed. Replaced: ${repairCount}.`,
      );

      return workingQuestions;
    }

    if (repairCount >= maxRepairs) {
      throw new Error(
        [
          `Semantic duplicate repair exceeded the limit of ${maxRepairs}.`,
          `Question ${conflict.replaceIndex + 1} still has similarity ${formatSimilarity(conflict.similarity)}.`,
        ].join(" "),
      );
    }

    const replaceIndex = conflict.replaceIndex;
    const oldQuestion = workingQuestions[replaceIndex];

    const partnerQuestion =
      conflict.type === "existing-bank"
        ? validReferenceQuestions[
            conflict.partnerIndex
          ]
        : workingQuestions[
            conflict.partnerIndex
          ];

    console.log("");
    console.log(
      `Semantic conflict found: question ${replaceIndex + 1}`,
    );
    console.log(
      `Similarity: ${formatSimilarity(conflict.similarity)}`,
    );
    console.log(
      `Current: ${oldQuestion.prompt}`,
    );
    console.log(
      `Similar to: ${partnerQuestion.prompt}`,
    );

    let acceptedCandidate = null;
    let acceptedEmbedding = null;
    let lastCandidateSimilarity = null;

    for (
      let candidateAttempt = 1;
      candidateAttempt <=
      DEFAULT_CANDIDATE_ATTEMPTS;
      candidateAttempt += 1
    ) {
      console.log(
        `Generating replacement for question ${replaceIndex + 1}, attempt ${candidateAttempt}/${DEFAULT_CANDIDATE_ATTEMPTS}...`,
      );

      const blockedQuestions = [
        ...validReferenceQuestions,
        ...workingQuestions.filter(
          (_, index) => index !== replaceIndex,
        ),
      ];

      const candidate =
        await generateReplacement({
          category: oldQuestion.category,
          blockedQuestions,
        });

      const [candidateEmbedding] =
        await createEmbeddings({
          client,
          model: embeddingModel,
          texts: [
            buildSemanticText(candidate),
          ],
        });

      const currentEmbeddings =
        questionEmbeddings.filter(
          (_, index) => index !== replaceIndex,
        );

      const highestSimilarity =
        getHighestCandidateSimilarity({
          candidateEmbedding,
          referenceEmbeddings,
          currentEmbeddings,
        });

      lastCandidateSimilarity =
        highestSimilarity;

      if (highestSimilarity < threshold) {
        acceptedCandidate = candidate;
        acceptedEmbedding =
          candidateEmbedding;
        break;
      }

      console.log(
        `Replacement rejected: similarity ${formatSimilarity(highestSimilarity)}.`,
      );
    }

    if (!acceptedCandidate || !acceptedEmbedding) {
      throw new Error(
        [
          `Could not generate a unique replacement for question ${replaceIndex + 1}.`,
          `Last similarity: ${formatSimilarity(lastCandidateSimilarity ?? 0)}.`,
        ].join(" "),
      );
    }

    workingQuestions[replaceIndex] =
      acceptedCandidate;

    questionEmbeddings[replaceIndex] =
      acceptedEmbedding;

    repairCount += 1;

    console.log(
      `Question ${replaceIndex + 1} replaced successfully.`,
    );
    console.log(
      `New prompt: ${acceptedCandidate.prompt}`,
    );
  }
}
