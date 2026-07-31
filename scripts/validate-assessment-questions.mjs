import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";

const LEVEL_CONFIG = {
  A1: {
    grammar: 8,
    vocabulary: 7,
    reading: 5,
  },
  A2: {
    grammar: 8,
    vocabulary: 7,
    reading: 5,
  },
  B1: {
    grammar: 15,
    vocabulary: 15,
    reading: 10,
    cloze: 5,
    use_of_english: 5,
  },
  B2: {
    grammar: 18,
    vocabulary: 18,
    reading: 12,
    cloze: 6,
    use_of_english: 6,
  },
  C1: {
    grammar: 20,
    vocabulary: 20,
    reading: 15,
    cloze: 8,
    use_of_english: 7,
  },
};

const SUPPORTED_LEVELS = Object.keys(LEVEL_CONFIG);

function parseArgs(argv) {
  const args = argv.slice(2);
  const levelIndex = args.indexOf("--level");
  const thresholdIndex = args.indexOf("--threshold");

  if (levelIndex === -1 || !args[levelIndex + 1]) {
    throw new Error(
      `Missing --level. Supported levels: ${SUPPORTED_LEVELS.join(", ")}`,
    );
  }

  const level = args[levelIndex + 1].trim().toUpperCase();

  if (!SUPPORTED_LEVELS.includes(level)) {
    throw new Error(
      `Unsupported level "${level}". Supported levels: ${SUPPORTED_LEVELS.join(", ")}`,
    );
  }

  const rawThreshold =
    thresholdIndex !== -1 ? args[thresholdIndex + 1] : "0.92";

  const similarityThreshold = Number(rawThreshold);

  if (
    Number.isNaN(similarityThreshold) ||
    similarityThreshold < 0.7 ||
    similarityThreshold > 1
  ) {
    throw new Error(
      "--threshold must be a number between 0.7 and 1.",
    );
  }

  return {
    level,
    similarityThreshold,
    useEmbeddings: !args.includes("--no-embeddings"),
  };
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase();
}

function getQuestionType(category) {
  return category === "reading"
    ? "reading_choice"
    : "multiple_choice";
}

function getExpectedTotal(config) {
  return Object.values(config).reduce(
    (total, count) => total + count,
    0,
  );
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function findQuestionFiles(rootDirectory) {
  const result = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".json") &&
        /^english-[a-z0-9-]+\.json$/i.test(entry.name)
      ) {
        result.push(entryPath);
      }
    }
  }

  if (await fileExists(rootDirectory)) {
    await walk(rootDirectory);
  }

  return result;
}

function createIssue({
  severity,
  code,
  message,
  questionIndex = null,
  relatedQuestionIndex = null,
  relatedLevel = null,
  similarity = null,
}) {
  return {
    severity,
    code,
    message,
    question_index: questionIndex,
    related_question_index: relatedQuestionIndex,
    related_level: relatedLevel,
    similarity,
  };
}

