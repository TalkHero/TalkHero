import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AssessmentAnswerStatus,
  AssessmentQuestionRecord,
  PublicAssessmentQuestion,
} from "@/lib/testing/types";

import { AssessmentEngineError } from "./errors";
import {
  buildRecommendations,
  type LearningRecommendation,
} from "@/lib/ai/recommendations";

import type {
  AssessmentAttemptProgress,
} from "./start-attempt";

export type SubmitAssessmentAnswerInput = {
  userId: string;
  testSlug: string;
  attemptId: string;
  questionId: string;
  answer: unknown;
};

export type AssessmentAnswerEvaluation = {
  status: Extract<
    AssessmentAnswerStatus,
    "correct" | "incorrect"
  >;
  isCorrect: boolean;
  correctAnswer: unknown;
  explanationUk: string | null;
};

export type SubmitAssessmentAnswerResult = {
  attemptId: string;
  completed: boolean;
  passed: boolean | null;
  percentage: number | null;
  progress: AssessmentAttemptProgress;
  evaluation: AssessmentAnswerEvaluation;
  question: PublicAssessmentQuestion | null;
  recommendations: LearningRecommendation | null;
};

type AttemptRow = {
  id: string;
  user_id: string;
  test_id: string;
  status: string;
  current_question_index: number;
  answered_question_count: number;
  correct_answer_count: number;
  skipped_question_count: number;
  raw_score: number;
  max_score: number;
  metadata: Record<string, unknown> | null;
};

type AttemptItemRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  question_code: string;
  order_index: number;
  weight: number;
  question_snapshot: PublicAssessmentQuestion;
  user_answer: unknown;
  answer_status: AssessmentAnswerStatus;
  is_correct: boolean | null;
  raw_score: number | null;
  max_score: number;
  presented_at: string | null;
  response_time_ms: number | null;
  answered_at: string | null;
};

type AssessmentTestRow = {
  id: string;
  slug: string;
  test_type: string;
  cefr_level: string | null;
  question_count: number;
  passing_score: number | null;
};

function normalizeString(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

function normalizeAnswer(value: unknown): unknown {
  if (typeof value === "string") {
    return normalizeString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeAnswer);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [
          key,
          normalizeAnswer(record[key]),
        ]),
    );
  }

  return value;
}

function answersAreEqual(
  userAnswer: unknown,
  correctAnswer: unknown,
): boolean {
  const normalizedUserAnswer =
    normalizeAnswer(userAnswer);

  const normalizedCorrectAnswer =
    normalizeAnswer(correctAnswer);

  return (
    JSON.stringify(normalizedUserAnswer) ===
    JSON.stringify(normalizedCorrectAnswer)
  );
}

function validateAnswer(answer: unknown): void {
  if (typeof answer === "string") {
    if (answer.trim().length === 0) {
      throw new AssessmentEngineError(
        "INVALID_ANSWER",
        "Answer must not be empty",
      );
    }

    return;
  }

  if (
    typeof answer === "number" ||
    typeof answer === "boolean"
  ) {
    return;
  }

  if (Array.isArray(answer) && answer.length > 0) {
    return;
  }

  throw new AssessmentEngineError(
    "INVALID_ANSWER",
    "Unsupported answer value",
  );
}

function getQuestionCount(
  attempt: AttemptRow,
  test: AssessmentTestRow,
): number {
  const metadataQuestionCount =
    attempt.metadata?.questionCount;

  if (
    typeof metadataQuestionCount === "number" &&
    Number.isInteger(metadataQuestionCount) &&
    metadataQuestionCount > 0
  ) {
    return metadataQuestionCount;
  }

  return test.question_count;
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateResponseTimeMs(
  presentedAt: string | null,
  answeredAt: Date,
): number | null {
  if (!presentedAt) {
    return null;
  }

  const presentedAtMs = Date.parse(presentedAt);

  if (!Number.isFinite(presentedAtMs)) {
    return null;
  }

  const elapsedMs =
    answeredAt.getTime() - presentedAtMs;

  if (!Number.isFinite(elapsedMs)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      Math.round(elapsedMs),
      2_147_483_647,
    ),
  );
}

