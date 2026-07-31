import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AssessmentAnswerStatus,
  AssessmentQuestionRecord,
  PublicAssessmentQuestion,
} from "@/lib/testing/types";

import { AssessmentEngineError } from "./errors";
import type {
  AssessmentAttemptProgress,
} from "./start-attempt";


import {
  buildRecommendations,
  type LearningRecommendation,
} from "@/lib/ai/recommendations";

export type SkipAssessmentQuestionInput = {
  userId: string;
  testSlug: string;
  attemptId: string;
  questionId: string;
};

export type AssessmentSkipEvaluation = {
  status: Extract<AssessmentAnswerStatus, "skipped">;
  isCorrect: false;
  correctAnswer: unknown;
  explanationUk: string | null;
};

export type SkipAssessmentQuestionResult = {
  attemptId: string;
  completed: boolean;
  passed: boolean | null;
  percentage: number | null;
  progress: AssessmentAttemptProgress;
  evaluation: AssessmentSkipEvaluation;
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
  order_index: number;
  answer_status: AssessmentAnswerStatus;
  question_snapshot: PublicAssessmentQuestion;
};

type AssessmentTestRow = {
  id: string;
  slug: string;
  test_type: string;
  cefr_level: string | null;
  question_count: number;
  passing_score: number | null;
};

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

export async function skipAssessmentQuestion({
  userId,
  testSlug,
  attemptId,
  questionId,
}: SkipAssessmentQuestionInput): Promise<SkipAssessmentQuestionResult> {
  const normalizedSlug = testSlug
    .trim()
    .toLowerCase();

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
      "Failed to load assessment test for question skip:",
      testError,
    );

    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      "Failed to load assessment test",
      {
        testSlug: normalizedSlug,
      },
    );
  }

  if (!testData) {
    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      `Assessment test not found: ${normalizedSlug}`,
      {
        testSlug: normalizedSlug,
      },
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
      "Failed to load assessment attempt for question skip:",
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
          order_index,
          answer_status,
          question_snapshot
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
      "Failed to load current assessment item for question skip:",
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
      "Failed to load assessment answer key for question skip:",
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

  const answeredAt = new Date().toISOString();

  const {
    data: updatedItemData,
    error: updateItemError,
  } = await admin
    .from("assessment_attempt_items")
    .update({
      user_answer: null,
      answer_status: "skipped",
      is_correct: false,
      raw_score: 0,
      answered_at: answeredAt,
    })
    .eq("id", item.id)
    .eq("answer_status", "pending")
    .select("id")
    .maybeSingle();

  if (updateItemError) {
    console.error(
      "Failed to save skipped assessment question:",
      updateItemError,
    );

    throw new AssessmentEngineError(
      "QUESTION_SKIP_FAILED",
      "Failed to save skipped assessment question",
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

  const skippedQuestionCount =
    attempt.skipped_question_count + 1;

  const rawScore = Number(attempt.raw_score);

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

    const {
      data: completedAttemptData,
      error: completeAttemptError,
    } = await admin
      .from("assessment_attempts")
      .update({
        status: "completed",
        answered_question_count:
          answeredQuestionCount,
        skipped_question_count:
          skippedQuestionCount,
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
      .eq("status", "in_progress")
      .select("id")
      .maybeSingle();

    if (completeAttemptError) {
      console.error(
        "Failed to complete assessment attempt after question skip:",
        completeAttemptError,
      );

      throw new AssessmentEngineError(
        "QUESTION_SKIP_FAILED",
        "Question was skipped, but attempt completion failed",
        {
          attemptId,
          questionId,
        },
      );
    }

    if (!completedAttemptData) {
      throw new AssessmentEngineError(
        "ATTEMPT_NOT_IN_PROGRESS",
        "Assessment attempt was already changed",
        {
          attemptId,
        },
      );
    }

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
    skipped: skippedQuestionCount,
  },
  evaluation: {
    status: "skipped",
    isCorrect: false,
    correctAnswer: answerKey.correct_answer,
    explanationUk: answerKey.explanation_uk ?? null,
  },
  question: null,
  recommendations,
};
  }

  const nextQuestionIndex =
    attempt.current_question_index + 1;

  const {
    data: updatedAttemptData,
    error: updateAttemptError,
  } = await admin
    .from("assessment_attempts")
    .update({
      current_question_index:
        nextQuestionIndex,
      answered_question_count:
        answeredQuestionCount,
      skipped_question_count:
        skippedQuestionCount,
      raw_score: rawScore,
      updated_at: answeredAt,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .eq(
      "current_question_index",
      attempt.current_question_index,
    )
    .select("id")
    .maybeSingle();

  if (updateAttemptError) {
    console.error(
      "Failed to update assessment progress after question skip:",
      updateAttemptError,
    );

    throw new AssessmentEngineError(
      "QUESTION_SKIP_FAILED",
      "Question was skipped, but attempt progress update failed",
      {
        attemptId,
        questionId,
      },
    );
  }

  if (!updatedAttemptData) {
    throw new AssessmentEngineError(
      "QUESTION_OUT_OF_SEQUENCE",
      "Assessment attempt progress was already changed",
      {
        attemptId,
        questionId,
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
      "Failed to load next assessment question after skip:",
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
    skipped: skippedQuestionCount,
  },
  evaluation: {
    status: "skipped",
    isCorrect: false,
    correctAnswer: answerKey.correct_answer,
    explanationUk: answerKey.explanation_uk ?? null,
  },
  question:
    nextItemData.question_snapshot as PublicAssessmentQuestion,
  recommendations: null,
};
}
