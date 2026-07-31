const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_MAX_REJECTIONS_PER_ROUND = 10;
const DEFAULT_MAX_REVIEW_ROUNDS = 3;
const DEFAULT_REVIEW_ATTEMPTS = 2;

const QUALITY_REVIEW_SYSTEM_PROMPT = `
You are a senior English-language assessment reviewer.

Review CEFR assessment questions as a practical examiner for a
standard international English test, not as a theoretical linguist.

Your goal is to identify questions that would be unfair, misleading,
factually wrong, internally inconsistent, or genuinely ambiguous for
the stated CEFR level.

IMPORTANT STANDARD OF REVIEW

Reject a question for ambiguity only when at least two answer options
would both reasonably be accepted by competent examiners in the
specific sentence and testing context.

Do not reject a question merely because:

- another wording is theoretically grammatical in a rare context;
- an alternative is possible only after inventing extra context;
- informal, regional, or dialectal English sometimes allows another form;
- a descriptive grammar source might record a non-standard usage;
- a distractor could work with a substantially different intended meaning;
- a highly unusual interpretation can be constructed;
- tense backshift can occasionally be optional outside standard test conventions;
- a shortened or marked construction exists but is not the expected
  standard answer at the tested CEFR level.

Use standard international exam conventions comparable to Cambridge,
Oxford, Pearson, or IELTS preparation materials.

INTENDED CONTRAST

Evaluate the complete set of options.

A question is acceptable when:

- one option is clearly the best standard answer;
- distractors are grammatically or semantically inferior in the given context;
- another option would require a different meaning, an unusual interpretation,
  non-standard usage, or additional unstated context;
- the tested distinction is conventional and appropriate for the CEFR level.

Do not demand that every distractor be impossible in every imaginable
English sentence. It only needs to be clearly wrong or clearly inferior
in the question as written.

AMBIGUITY

Use "ambiguous_answer" only when two or more listed options are genuinely
acceptable standard answers with essentially the same intended meaning
and no reasonable examiner could consistently prefer one.

Examples that normally should NOT be rejected solely for ambiguity:

- a standard tense answer versus a theoretically possible tense under
  a different discourse interpretation;
- a standard British or international exam form versus an informal
  regional or dialectal form;
- a conventional collocation versus a word that could work only with
  a changed meaning;
- a standard reported-speech transformation versus optional non-backshift
  requiring a specially preserved time perspective;
- a standard countability distinction versus widespread but non-standard usage.

SEVERITY

Use "critical" only when the problem makes the question unsafe to use:

- two listed answers are genuinely equally correct;
- the marked answer is wrong;
- the passage contradicts the answer;
- required information is missing;
- the question is materially inappropriate for the stated CEFR level;
- the explanation teaches an incorrect rule;
- the prompt or options are malformed.

Use "major" for a substantial defect that makes revision necessary but
does not involve a clearly wrong answer or a fundamentally broken item.

Use "minor" for:

- slightly awkward but understandable wording;
- an explanation that could be clearer but is not incorrect;
- a harmless style issue;
- a small passage-reference imprecision that does not affect the answer.

Do not reject an otherwise valid question only because of a minor style
preference. Minor issues should be reported only when correction provides
clear educational value.

EXPLANATIONS

An explanation is acceptable when it correctly explains why the marked
answer is the best standard answer.

Do not require it to discuss every theoretical exception, dialect,
register, or alternative discourse context.

READING QUESTIONS

Reject for passage mismatch only when the question, answer, or explanation
depends on information that is absent from or contradicted by the passage.

Do not reject harmless labels or paraphrases unless they introduce a
material unsupported fact.

FINAL DECISION

Approve the question when it has one clearly best standard answer for the
intended CEFR-level assessment context.

Reject only for concrete, meaningful defects that justify regenerating
the question.

Be conservative about rejection. Do not search for remote hypothetical
interpretations.

Do not rewrite questions. Return only the requested structured result.
`;

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reviews: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: {
            type: "integer",
            minimum: 0,
          },
          approved: {
            type: "boolean",
          },
          severity: {
            type: "string",
            enum: [
              "none",
              "minor",
              "major",
              "critical",
            ],
          },
          issues: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "incorrect_answer",
                "ambiguous_answer",
                "invalid_options",
                "cefr_mismatch",
                "unnatural_english",
                "passage_mismatch",
                "weak_explanation",
                "category_mismatch",
                "question_type_mismatch",
                "other",
              ],
            },
          },
          feedback_uk: {
            type: "string",
          },
        },
        required: [
          "index",
          "approved",
          "severity",
          "issues",
          "feedback_uk",
        ],
      },
    },
  },
  required: ["reviews"],
};

