import { NextResponse } from "next/server";
import { z } from "zod";

import {
  calculatePlacementResult,
  TEST_PLAN,
} from "@/lib/ai/placement-test";
import type {
  CEFRLevel,
  PlacementResult,
  PlacementResultQuestion,
} from "@/lib/ai/placement-test";
import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";

const FinishRequestSchema = z.object({
  sessionId: z.string().uuid(),
});

interface PlacementSessionRow {
  id: string;
  user_id: string;

  status:
    | "in_progress"
    | "completed"
    | "abandoned";

  current_question_index: number;
  total_questions: number;

  final_level: CEFRLevel | null;
  final_score: number | null;
  confidence: number | null;

  grammar_score: number | null;
  vocabulary_score: number | null;
  comprehension_score: number | null;
  complexity_score: number | null;
  task_completion_score: number | null;

  result_summary: unknown;

  started_at: string;
  completed_at: string | null;
}

interface PlacementQuestionRow {
  id: string;
  session_id: string;
  user_id: string;
  question_index: number;
  target_level: CEFRLevel;

  answer: string | null;

  grammar_score: number | null;
  vocabulary_score: number | null;
  comprehension_score: number | null;
  complexity_score: number | null;
  task_completion_score: number | null;

  estimated_level: CEFRLevel | null;
  answered_at: string | null;
}

interface ProfileRow {
  id: string;
  placement_test_attempts: number | null;
  placement_completed_at: string | null;
}

interface DatabaseError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

interface StoredResultSummary {
  text: string;
  confirmedLevel: CEFRLevel;
  answeredQuestions: number;
  levelPerformance: PlacementResult["levelPerformance"];
}

type SupabaseClient = Awaited<
  ReturnType<typeof createClient>
>;

const SESSION_SELECT = [
  "id",
  "user_id",
  "status",
  "current_question_index",
  "total_questions",
  "final_level",
  "final_score",
  "confidence",
  "grammar_score",
  "vocabulary_score",
  "comprehension_score",
  "complexity_score",
  "task_completion_score",
  "result_summary",
  "started_at",
  "completed_at",
].join(", ");

const QUESTION_SELECT = [
  "id",
  "session_id",
  "user_id",
  "question_index",
  "target_level",
  "answer",
  "grammar_score",
  "vocabulary_score",
  "comprehension_score",
  "complexity_score",
  "task_completion_score",
  "estimated_level",
  "answered_at",
].join(", ");

function roundTo(
  value: number,
  decimalPlaces: number,
): number {
  const multiplier =
    10 ** decimalPlaces;

  return (
    Math.round(value * multiplier) /
    multiplier
  );
}

/*
 * The application uses confidence as a percentage:
 * 0–100.
 *
 * Some database schemas store confidence as:
 * 0–1.
 */
function toNormalizedConfidence(
  confidence: number,
): number {
  return roundTo(
    Math.max(
      0,
      Math.min(100, confidence),
    ) / 100,
    4,
  );
}

function toPublicConfidence(
  storedConfidence: number,
): number {
  if (storedConfidence >= 0 &&
      storedConfidence <= 1) {
    return Math.round(
      storedConfidence * 100,
    );
  }

  return Math.round(
    Math.max(
      0,
      Math.min(100, storedConfidence),
    ),
  );
}

function isConstraintOrRangeError(
  error: DatabaseError,
): boolean {
  return (
    error.code === "23514" ||
    error.code === "22003" ||
    error.code === "22P02"
  );
}

function createStoredResultSummary(
  result: PlacementResult,
): StoredResultSummary {
  return {
    text: result.resultSummary,
    confirmedLevel:
      result.confirmedLevel,
    answeredQuestions:
      result.answeredQuestions,
    levelPerformance:
      result.levelPerformance,
  };
}

function getSummaryText(
  summary: unknown,
): string | null {
  if (typeof summary === "string") {
    return summary;
  }

  if (
    summary &&
    typeof summary === "object" &&
    "text" in summary &&
    typeof summary.text === "string"
  ) {
    return summary.text;
  }

  return null;
}

