import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFilePath);
const projectRoot = path.resolve(scriptsDirectory, "..");

const envFilePath = path.join(projectRoot, ".env.local");
const questionBankDirectory = path.join(
  projectRoot,
  "question-bank",
);

const REQUIRED_STRING_FIELDS = [
 "question_code",
  "cefr_level",
  "category",
  "question_type",
  "prompt",
  "correct_answer",
  "explanation_uk",
  "topic",
  "source",
  "status",
];

async function loadEnvironmentFile(filePath) {
  let content;

  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read environment file: ${filePath}`,
      { cause: error },
    );
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    let value = line
      .slice(separatorIndex + 1)
      .trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function findJsonFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findJsonFiles(entryPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".json")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function assertStringField(question, fieldName, context) {
  const value = question[fieldName];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${context}: field "${fieldName}" must be a non-empty string`,
    );
  }
}

function validateQuestion(question, context) {
  if (
    typeof question !== "object" ||
    question === null ||
    Array.isArray(question)
  ) {
    throw new Error(`${context}: question must be an object`);
  }

  for (const fieldName of REQUIRED_STRING_FIELDS) {
    assertStringField(question, fieldName, context);
  }

  if (
    question.passage !== null &&
    question.passage !== undefined &&
    typeof question.passage !== "string"
  ) {
    throw new Error(
      `${context}: field "passage" must be a string or null`,
    );
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length < 2 ||
    !question.options.every(
      (option) =>
        typeof option === "string" &&
        option.trim().length > 0,
    )
  ) {
    throw new Error(
      `${context}: field "options" must contain at least two strings`,
    );
  }

  if (
    !Number.isInteger(question.difficulty) ||
    question.difficulty < 1 ||
    question.difficulty > 5
  ) {
    throw new Error(
      `${context}: field "difficulty" must be an integer from 1 to 5`,
    );
  }

  if (
    typeof question.discrimination !== "number" ||
    question.discrimination < 0
  ) {
    throw new Error(
      `${context}: field "discrimination" must be a non-negative number`,
    );
  }

  if (
    question.estimated_time_seconds !== null &&
    question.estimated_time_seconds !== undefined &&
    (
      !Number.isInteger(question.estimated_time_seconds) ||
      question.estimated_time_seconds <= 0
    )
  ) {
    throw new Error(
      `${context}: field "estimated_time_seconds" must be a positive integer or null`,
    );
  }

  if (
    !Array.isArray(question.tags) ||
    !question.tags.every(
      (tag) =>
        typeof tag === "string" &&
        tag.trim().length > 0,
    )
  ) {
    throw new Error(
      `${context}: field "tags" must be an array of strings`,
    );
  }

  const allowedLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
  ];

  if (!allowedLevels.includes(question.cefr_level)) {
    throw new Error(
      `${context}: unsupported cefr_level "${question.cefr_level}"`,
    );
  }

  const supportedCategories = new Set([
    "grammar",
    "vocabulary",
    "reading",
    "cloze",
    "use_of_english",
  ]);

  if (!supportedCategories.has(question.category)) {
    throw new Error(
      `${context}: unsupported category "${question.category}"`,
    );
  }

  const allowedQuestionTypes = [
    "multiple_choice",
    "fill_gap",
    "reading_choice",
    "true_false",
  ];


  if (
    !allowedQuestionTypes.includes(question.question_type)
  ) {
    throw new Error(
      `${context}: unsupported question_type "${question.question_type}"`,
    );
  }

  if (question.status !== "published") {
    throw new Error(
      `${context}: imported questions must have status "published"`,
    );
  }

  if (!question.options.includes(question.correct_answer)) {
    throw new Error(
      `${context}: correct_answer must match one of the options`,
    );
  }

 return {
  question_code: question.question_code.trim(),
  cefr_level: question.cefr_level,
  category: question.category,
  question_type: question.question_type,
  prompt: question.prompt.trim(),
  passage: question.passage?.trim() || null,
  options: question.options,
  correct_answer: question.correct_answer,
  explanation_uk: question.explanation_uk.trim(),
  difficulty: question.difficulty,
  discrimination: question.discrimination,
  estimated_time_seconds:
    question.estimated_time_seconds ?? null,
  topic: question.topic.trim(),
  tags: question.tags,
  source: "ai_assisted",
  status: question.status,
};
}

async function loadQuestionFiles() {
  const jsonFiles = await findJsonFiles(
    questionBankDirectory,
  );

  if (jsonFiles.length === 0) {
    throw new Error(
      `No JSON files found in ${questionBankDirectory}`,
    );
  }

  const questions = [];

  for (const filePath of jsonFiles.sort()) {
    const relativePath = path.relative(
      projectRoot,
      filePath,
    );

    const content = (
  await fs.readFile(filePath, "utf8")
).replace(/^\uFEFF/, "");

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `${relativePath}: invalid JSON`,
        { cause: error },
      );
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        `${relativePath}: root JSON value must be an array`,
      );
    }

    parsed.forEach((question, index) => {
      questions.push(
        validateQuestion(
          question,
          `${relativePath}, item ${index + 1}`,
        ),
      );
    });
  }

  return {
    questions,
    fileCount: jsonFiles.length,
  };
}

function printQuestionSummary(questions) {
  const summary = new Map();

  for (const question of questions) {
    const key = [
      question.cefr_level,
      question.category,
      question.question_type,
    ].join(" / ");

    summary.set(key, (summary.get(key) ?? 0) + 1);
  }

  console.log("\nQuestion summary:");

  for (
    const [key, count] of [...summary.entries()].sort()
  ) {
    console.log(`  ${key}: ${count}`);
  }
}

async function main() {
  await loadEnvironmentFile(envFilePath);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const { questions, fileCount } =
    await loadQuestionFiles();

  if (questions.length === 0) {
    throw new Error("Question bank is empty");
  }

  console.log(
    `Loaded ${questions.length} questions from ${fileCount} JSON file(s).`,
  );

  printQuestionSummary(questions);



  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

console.log("\nSynchronizing questions...");

const { data, error } = await supabase
  .from("assessment_questions")
  .upsert(questions, {
    onConflict: "question_code",
  })
  .select("id");

if (error) {
  throw new Error(
    `Question synchronization failed: ${error.message}`,
  );
}

console.log(
  `\nQuestion synchronization completed. Synced: ${data?.length ?? questions.length} question(s).`,
);
}

main().catch((error) => {
  console.error("\nQuestion bank import failed:");
  console.error(error);

  process.exitCode = 1;
});