export async function submitAssessmentAnswer({
  userId,
  testSlug,
  attemptId,
  questionId,
  answer,
}: SubmitAssessmentAnswerInput): Promise<SubmitAssessmentAnswerResult> {
  const normalizedSlug = testSlug.trim().toLowerCase();

  if (!userId) {
    throw new AssessmentEngineError(
      "ATTEMPT_NOT_FOUND",
      "User ID is required",
    );
  }

  if (!normalizedSlug) {
    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      "Assessment test slug is required",
    );
  }

  if (!attemptId) {
    throw new AssessmentEngineError(
      "ATTEMPT_NOT_FOUND",
      "Assessment attempt ID is required",
    );
  }

  if (!questionId) {
    throw new AssessmentEngineError(
      "QUESTION_NOT_FOUND",
      "Assessment question ID is required",
    );
  }

  validateAnswer(answer);

  const admin = createAdminClient();

  const { data: testData, error: testError } =
    await admin
      .from("assessment_tests")
      .select(
        `
          id,
          slug,
          test_type,
          cefr_level,
          question_count,
          passing_score
        `,
      )
      .eq("slug", normalizedSlug)
      .maybeSingle();

  if (testError) {
    console.error(
      "Failed to load assessment test for answer submission:",
      testError,
    );

    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      "Failed to load assessment test",
      { testSlug: normalizedSlug },
    );
  }

  if (!testData) {
    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      `Assessment test not found: ${normalizedSlug}`,
      { testSlug: normalizedSlug },
    );
  }

  const test = testData as AssessmentTestRow;

  const { data: attemptData, error: attemptError } =
    await admin
      .from("assessment_attempts")
      .select(
        `
          id,
          user_id,
          test_id,
          status,
          current_question_index,
          answered_question_count,
          correct_answer_count,
          skipped_question_count,
          raw_score,
          max_score,
          metadata
        `,
      )
      .eq("id", attemptId)
      .eq("user_id", userId)
      .eq("test_id", test.id)
      .maybeSingle();

  if (attemptError) {
    console.error(
      "Failed to load assessment attempt for answer submission:",
      attemptError,
    );

    throw new AssessmentEngineError(
      "ATTEMPT_LOAD_FAILED",
      "Failed to load assessment attempt",
      {
        attemptId,
        userId,
        testId: test.id,
      },
    );
  }

  if (!attemptData) {
    throw new AssessmentEngineError(
      "ATTEMPT_NOT_FOUND",
      "Assessment attempt not found",
      {
        attemptId,
        userId,
        testId: test.id,
      },
    );
  }

  const attempt = attemptData as AttemptRow;

  if (attempt.status !== "in_progress") {
    throw new AssessmentEngineError(
      "ATTEMPT_NOT_IN_PROGRESS",
      "Assessment attempt is not in progress",
      {
        attemptId,
        status: attempt.status,
      },
    );
  }

  const { data: itemData, error: itemError } =
    await admin
      .from("assessment_attempt_items")
      .select(
        `
          id,
          attempt_id,
          question_id,
          question_code,
          order_index,
          weight,
          question_snapshot,
          user_answer,
          answer_status,
          is_correct,
          raw_score,
          max_score,
          presented_at,
          response_time_ms,
          answered_at
        `,
      )
      .eq("attempt_id", attempt.id)
      .eq(
        "order_index",
        attempt.current_question_index,
      )
      .maybeSingle();

  if (itemError) {
    console.error(
      "Failed to load current assessment attempt item:",
      itemError,
    );

    throw new AssessmentEngineError(
      "ATTEMPT_LOAD_FAILED",
      "Failed to load current assessment question",
      {
        attemptId,
        currentQuestionIndex:
          attempt.current_question_index,
      },
    );
  }

  if (!itemData) {
    throw new AssessmentEngineError(
      "QUESTION_NOT_FOUND",
      "Current assessment question not found",
      {
        attemptId,
        currentQuestionIndex:
          attempt.current_question_index,
      },
    );
  }

  const item = itemData as AttemptItemRow;

  if (item.question_id !== questionId) {
    throw new AssessmentEngineError(
      "QUESTION_OUT_OF_SEQUENCE",
      "Submitted question is not the current question",
      {
        attemptId,
        submittedQuestionId: questionId,
        currentQuestionId: item.question_id,
        currentQuestionIndex:
          attempt.current_question_index,
      },
    );
  }

  if (item.answer_status !== "pending") {
    throw new AssessmentEngineError(
      "QUESTION_ALREADY_ANSWERED",
      "Assessment question has already been answered",
      {
        attemptId,
        questionId,
        answerStatus: item.answer_status,
      },
    );
  }

  const { data: questionData, error: questionError } =
    await admin
      .from("assessment_questions")
      .select(
        `
          id,
          correct_answer,
          explanation_uk
        `,
      )
      .eq("id", item.question_id)
      .maybeSingle();

  if (questionError) {
    console.error(
      "Failed to load assessment answer key:",
      questionError,
    );

    throw new AssessmentEngineError(
      "QUESTION_NOT_FOUND",
      "Failed to load assessment answer key",
      {
        questionId: item.question_id,
      },
    );
  }

  if (!questionData) {
    throw new AssessmentEngineError(
      "QUESTION_NOT_FOUND",
      "Assessment answer key not found",
      {
        questionId: item.question_id,
      },
    );
  }

  const answerKey = questionData as Pick<
    AssessmentQuestionRecord,
    "id" | "correct_answer" | "explanation_uk"
  >;



  const isCorrect = answersAreEqual(
    answer,
    answerKey.correct_answer,
  );

  const answerStatus: Extract<
    AssessmentAnswerStatus,
    "correct" | "incorrect"
  > = isCorrect ? "correct" : "incorrect";

  const awardedScore = isCorrect
    ? Number(item.max_score)
    : 0;