function getStoredSummaryField<T>(
  summary: unknown,
  field: string,
): T | undefined {
  if (
    !summary ||
    typeof summary !== "object" ||
    !(field in summary)
  ) {
    return undefined;
  }

  return (
    summary as Record<string, unknown>
  )[field] as T;
}

function assertCompletedSessionResult(
  session: PlacementSessionRow,
): asserts session is PlacementSessionRow & {
  final_level: CEFRLevel;
  final_score: number;
  confidence: number;
  grammar_score: number;
  vocabulary_score: number;
  comprehension_score: number;
  complexity_score: number;
  task_completion_score: number;
  completed_at: string;
} {
  if (
    session.final_level === null ||
    session.final_score === null ||
    session.confidence === null ||
    session.grammar_score === null ||
    session.vocabulary_score === null ||
    session.comprehension_score === null ||
    session.complexity_score === null ||
    session.task_completion_score ===
      null ||
    session.completed_at === null
  ) {
    throw new Error(
      "Completed placement session has incomplete result data.",
    );
  }
}

function createPublicResult({
  sessionId,
  result,
  completedAt,
}: {
  sessionId: string;
  result: PlacementResult;
  completedAt: string;
}) {
  return {
    sessionId,
    completed: true as const,
    completedAt,

    finalLevel:
      result.finalLevel,
    finalScore:
      result.finalScore,
    confidence:
      result.confidence,

    scores: {
      grammar:
        result.grammarScore,
      vocabulary:
        result.vocabularyScore,
      comprehension:
        result.comprehensionScore,
      complexity:
        result.complexityScore,
      taskCompletion:
        result.taskCompletionScore,
    },

    answeredQuestions:
      result.answeredQuestions,
    confirmedLevel:
      result.confirmedLevel,
    levelPerformance:
      result.levelPerformance,
    resultSummary:
      result.resultSummary,
  };
}

function createPublicCompletedSessionResult(
  session: PlacementSessionRow,
) {
  assertCompletedSessionResult(session);

  return {
    sessionId: session.id,
    completed: true as const,
    completedAt:
      session.completed_at,

    finalLevel:
      session.final_level,
    finalScore:
      session.final_score,
    confidence:
      toPublicConfidence(
        session.confidence,
      ),

    scores: {
      grammar:
        session.grammar_score,
      vocabulary:
        session.vocabulary_score,
      comprehension:
        session.comprehension_score,
      complexity:
        session.complexity_score,
      taskCompletion:
        session.task_completion_score,
    },

    answeredQuestions:
      getStoredSummaryField<number>(
        session.result_summary,
        "answeredQuestions",
      ),

    confirmedLevel:
      getStoredSummaryField<CEFRLevel>(
        session.result_summary,
        "confirmedLevel",
      ),

    levelPerformance:
      getStoredSummaryField<
        PlacementResult["levelPerformance"]
      >(
        session.result_summary,
        "levelPerformance",
      ),

    resultSummary:
      getSummaryText(
        session.result_summary,
      ),
  };
}

