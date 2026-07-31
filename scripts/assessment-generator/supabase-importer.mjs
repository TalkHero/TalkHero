import {
  createClient,
} from "@supabase/supabase-js";

const TABLE_NAME =
  "assessment_questions";

const DEFAULT_BATCH_SIZE = 100;

function getEnvironmentValue(name) {
  const value = process.env[name];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${name} is missing from .env.local.`,
    );
  }

  return value.trim();
}

function createSupabaseAdminClient() {
  const supabaseUrl =
    getEnvironmentValue("SUPABASE_URL");

  const secretKey =
    getEnvironmentValue(
      "SUPABASE_SECRET_KEY",
    );

  return createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function prepareQuestion(question) {
  if (
    typeof question?.question_code !==
      "string" ||
    question.question_code.trim().length === 0
  ) {
    throw new Error(
      `Question is missing question_code: "${question?.prompt ?? "unknown"}".`,
    );
  }

  return {
    question_code:
      question.question_code,
    cefr_level:
      question.cefr_level,
    category:
      question.category,
    question_type:
      question.question_type,
    prompt:
      question.prompt,
    passage:
      question.passage ?? null,
    options:
      question.options,
    correct_answer:
      question.correct_answer,
    explanation_uk:
      question.explanation_uk,
    difficulty:
      question.difficulty,
    discrimination:
      question.discrimination,
    estimated_time_seconds:
      question.estimated_time_seconds,
    topic:
      question.topic,
    tags:
      question.tags,
    source:
      question.source,
    status:
      question.status,
    updated_at:
      new Date().toISOString(),
  };
}

function splitIntoBatches(
  values,
  batchSize,
) {
  const batches = [];

  for (
    let index = 0;
    index < values.length;
    index += batchSize
  ) {
    batches.push(
      values.slice(
        index,
        index + batchSize,
      ),
    );
  }

  return batches;
}

export async function importQuestionsToSupabase({
  questions,
  level,
}) {
  if (
    !Array.isArray(questions) ||
    questions.length === 0
  ) {
    throw new Error(
      "No questions were supplied for Supabase import.",
    );
  }

  const supabase =
    createSupabaseAdminClient();

  const payload =
    questions.map(prepareQuestion);

  const uniqueCodes = new Set(
    payload.map(
      (question) =>
        question.question_code,
    ),
  );

  if (
    uniqueCodes.size !== payload.length
  ) {
    throw new Error(
      "Duplicate question_code values detected before Supabase import.",
    );
  }

  console.log("");
  console.log(
    "Importing questions into Supabase...",
  );
  console.log(`Level: ${level}`);
  console.log(
    `Questions: ${payload.length}`,
  );

  const batches =
    splitIntoBatches(
      payload,
      DEFAULT_BATCH_SIZE,
    );

  let importedCount = 0;

  for (
    let index = 0;
    index < batches.length;
    index += 1
  ) {
    const batch = batches[index];

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(batch, {
        onConflict: "question_code",
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(
        [
          `Supabase import failed for batch ${index + 1}/${batches.length}.`,
          error.message,
        ].join(" "),
      );
    }

    importedCount += batch.length;

    console.log(
      `Imported batch ${index + 1}/${batches.length}: ${batch.length} question(s).`,
    );
  }

  await verifySupabaseImport({
    supabase,
    questions: payload,
    level,
  });

  console.log(
    `Supabase import completed: ${importedCount} question(s).`,
  );
}

async function verifySupabaseImport({
  supabase,
  questions,
  level,
}) {
  const expectedCodes =
    questions.map(
      (question) =>
        question.question_code,
    );

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      "question_code, cefr_level, category, status",
    )
    .in(
      "question_code",
      expectedCodes,
    );

  if (error) {
    throw new Error(
      `Could not verify Supabase import: ${error.message}`,
    );
  }

  const receivedCodes = new Set(
    (data ?? []).map(
      (row) => row.question_code,
    ),
  );

  const missingCodes =
    expectedCodes.filter(
      (code) =>
        !receivedCodes.has(code),
    );

  if (missingCodes.length > 0) {
    throw new Error(
      [
        "Supabase import verification failed.",
        `Missing codes: ${missingCodes.join(", ")}.`,
      ].join(" "),
    );
  }

  const invalidLevelRows =
    (data ?? []).filter(
      (row) =>
        row.cefr_level !== level,
    );

  if (invalidLevelRows.length > 0) {
    throw new Error(
      `Supabase verification found ${invalidLevelRows.length} row(s) with an incorrect CEFR level.`,
    );
  }

  console.log(
    `Verified ${receivedCodes.size}/${expectedCodes.length} imported question(s).`,
  );
}