function validateQuestionStructure(question, index, level) {
  const issues = [];
  const prefix = `Question ${index + 1}`;

  const requiredFields = [
    "cefr_level",
    "category",
    "question_type",
    "prompt",
    "passage",
    "options",
    "correct_answer",
    "explanation_uk",
    "difficulty",
    "discrimination",
    "estimated_time_seconds",
    "topic",
    "tags",
    "source",
    "status",
  ];

  for (const field of requiredFields) {
    if (!Object.hasOwn(question, field)) {
      issues.push(
        createIssue({
          severity: "error",
          code: "missing_field",
          message: `${prefix}: missing field "${field}".`,
          questionIndex: index,
        }),
      );
    }
  }

  if (question.cefr_level !== level) {
    issues.push(
      createIssue({
        severity: "error",
        code: "wrong_level",
        message: `${prefix}: expected level ${level}, received ${question.cefr_level}.`,
        questionIndex: index,
      }),
    );
  }

  if (!Object.hasOwn(LEVEL_CONFIG[level], question.category)) {
    issues.push(
      createIssue({
        severity: "error",
        code: "invalid_category",
        message: `${prefix}: category "${question.category}" is not configured for ${level}.`,
        questionIndex: index,
      }),
    );
  }

  const expectedType = getQuestionType(question.category);

  if (question.question_type !== expectedType) {
    issues.push(
      createIssue({
        severity: "error",
        code: "wrong_question_type",
        message: `${prefix}: category "${question.category}" requires "${expectedType}".`,
        questionIndex: index,
      }),
    );
  }

  if (
    typeof question.prompt !== "string" ||
    !question.prompt.trim()
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "empty_prompt",
        message: `${prefix}: prompt is empty.`,
        questionIndex: index,
      }),
    );
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length !== 4
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "invalid_options_count",
        message: `${prefix}: exactly four options are required.`,
        questionIndex: index,
      }),
    );
  } else {
    const normalizedOptions = question.options.map(normalizeText);

    if (new Set(normalizedOptions).size !== 4) {
      issues.push(
        createIssue({
          severity: "error",
          code: "duplicate_options",
          message: `${prefix}: options must be unique.`,
          questionIndex: index,
        }),
      );
    }

    if (!question.options.includes(question.correct_answer)) {
      issues.push(
        createIssue({
          severity: "error",
          code: "correct_answer_not_in_options",
          message: `${prefix}: correct_answer does not exactly match an option.`,
          questionIndex: index,
        }),
      );
    }
  }

  if (question.category === "reading") {
    if (
      typeof question.passage !== "string" ||
      !question.passage.trim()
    ) {
      issues.push(
        createIssue({
          severity: "error",
          code: "missing_reading_passage",
          message: `${prefix}: reading question requires a passage.`,
          questionIndex: index,
        }),
      );
    }
  } else if (question.passage !== null) {
    issues.push(
      createIssue({
        severity: "error",
        code: "unexpected_passage",
        message: `${prefix}: non-reading question must have passage=null.`,
        questionIndex: index,
      }),
    );
  }

  if (
    ["cloze", "use_of_english"].includes(question.category) &&
    !question.prompt?.includes("___")
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "missing_blank",
        message: `${prefix}: prompt must contain ___.`,
        questionIndex: index,
      }),
    );
  }

  if (
    !Number.isInteger(question.difficulty) ||
    question.difficulty < 1 ||
    question.difficulty > 5
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "invalid_difficulty",
        message: `${prefix}: difficulty must be an integer from 1 to 5.`,
        questionIndex: index,
      }),
    );
  }

  if (
    typeof question.discrimination !== "number" ||
    question.discrimination < 0.8 ||
    question.discrimination > 1.3
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "invalid_discrimination",
        message: `${prefix}: discrimination must be from 0.8 to 1.3.`,
        questionIndex: index,
      }),
    );
  }

  if (
    !Number.isInteger(question.estimated_time_seconds) ||
    question.estimated_time_seconds < 20 ||
    question.estimated_time_seconds > 120
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "invalid_estimated_time",
        message: `${prefix}: estimated_time_seconds must be from 20 to 120.`,
        questionIndex: index,
      }),
    );
  }

  if (
    typeof question.explanation_uk !== "string" ||
    question.explanation_uk.trim().length < 5
  ) {
    issues.push(
      createIssue({
        severity: "error",
        code: "invalid_explanation",
        message: `${prefix}: explanation_uk is empty or too short.`,
        questionIndex: index,
      }),
    );
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    issues.push(
      createIssue({
        severity: "warning",
        code: "missing_tags",
        message: `${prefix}: at least one tag is recommended.`,
        questionIndex: index,
      }),
    );
  }

  return issues;
}