async function getPlacementSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<PlacementSessionRow | null> {
  const { data, error } = await supabase
    .from("placement_test_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as
    | PlacementSessionRow
    | null;
}

async function getPlacementQuestions(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<PlacementQuestionRow[]> {
  const { data, error } = await supabase
    .from("placement_test_questions")
    .select(QUESTION_SELECT)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("question_index", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as
    PlacementQuestionRow[];
}

function isFullyEvaluatedQuestion(
  question: PlacementQuestionRow,
): boolean {
  return (
    typeof question.answer === "string" &&
    question.answer.trim().length > 0 &&
    question.grammar_score !== null &&
    question.vocabulary_score !== null &&
    question.comprehension_score !== null &&
    question.complexity_score !== null &&
    question.task_completion_score !==
      null &&
    question.estimated_level !== null &&
    question.answered_at !== null
  );
}

function mapQuestionsForCalculation(
  questions: PlacementQuestionRow[],
): PlacementResultQuestion[] {
  return questions.map((question) => {
    if (
      question.grammar_score === null ||
      question.vocabulary_score === null ||
      question.comprehension_score ===
        null ||
      question.complexity_score === null ||
      question.task_completion_score ===
        null ||
      question.estimated_level === null
    ) {
      throw new Error(
        `Placement question ${question.id} has incomplete evaluation data.`,
      );
    }

    return {
      targetLevel:
        question.target_level,
      estimatedLevel:
        question.estimated_level,

      grammar:
        question.grammar_score,
      vocabulary:
        question.vocabulary_score,
      comprehension:
        question.comprehension_score,
      complexity:
        question.complexity_score,
      taskCompletion:
        question.task_completion_score,
    };
  });
}

async function updateSessionWithConfidence({
  supabase,
  session,
  userId,
  completedAt,
  result,
  confidence,
}: {
  supabase: SupabaseClient;
  session: PlacementSessionRow;
  userId: string;
  completedAt: string;
  result: PlacementResult;
  confidence: number;
}): Promise<{
  data: PlacementSessionRow | null;
  error: DatabaseError | null;
}> {
  const { data, error } = await supabase
    .from("placement_test_sessions")
    .update({
      status: "completed",

      current_question_index:
        session.total_questions,

      final_level:
        result.finalLevel,
      final_score:
        result.finalScore,
      confidence,

      grammar_score:
        result.grammarScore,
      vocabulary_score:
        result.vocabularyScore,
      comprehension_score:
        result.comprehensionScore,
      complexity_score:
        result.complexityScore,
      task_completion_score:
        result.taskCompletionScore,

      result_summary:
        createStoredResultSummary(
          result,
        ),

      completed_at:
        completedAt,
    })
    .eq("id", session.id)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .select(SESSION_SELECT)
    .maybeSingle();

  return {
    data: data as unknown as
      | PlacementSessionRow
      | null,

    error:
      error as DatabaseError | null,
  };
}

async function completePlacementSession(
  supabase: SupabaseClient,
  {
    session,
    userId,
    completedAt,
    result,
  }: {
    session: PlacementSessionRow;
    userId: string;
    completedAt: string;
    result: PlacementResult;
  },
): Promise<PlacementSessionRow | null> {
  /*
   * First try the application's public percentage
   * format: 0–100.
   */
  const percentageAttempt =
    await updateSessionWithConfidence({
      supabase,
      session,
      userId,
      completedAt,
      result,
      confidence:
        result.confidence,
    });

  if (
    !percentageAttempt.error
  ) {
    return percentageAttempt.data;
  }

  console.warn(
    "Placement session update with percentage confidence failed:",
    percentageAttempt.error,
  );

  if (
    !isConstraintOrRangeError(
      percentageAttempt.error,
    )
  ) {
    throw percentageAttempt.error;
  }

  /*
   * Some schemas constrain confidence to 0–1.
   * Retry using normalized confidence.
   */
  const normalizedConfidence =
    toNormalizedConfidence(
      result.confidence,
    );

  console.warn(
    "Retrying placement session update with normalized confidence:",
    {
      sessionId: session.id,
      publicConfidence:
        result.confidence,
      databaseConfidence:
        normalizedConfidence,
    },
  );

  const normalizedAttempt =
    await updateSessionWithConfidence({
      supabase,
      session,
      userId,
      completedAt,
      result,
      confidence:
        normalizedConfidence,
    });

  if (normalizedAttempt.error) {
    console.error(
      "Placement session update with normalized confidence failed:",
      normalizedAttempt.error,
    );

    throw normalizedAttempt.error;
  }

  return normalizedAttempt.data;
}

async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "placement_test_attempts",
        "placement_completed_at",
      ].join(", "),
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as
    | ProfileRow
    | null;
}

async function updateProfileWithConfidence({
  supabase,
  userId,
  completedAt,
  finalLevel,
  finalScore,
  confidence,
  attempts,
}: {
  supabase: SupabaseClient;
  userId: string;
  completedAt: string;
  finalLevel: CEFRLevel;
  finalScore: number;
  confidence: number;
  attempts: number;
}): Promise<DatabaseError | null> {
  const { error } = await supabase
    .from("profiles")
    .update({
      english_level:
        finalLevel,
      english_level_score:
        finalScore,
      english_level_confidence:
        confidence,
      placement_completed_at:
        completedAt,
      placement_test_attempts:
        attempts,
    })
    .eq("id", userId);

  return error as DatabaseError | null;
}

async function syncProfileResult(
  supabase: SupabaseClient,
  {
    userId,
    completedAt,
    finalLevel,
    finalScore,
    confidence,
  }: {
    userId: string;
    completedAt: string;
    finalLevel: CEFRLevel;
    finalScore: number;
    confidence: number;
  },
): Promise<void> {
  const profile =
    await getProfile(
      supabase,
      userId,
    );

  if (!profile) {
    throw new Error(
      "Profile not found while completing placement test.",
    );
  }

  const currentAttempts =
    profile.placement_test_attempts ?? 0;

  /*
   * A repeated /finish request for the same session
   * must not increment attempts again.
   */
  const resultAlreadySynced =
    profile.placement_completed_at ===
    completedAt;

  const nextAttempts =
    resultAlreadySynced
      ? currentAttempts
      : currentAttempts + 1;

  const percentageError =
    await updateProfileWithConfidence({
      supabase,
      userId,
      completedAt,
      finalLevel,
      finalScore,
      confidence,
      attempts:
        nextAttempts,
    });

  if (!percentageError) {
    return;
  }

  console.warn(
    "Profile update with percentage confidence failed:",
    percentageError,
  );

  if (
    !isConstraintOrRangeError(
      percentageError,
    )
  ) {
    throw percentageError;
  }

  const normalizedConfidence =
    toNormalizedConfidence(
      confidence,
    );

  console.warn(
    "Retrying profile update with normalized confidence:",
    {
      userId,
      publicConfidence:
        confidence,
      databaseConfidence:
        normalizedConfidence,
    },
  );

  const normalizedError =
    await updateProfileWithConfidence({
      supabase,
      userId,
      completedAt,
      finalLevel,
      finalScore,
      confidence:
        normalizedConfidence,
      attempts:
        nextAttempts,
    });

  if (normalizedError) {
    console.error(
      "Profile update with normalized confidence failed:",
      normalizedError,
    );

    throw normalizedError;
  }
}

export async function POST(
  request: Request,
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }

    let requestBody: unknown;

    try {
      requestBody =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .invalidRequestData,
        },
        {
          status: 400,
        },
      );
    }

    const parsedBody =
      FinishRequestSchema.safeParse(
        requestBody,
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .invalidRequestData,

          details:
            parsedBody.error
              .flatten()
              .fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const { sessionId } =
      parsedBody.data;

    const session =
      await getPlacementSession(
        supabase,
        sessionId,
        user.id,
      );

    if (!session) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .placementSessionNotFound,
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Idempotent repeated finish.
     *
     * Also retries profile synchronization in case
     * the session was completed but profile update
     * failed during an earlier request.
     */
    if (
      session.status ===
      "completed"
    ) {
      assertCompletedSessionResult(
        session,
      );

      await syncProfileResult(
        supabase,
        {
          userId: user.id,
          completedAt:
            session.completed_at,
          finalLevel:
            session.final_level,
          finalScore:
            session.final_score,
          confidence:
            toPublicConfidence(
              session.confidence,
            ),
        },
      );

      return NextResponse.json(
        createPublicCompletedSessionResult(
          session,
        ),
      );
    }

    if (
      session.status !==
      "in_progress"
    ) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .placementSessionNotFound,
        },
        {
          status: 404,
        },
      );
    }

    const questions =
      await getPlacementQuestions(
        supabase,
        session.id,
        user.id,
      );

    const expectedQuestionCount =
      Math.min(
        session.total_questions,
        TEST_PLAN.length,
      );

    const fullyEvaluatedQuestions =
      questions.filter(
        isFullyEvaluatedQuestion,
      );

    const evaluatedByIndex =
      new Map(
        fullyEvaluatedQuestions.map(
          (question) => [
            question.question_index,
            question,
          ],
        ),
      );

    const missingQuestionIndexes =
      Array.from(
        {
          length:
            expectedQuestionCount,
        },
        (_, index) => index,
      ).filter(
        (questionIndex) =>
          !evaluatedByIndex.has(
            questionIndex,
          ),
      );

    if (
      fullyEvaluatedQuestions.length <
        expectedQuestionCount ||
      missingQuestionIndexes.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .placementTestIncomplete,

          progress: {
            answered:
              fullyEvaluatedQuestions.length,
            total:
              expectedQuestionCount,
          },

          missingQuestionIndexes,
        },
        {
          status: 409,
        },
      );
    }

    const questionsForResult =
      Array.from(
        {
          length:
            expectedQuestionCount,
        },
        (_, questionIndex) => {
          const question =
            evaluatedByIndex.get(
              questionIndex,
            );

          if (!question) {
            throw new Error(
              `Placement question index ${questionIndex} is missing.`,
            );
          }

          return question;
        },
      );

    const calculationInput =
      mapQuestionsForCalculation(
        questionsForResult,
      );

    const result =
      calculatePlacementResult(
        calculationInput,
      );

    const completedAt =
      new Date().toISOString();

    console.log(
      "Completing placement session:",
      {
        sessionId:
          session.id,
        userId:
          user.id,
        answeredQuestions:
          result.answeredQuestions,
        finalLevel:
          result.finalLevel,
        finalScore:
          result.finalScore,
        confidence:
          result.confidence,
      },
    );

    const completedSession =
      await completePlacementSession(
        supabase,
        {
          session,
          userId:
            user.id,
          completedAt,
          result,
        },
      );

    /*
     * Another concurrent request might complete the
     * session before this request updates it.
     */
    if (!completedSession) {
      const currentSession =
        await getPlacementSession(
          supabase,
          session.id,
          user.id,
        );

      if (
        currentSession?.status ===
        "completed"
      ) {
        assertCompletedSessionResult(
          currentSession,
        );

        await syncProfileResult(
          supabase,
          {
            userId:
              user.id,
            completedAt:
              currentSession.completed_at,
            finalLevel:
              currentSession.final_level,
            finalScore:
              currentSession.final_score,
            confidence:
              toPublicConfidence(
                currentSession.confidence,
              ),
          },
        );

        return NextResponse.json(
          createPublicCompletedSessionResult(
            currentSession,
          ),
        );
      }

      throw new Error(
        "Placement session could not be completed.",
      );
    }

    console.log(
      "Placement session completed. Updating profile:",
      {
        sessionId:
          completedSession.id,
        userId:
          user.id,
        finalLevel:
          result.finalLevel,
        finalScore:
          result.finalScore,
        confidence:
          result.confidence,
      },
    );

    await syncProfileResult(
      supabase,
      {
        userId:
          user.id,
        completedAt,
        finalLevel:
          result.finalLevel,
        finalScore:
          result.finalScore,
        confidence:
          result.confidence,
      },
    );

    console.log(
      "Placement test completed successfully:",
      {
        sessionId:
          completedSession.id,
        userId:
          user.id,
      },
    );

    return NextResponse.json(
      createPublicResult({
        sessionId:
          completedSession.id,
        result,
        completedAt,
      }),
    );
  } catch (error) {
    console.error(
      "FINISH PLACEMENT TEST ERROR:",
      error,
    );

    const details =
      error instanceof Error
        ? {
            name:
              error.name,
            message:
              error.message,
            cause:
              error.cause,
          }
        : error;

    return NextResponse.json(
      {
        error:
          API_ERRORS
            .failedToFinishPlacementTest,

        details:
          process.env.NODE_ENV ===
          "development"
            ? details
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}
