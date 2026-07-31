import process from "node:process";
import OpenAI from "openai";

import {
  LEVEL_CONFIG,
  SUPPORTED_LEVELS,
} from "./config.mjs";

import {
  getTotalQuestionCount,
  parseGeneratorArgs,
} from "./utils.mjs";

import { generateLevelQuestions } from "./generator.mjs";
import { validateCompleteBank } from "./validation.mjs";
import { saveQuestionBank } from "./file-store.mjs";

import {
  assignQuestionCodes,
} from "./question-codes.mjs";

import {
  importQuestionsToSupabase,
} from "./supabase-importer.mjs";

function printSummary({
  questions,
  level,
  config,
  filePath,
  model,
  importedToSupabase,
}) {
  console.log("");
  console.log("Generation completed.");
  console.log(`Level: ${level}`);
  console.log(`Model: ${model}`);
  console.log(`Total: ${questions.length}`);

  for (const category of Object.keys(config)) {
    const count = questions.filter(
      (question) =>
        question.category === category,
    ).length;

    console.log(`${category}: ${count}`);
  }

  console.log("");
  console.log(`Saved to: ${filePath}`);
  console.log("");

  console.log(
  importedToSupabase
    ? "Supabase import: completed."
    : "Supabase import: skipped."
);
}

export async function main() {
  try {
    const {
  level,
  force,
  semanticRepair,
  qualityReview,
  importToSupabase,
} = parseGeneratorArgs(
  process.argv,
  SUPPORTED_LEVELS,
);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is missing in C:\\TalkHero\\Web\\.env.local",
      );
    }

    const config = LEVEL_CONFIG[level];

    const model =
      process.env.OPENAI_QUESTION_MODEL ||
      process.env.OPENAI_PLACEMENT_MODEL ||
      "gpt-5-mini";

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("");
    console.log(
      `Generating separate ${level} assessment bank...`,
    );
    console.log(`Model: ${model}`);
    console.log(
      `Expected total: ${getTotalQuestionCount(config)}`,
    );
    console.log("");

   const generatedQuestions =
  await generateLevelQuestions({
    client,
    model,
    level,
    config,
    semanticRepair,
    qualityReview,
  });

validateCompleteBank({
  questions: generatedQuestions,
  level,
  config,
});

const questions =
  assignQuestionCodes({
    questions: generatedQuestions,
    level,
  });

const filePath =
  await saveQuestionBank({
    level,
    questions,
    force,
  });

if (importToSupabase) {
  await importQuestionsToSupabase({
    questions,
    level,
  });
} else {
  console.log("");
  console.log(
    "Supabase import skipped. Use --import to enable it.",
  );
}

printSummary({
  questions,
  level,
  config,
  filePath,
  model,
  importedToSupabase: importToSupabase,

});



  } catch (error) {
    console.error("");
    console.error("Question generation failed.");
    console.error(
      error instanceof Error
        ? error.message
        : String(error),
    );
    console.error("");

    process.exitCode = 1;
  }
}