function validateDistribution(questions, level) {
  const issues = [];
  const config = LEVEL_CONFIG[level];

  if (questions.length !== getExpectedTotal(config)) {
    issues.push(
      createIssue({
        severity: "error",
        code: "wrong_total",
        message:
          `Expected ${getExpectedTotal(config)} questions, ` +
          `received ${questions.length}.`,
      }),
    );
  }

  for (const [category, expectedCount] of Object.entries(config)) {
    const actualCount = questions.filter(
      (question) => question.category === category,
    ).length;

    if (actualCount !== expectedCount) {
      issues.push(
        createIssue({
          severity: "error",
          code: "wrong_category_count",
          message:
            `Category "${category}": expected ${expectedCount}, ` +
            `received ${actualCount}.`,
        }),
      );
    }
  }

  return issues;
}

function findExactDuplicates(questions) {
  const issues = [];
  const seen = new Map();

  questions.forEach((question, index) => {
    const normalizedPrompt = normalizeText(question.prompt);

    if (seen.has(normalizedPrompt)) {
      const previousIndex = seen.get(normalizedPrompt);

      issues.push(
        createIssue({
          severity: "error",
          code: "exact_duplicate",
          message:
            `Question ${index + 1} duplicates question ` +
            `${previousIndex + 1}: "${question.prompt}"`,
          questionIndex: index,
          relatedQuestionIndex: previousIndex,
          similarity: 1,
        }),
      );
    } else {
      seen.set(normalizedPrompt, index);
    }
  });

  return issues;
}

function analyseTopicBalance(questions) {
  const issues = [];
  const categoryGroups = new Map();

  questions.forEach((question, index) => {
    if (!categoryGroups.has(question.category)) {
      categoryGroups.set(question.category, []);
    }

    categoryGroups.get(question.category).push({
      index,
      topic: normalizeText(question.topic),
    });
  });

  for (const [category, entries] of categoryGroups.entries()) {
    const topicCounts = new Map();

    for (const entry of entries) {
      const current = topicCounts.get(entry.topic) ?? [];
      current.push(entry.index);
      topicCounts.set(entry.topic, current);
    }

    for (const [topic, indexes] of topicCounts.entries()) {
      const ratio = indexes.length / entries.length;

      if (indexes.length >= 4 && ratio >= 0.35) {
        issues.push(
          createIssue({
            severity: "warning",
            code: "topic_overuse",
            message:
              `Category "${category}" overuses topic "${topic}" ` +
              `in ${indexes.length}/${entries.length} questions.`,
          }),
        );
      }
    }
  }

  return issues;
}