function parseIntegerEnvironmentVariable(
  name,
  fallback,
) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 0
  ) {
    throw new Error(
      `${name} must be a non-negative integer. Received: "${rawValue}".`,
    );
  }

  return parsedValue;
}

function getBatchSize() {
  const batchSize =
    parseIntegerEnvironmentVariable(
      "QUESTION_REVIEW_BATCH_SIZE",
      DEFAULT_BATCH_SIZE,
    );

  if (batchSize < 1) {
    throw new Error(
      "QUESTION_REVIEW_BATCH_SIZE must be at least 1.",
    );
  }

  return batchSize;
}

function getMaxRejectionsPerRound() {
  return parseIntegerEnvironmentVariable(
    "QUESTION_MAX_QUALITY_REJECTIONS_PER_ROUND",
    DEFAULT_MAX_REJECTIONS_PER_ROUND,
  );
}

function getMaxReviewRounds() {
  const maxReviewRounds =
    parseIntegerEnvironmentVariable(
      "QUESTION_MAX_QUALITY_REVIEW_ROUNDS",
      DEFAULT_MAX_REVIEW_ROUNDS,
    );

  if (maxReviewRounds < 1) {
    throw new Error(
      "QUESTION_MAX_QUALITY_REVIEW_ROUNDS must be at least 1.",
    );
  }

  return maxReviewRounds;
}

function buildReviewPrompt({
  level,
  questions,
}) {
  return [
    `Review the following English assessment questions for CEFR level ${level}.`,
    "",
    'Evaluate every item using the "clearly best standard answer" rule.',
    "",
    "Do not reject an item merely because another option could become correct",
    "under a different invented context, unusual dialect, informal usage,",
    "non-standard usage, or theoretical discourse interpretation.",
    "",
    "When one option is clearly the expected answer in a standard CEFR exam,",
    "approve the question.",
    "",
    "For each question, check:",
    "1. The stated correct_answer is the clearly best standard answer.",
    "2. No other listed option is genuinely equally acceptable in the given context.",
    "3. The English is natural and grammatically correct.",
    `4. The difficulty is appropriate for CEFR ${level}.`,
    "5. The category and question_type match the task.",
    "6. For reading questions, the answer is supported by the passage.",
    "7. The Ukrainian explanation is accurate and useful.",
    "",
    "Approval rules:",
    "- approved=true when the question is safe to publish without meaningful changes.",
    "- Use critical only for defects that make the item unsafe to use.",
    "- Use major for substantial defects that require revision.",
    "- Minor stylistic preferences alone must not cause rejection.",
    "- Do not require distractors to be impossible in every imaginable context.",
    "- Return one review for every supplied index.",
    "",
    JSON.stringify(questions, null, 2),
  ].join("\n");
}