const answeredAtDate = new Date();
const answeredAt = answeredAtDate.toISOString();

const responseTimeMs = calculateResponseTimeMs(
  item.presented_at,
  answeredAtDate,
);

  const {
    data: updatedItemData,
    error: updateItemError,
  } = await admin
    .from("assessment_attempt_items")
    .update({
  user_answer: answer,
  answer_status: answerStatus,
  is_correct: isCorrect,
  raw_score: awardedScore,
  response_time_ms: responseTimeMs,
  answered_at: answeredAt,
})
    .eq("id", item.id)
    .eq("answer_status", "pending")
    .select("id")
    .maybeSingle();

  if (updateItemError) {
    console.error(
      "Failed to save assessment answer:",
      updateItemError,
    );

    throw new AssessmentEngineError(
      "ANSWER_SUBMIT_FAILED",
      "Failed to save assessment answer",
      {
        attemptId,
        questionId,
      },
    );
  }

  if (!updatedItemData) {
    throw new AssessmentEngineError(
      "QUESTION_ALREADY_ANSWERED",
      "Assessment question was already answered",
      {
        attemptId,
        questionId,
      },
    );
  }

  const questionCount = getQuestionCount(
    attempt,
    test,
  );

  const answeredQuestionCount =
    attempt.answered_question_count + 1;

  const correctAnswerCount =
    attempt.correct_answer_count +
    (isCorrect ? 1 : 0);

  const rawScore =
    Number(attempt.raw_score) + awardedScore;

  const hasNextQuestion =
    attempt.current_question_index + 1 <
    questionCount;

  if (!hasNextQuestion) {
    const percentage =
      Number(attempt.max_score) > 0
        ? roundPercentage(
            (rawScore /
              Number(attempt.max_score)) *
              100,
          )
        : 0;

    const passed =
      test.passing_score === null
        ? null
        : percentage >=
          Number(test.passing_score);

    const { error: completeAttemptError } =
  await admin
    .from("assessment_attempts")
    .update({
      status: "completed",
      answered_question_count:
        answeredQuestionCount,
      correct_answer_count:
        correctAnswerCount,
      raw_score: rawScore,
      percentage,
      passed,
      final_level:
        test.test_type === "level" &&
        passed
          ? test.cefr_level
          : null,
      completed_at: answeredAt,
      updated_at: answeredAt,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress");

if (completeAttemptError) {
  console.error(
    "Failed to complete assessment attempt:",
    completeAttemptError,
  );

  throw new AssessmentEngineError(
    "ANSWER_SUBMIT_FAILED",
    "Answer was saved, but attempt completion failed",
    {
      attemptId,
      questionId,
    },
  );
}

// ✅ ТУТ, після if, а не всередині нього
const recommendations =
  await buildRecommendations(attempt.id);

return {
  attemptId: attempt.id,
  completed: true,
  passed,
  percentage,
  progress: {
    current: questionCount,
    total: questionCount,
    answered: answeredQuestionCount,
    skipped: attempt.skipped_question_count,
  },
  evaluation: {
    status: answerStatus,
    isCorrect,
    correctAnswer: answerKey.correct_answer,
    explanationUk:
      answerKey.explanation_uk ?? null,
  },
  question: null,
  recommendations,
};

  }

  const nextQuestionIndex =
    attempt.current_question_index + 1;

  const { error: updateAttemptError } =
    await admin
      .from("assessment_attempts")
      .update({
        current_question_index:
          nextQuestionIndex,
        answered_question_count:
          answeredQuestionCount,
        correct_answer_count:
          correctAnswerCount,
        raw_score: rawScore,
        updated_at: answeredAt,
      })
      .eq("id", attempt.id)
      .eq("status", "in_progress");

  if (updateAttemptError) {
    console.error(
      "Failed to update assessment attempt progress:",
      updateAttemptError,
    );

    throw new AssessmentEngineError(
      "ANSWER_SUBMIT_FAILED",
      "Answer was saved, but attempt progress update failed",
      {
        attemptId,
        questionId,
      },
    );
  }
  const { error: presentNextItemError } =
  await admin
    .from("assessment_attempt_items")
    .update({
      presented_at: answeredAt,
    })
    .eq("attempt_id", attempt.id)
    .eq("order_index", nextQuestionIndex)
    .eq("answer_status", "pending")
    .is("presented_at", null);

if (presentNextItemError) {
  console.error(
    "Failed to mark next assessment question as presented:",
    presentNextItemError,
  );

  throw new AssessmentEngineError(
    "ATTEMPT_LOAD_FAILED",
    "Failed to prepare the next assessment question",
    {
      attemptId,
      nextQuestionIndex,
    },
  );
}

  const {
    data: nextItemData,
    error: nextItemError,
  } = await admin
    .from("assessment_attempt_items")
    .select(
      `
        id,
        question_snapshot
      `,
    )
    .eq("attempt_id", attempt.id)
    .eq("order_index", nextQuestionIndex)
    .maybeSingle();

  if (nextItemError || !nextItemData) {
    console.error(
      "Failed to load next assessment question:",
      nextItemError,
    );

    throw new AssessmentEngineError(
      "ATTEMPT_LOAD_FAILED",
      "Failed to load next assessment question",
      {
        attemptId,
        nextQuestionIndex,
      },
    );
  }

  return {
  attemptId: attempt.id,
  completed: false,
  passed: null,
  percentage: null,
  progress: {
    current: nextQuestionIndex + 1,
    total: questionCount,
    answered: answeredQuestionCount,
    skipped: attempt.skipped_question_count,
  },
  evaluation: {
    status: answerStatus,
    isCorrect,
    correctAnswer: answerKey.correct_answer,
    explanationUk: answerKey.explanation_uk ?? null,
  },
  question:
    nextItemData.question_snapshot as PublicAssessmentQuestion,
  recommendations: null,
};
}