function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    dotProduct += vectorA[index] * vectorB[index];
    magnitudeA += vectorA[index] ** 2;
    magnitudeB += vectorB[index] ** 2;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function buildEmbeddingText(question) {
  return [
    `Level: ${question.cefr_level}`,
    `Category: ${question.category}`,
    `Topic: ${question.topic}`,
    `Prompt: ${question.prompt}`,
    question.passage ? `Passage: ${question.passage}` : "",
    `Options: ${(question.options ?? []).join(" | ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function createEmbeddings(client, model, texts) {
  const batchSize = 100;
  const embeddings = [];

  for (let offset = 0; offset < texts.length; offset += batchSize) {
    const batch = texts.slice(offset, offset + batchSize);

    const response = await client.embeddings.create({
      model,
      input: batch,
      encoding_format: "float",
    });

    const ordered = [...response.data].sort(
      (a, b) => a.index - b.index,
    );

    embeddings.push(...ordered.map((item) => item.embedding));
  }

  return embeddings;
}

async function loadOtherQuestions(questionBankRoot, targetFilePath) {
  const files = await findQuestionFiles(questionBankRoot);
  const targetResolved = path.resolve(targetFilePath);
  const questions = [];

  for (const filePath of files) {
    if (path.resolve(filePath) === targetResolved) {
      continue;
    }

    const parsed = await readJsonFile(filePath);

    if (!Array.isArray(parsed)) {
      continue;
    }

    parsed.forEach((question, index) => {
      if (
        question &&
        typeof question === "object" &&
        typeof question.prompt === "string"
      ) {
        questions.push({
          ...question,
          _source_file: filePath,
          _source_index: index,
        });
      }
    });
  }

  return questions;
}

async function findSemanticDuplicates({
  client,
  model,
  questions,
  otherQuestions,
  threshold,
}) {
  const issues = [];

  const allQuestions = [...questions, ...otherQuestions];
  const texts = allQuestions.map(buildEmbeddingText);

  console.log(
    `Creating embeddings for ${allQuestions.length} question(s)...`,
  );

  const embeddings = await createEmbeddings(
    client,
    model,
    texts,
  );

  const targetEmbeddings = embeddings.slice(0, questions.length);
  const otherEmbeddings = embeddings.slice(questions.length);

  for (let first = 0; first < questions.length; first += 1) {
    for (
      let second = first + 1;
      second < questions.length;
      second += 1
    ) {
      const similarity = cosineSimilarity(
        targetEmbeddings[first],
        targetEmbeddings[second],
      );

      if (similarity >= threshold) {
        issues.push(
          createIssue({
            severity: "warning",
            code: "semantic_duplicate_internal",
            message:
              `Questions ${first + 1} and ${second + 1} are very similar ` +
              `(${similarity.toFixed(3)}).`,
            questionIndex: first,
            relatedQuestionIndex: second,
            similarity: Number(similarity.toFixed(4)),
          }),
        );
      }
    }

    for (
      let otherIndex = 0;
      otherIndex < otherQuestions.length;
      otherIndex += 1
    ) {
      const similarity = cosineSimilarity(
        targetEmbeddings[first],
        otherEmbeddings[otherIndex],
      );

      if (similarity >= threshold) {
        issues.push(
          createIssue({
            severity: "warning",
            code: "semantic_duplicate_cross_level",
            message:
              `Question ${first + 1} is similar to a local ` +
              `${otherQuestions[otherIndex].cefr_level ?? "unknown"} question ` +
              `(${similarity.toFixed(3)}): ` +
              `"${otherQuestions[otherIndex].prompt}"`,
            questionIndex: first,
            relatedQuestionIndex:
              otherQuestions[otherIndex]._source_index,
            relatedLevel:
              otherQuestions[otherIndex].cefr_level ?? null,
            similarity: Number(similarity.toFixed(4)),
          }),
        );
      }
    }
  }

  return issues;
}

function calculateStatistics(questions) {
  const totalSeconds = questions.reduce(
    (sum, question) =>
      sum + (Number(question.estimated_time_seconds) || 0),
    0,
  );

  const averageDifficulty =
    questions.length > 0
      ? questions.reduce(
          (sum, question) =>
            sum + (Number(question.difficulty) || 0),
          0,
        ) / questions.length
      : 0;

  const categories = {};

  for (const question of questions) {
    categories[question.category] =
      (categories[question.category] ?? 0) + 1;
  }

  return {
    total_questions: questions.length,
    categories,
    average_difficulty: Number(averageDifficulty.toFixed(2)),
    estimated_duration_minutes: Math.ceil(totalSeconds / 60),
  };
}

function calculateQualityScore(issues) {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "error") {
      score -= 12;
      continue;
    }

    if (issue.code === "semantic_duplicate_internal") {
      score -= 4;
      continue;
    }

    if (issue.code === "semantic_duplicate_cross_level") {
      score -= 2;
      continue;
    }

    score -= 1;
  }

  return Math.max(0, Math.min(100, score));
}

async function saveReport(level, report) {
  const reportDirectory = path.join(
    process.cwd(),
    "assessment-reports",
  );

  const reportPath = path.join(
    reportDirectory,
    `${level.toLowerCase()}-validation-report.json`,
  );

  await fs.mkdir(reportDirectory, {
    recursive: true,
  });

  await fs.writeFile(
    reportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  return reportPath;
}

function printReport(report, reportPath) {
  console.log("");
  console.log("Assessment validation report");
  console.log(`Level: ${report.level}`);
  console.log(
    `Questions: ${report.statistics.total_questions}`,
  );

  for (const [category, count] of Object.entries(
    report.statistics.categories,
  )) {
    console.log(`${category}: ${count}`);
  }

  console.log(
    `Average difficulty: ${report.statistics.average_difficulty}`,
  );
  console.log(
    `Estimated duration: ${report.statistics.estimated_duration_minutes} min`,
  );
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  console.log(`Quality score: ${report.quality_score}/100`);
  console.log(`Status: ${report.status}`);
  console.log("");
  console.log(`Report saved to: ${reportPath}`);

  if (report.issues.length > 0) {
    console.log("");
    console.log("Issues:");

    for (const issue of report.issues) {
      console.log(
        `[${issue.severity.toUpperCase()}] ${issue.message}`,
      );
    }
  }
}

async function main() {
  try {
    const {
      level,
      similarityThreshold,
      useEmbeddings,
    } = parseArgs(process.argv);

    const targetFilePath = path.join(
      process.cwd(),
      "question-bank",
      level,
      `english-${level.toLowerCase()}.json`,
    );

    if (!(await fileExists(targetFilePath))) {
      throw new Error(
        `Question bank not found: ${targetFilePath}`,
      );
    }

    const questions = await readJsonFile(targetFilePath);

    if (!Array.isArray(questions)) {
      throw new Error(
        `Expected a JSON array in ${targetFilePath}`,
      );
    }

    console.log("");
    console.log(`Validating ${level} assessment bank...`);
    console.log(`File: ${targetFilePath}`);
    console.log(`Questions: ${questions.length}`);

    const issues = [];

    issues.push(...validateDistribution(questions, level));

    questions.forEach((question, index) => {
      issues.push(
        ...validateQuestionStructure(question, index, level),
      );
    });

    issues.push(...findExactDuplicates(questions));
    issues.push(...analyseTopicBalance(questions));

    if (useEmbeddings) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is required for semantic validation.",
        );
      }

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const embeddingModel =
        process.env.OPENAI_EMBEDDING_MODEL ??
        "text-embedding-3-small";

      const otherQuestions = await loadOtherQuestions(
        path.join(process.cwd(), "question-bank"),
        targetFilePath,
      );

      console.log(
        `Comparing against ${otherQuestions.length} question(s) from other local banks...`,
      );
      console.log(`Embedding model: ${embeddingModel}`);
      console.log(
        `Similarity threshold: ${similarityThreshold}`,
      );

      issues.push(
        ...(await findSemanticDuplicates({
          client,
          model: embeddingModel,
          questions,
          otherQuestions,
          threshold: similarityThreshold,
        })),
      );
    } else {
      console.log(
        "Semantic validation skipped by --no-embeddings.",
      );
    }

    const statistics = calculateStatistics(questions);

    const errors = issues.filter(
      (issue) => issue.severity === "error",
    ).length;

    const warnings = issues.filter(
      (issue) => issue.severity === "warning",
    ).length;

    const qualityScore = calculateQualityScore(issues);

    const report = {
      generated_at: new Date().toISOString(),
      level,
      source_file: targetFilePath,
      semantic_validation_enabled: useEmbeddings,
      similarity_threshold: useEmbeddings
        ? similarityThreshold
        : null,
      statistics,
      summary: {
        errors,
        warnings,
      },
      quality_score: qualityScore,
      status: errors === 0 ? "passed" : "failed",
      issues,
    };

    const reportPath = await saveReport(level, report);

    printReport(report, reportPath);

    if (errors > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("");
    console.error("Assessment validation failed.");
    console.error(
      error instanceof Error ? error.message : String(error),
    );
    console.error("");

    process.exitCode = 1;
  }
}

await main();