function parseResponseOutput(response) {
  const outputText = response.output_text;

  if (
    typeof outputText !== "string" ||
    outputText.trim().length === 0
  ) {
    throw new Error(
      "Quality reviewer returned an empty response.",
    );
  }

  try {
    return JSON.parse(outputText);
  } catch (error) {
    throw new Error(
      `Could not parse quality review JSON: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }
}

function validateReviewBatch({
  result,
  expectedIndexes,
}) {
  if (!Array.isArray(result?.reviews)) {
    throw new Error(
      "Quality review result does not contain reviews array.",
    );
  }

  const expectedSet = new Set(expectedIndexes);
  const receivedSet = new Set();

  for (const review of result.reviews) {
    if (!expectedSet.has(review.index)) {
      throw new Error(
        `Quality reviewer returned unexpected index ${review.index}.`,
      );
    }

    if (receivedSet.has(review.index)) {
      throw new Error(
        `Quality reviewer returned duplicate index ${review.index}.`,
      );
    }

    receivedSet.add(review.index);
  }

  for (const index of expectedIndexes) {
    if (!receivedSet.has(index)) {
      throw new Error(
        `Quality reviewer omitted question index ${index}.`,
      );
    }
  }

  return result.reviews;
}

async function reviewBatch({
  client,
  model,
  level,
  questions,
}) {
  const payload = questions.map(
    ({ index, question }) => ({
      index,
      question,
    }),
  );

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= DEFAULT_REVIEW_ATTEMPTS;
    attempt += 1
  ) {
    try {
      const response =
        await client.responses.create({
          model,
          input: [
            {
              role: "system",
              content:
                QUALITY_REVIEW_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: buildReviewPrompt({
                level,
                questions: payload,
              }),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "assessment_quality_review",
              strict: true,
              schema: REVIEW_SCHEMA,
            },
          },
        });

      const result =
        parseResponseOutput(response);

      return validateReviewBatch({
        result,
        expectedIndexes: payload.map(
          (item) => item.index,
        ),
      });
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(String(error));

      console.error(
        `Quality review batch failed, attempt ${attempt}/${DEFAULT_REVIEW_ATTEMPTS}: ${lastError.message}`,
      );
    }
  }

  throw new Error(
    `Quality review failed after ${DEFAULT_REVIEW_ATTEMPTS} attempts. Last error: ${lastError?.message ?? "Unknown error"}`,
  );
}

async function reviewAllQuestions({
  client,
  model,
  level,
  questions,
}) {
  const batchSize = getBatchSize();
  const reviews = [];

  for (
    let startIndex = 0;
    startIndex < questions.length;
    startIndex += batchSize
  ) {
    const endIndex = Math.min(
      startIndex + batchSize,
      questions.length,
    );

    console.log(
      `Reviewing questions ${startIndex + 1}-${endIndex}/${questions.length}...`,
    );

    const batch = questions
      .slice(startIndex, endIndex)
      .map((question, offset) => ({
        index: startIndex + offset,
        question,
      }));

    const batchReviews =
      await reviewBatch({
        client,
        model,
        level,
        questions: batch,
      });

    reviews.push(...batchReviews);
  }

  return reviews.sort(
    (reviewA, reviewB) =>
      reviewA.index - reviewB.index,
  );
}

function getRejectedReviews(reviews) {
  return reviews.filter(
    (review) =>
      review.severity === "major" ||
      review.severity === "critical",
  );
}

function printRejectedReviews({
  rejectedReviews,
  questions,
  round,
}) {
  console.log("");
  console.log(
    `AI quality review rejected ${rejectedReviews.length} question(s) in round ${round}.`,
  );

  for (const review of rejectedReviews) {
    const question =
      questions[review.index];

    console.log("");
    console.log(
      `Question ${review.index + 1} rejected.`,
    );
    console.log(`Prompt: ${question.prompt}`);
    console.log(
      `Severity: ${review.severity}`,
    );
    console.log(
      `Issues: ${
        review.issues.length > 0
          ? review.issues.join(", ")
          : "unspecified"
      }`,
    );
    console.log(
      `Feedback: ${review.feedback_uk}`,
    );
  }
}

export async function repairQualityIssues({
  client,
  model,
  level,
  questions,
  generateReplacement,
}) {
  const maxRejectionsPerRound =
    getMaxRejectionsPerRound();

  const maxReviewRounds =
    getMaxReviewRounds();

  const workingQuestions = [...questions];

  console.log("");
  console.log("Running AI quality review...");
  console.log(`Review model: ${model}`);
  console.log(
    `Maximum review rounds: ${maxReviewRounds}`,
  );
  console.log(
    `Maximum rejections per round: ${maxRejectionsPerRound}`,
  );

  let totalRepairs = 0;

  for (
    let round = 1;
    round <= maxReviewRounds;
    round += 1
  ) {
    console.log("");
    console.log(
      `Quality review round ${round}/${maxReviewRounds}...`,
    );

    const reviews =
      await reviewAllQuestions({
        client,
        model,
        level,
        questions: workingQuestions,
      });

    const rejectedReviews =
      getRejectedReviews(reviews);

    if (rejectedReviews.length === 0) {
      console.log(
        `AI quality review completed. Replaced: ${totalRepairs}.`,
      );

      return workingQuestions;
    }

    printRejectedReviews({
      rejectedReviews,
      questions: workingQuestions,
      round,
    });

    if (
      rejectedReviews.length >
      maxRejectionsPerRound
    ) {
      throw new Error(
        [
          `AI quality review rejected ${rejectedReviews.length} questions`,
          `in round ${round}.`,
          `Maximum allowed per round: ${maxRejectionsPerRound}.`,
        ].join(" "),
      );
    }

    if (round === maxReviewRounds) {
      throw new Error(
        [
          `AI quality review still rejected ${rejectedReviews.length} question(s)`,
          `after ${maxReviewRounds} review round(s).`,
          `Total replacements completed: ${totalRepairs}.`,
        ].join(" "),
      );
    }

    /*
     * Replace rejected questions one by one.
     * The next review round checks the complete bank again.
     */
    for (const review of rejectedReviews) {
      const oldQuestion =
        workingQuestions[review.index];

      const blockedQuestions =
        workingQuestions.filter(
          (_, index) => index !== review.index,
        );

      console.log(
        `Generating quality replacement for question ${review.index + 1}...`,
      );

      const replacement =
        await generateReplacement({
          category: oldQuestion.category,
          blockedQuestions,
          reviewFeedback: review,
        });

      workingQuestions[review.index] =
        replacement;

      totalRepairs += 1;

      console.log(
        `Question ${review.index + 1} replaced.`,
      );
      console.log(
        `New prompt: ${replacement.prompt}`,
      );
    }
  }

  throw new Error(
    "AI quality review ended unexpectedly.",
  );
}
