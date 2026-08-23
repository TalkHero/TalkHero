import { NextResponse } from "next/server";

import {
  generatePlacementQuestion,
  normalizeQuestion,
  TEST_PLAN,
} from "@/lib/ai/placement-test";
import type {
  AnswerLength,
  CEFRLevel,
  PlacementSkill,
} from "@/lib/ai/placement-test";
import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";

const MAX_DATABASE_INSERT_ATTEMPTS = 4;

interface PlacementSessionRow {
  id: string;
  user_id: string;
  status:
    | "in_progress"
    | "completed"
    | "abandoned";
  current_question_index: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
}

interface PlacementQuestionRow {
  id: string;
  session_id: string;
  user_id: string;
  question_index: number;
  question: string;
  normalized_question: string;
  question_key: string;
  target_level: CEFRLevel;
  skill: PlacementSkill;
  expected_answer_length: AnswerLength;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

interface PreviousQuestionRow {
  question: string;
  question_key: string;
}

interface DatabaseError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
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
  "started_at",
  "completed_at",
].join(", ");

const QUESTION_SELECT = [
  "id",
  "session_id",
  "user_id",
  "question_index",
  "question",
  "normalized_question",
  "question_key",
  "target_level",
  "skill",
  "expected_answer_length",
  "answer",
  "created_at",
  "answered_at",
].join(", ");

function isUniqueViolation(
  error: DatabaseError,
): boolean {
  return error.code === "23505";
}

function createPublicQuestion(
  question: PlacementQuestionRow,
) {
  return {
    id: question.id,
    text: question.question,
    level: question.target_level,
    skill: question.skill,
    expectedAnswerLength:
      question.expected_answer_length,
  };
}

function createProgress({
  currentQuestionIndex,
  totalQuestions,
}: {
  currentQuestionIndex: number;
  totalQuestions: number;
}) {
  return {
    completed: currentQuestionIndex,
    current: Math.min(
      currentQuestionIndex + 1,
      totalQuestions,
    ),
    total: totalQuestions,
  };
}

function createReadyToFinishResponse(
  session: PlacementSessionRow,
) {
  const expectedQuestionCount = Math.min(
    session.total_questions,
    TEST_PLAN.length,
  );

  return NextResponse.json({
    sessionId: session.id,
    completed: true,
    currentQuestionIndex:
      session.current_question_index,
    totalQuestions:
      session.total_questions,
    progress: {
      completed: expectedQuestionCount,
      current: expectedQuestionCount,
      total: expectedQuestionCount,
    },
    question: null,
  });
}

async function getActiveSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlacementSessionRow | null> {
  const { data, error } = await supabase
    .from("placement_test_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("started_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as
    | PlacementSessionRow
    | null;
}

async function createPlacementSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlacementSessionRow> {
  const { data, error } = await supabase
    .from("placement_test_sessions")
    .insert({
      user_id: userId,
      status: "in_progress",
      current_question_index: 0,
      total_questions: TEST_PLAN.length,
    })
    .select(SESSION_SELECT)
    .single();

  if (error) {
    /*
     * A concurrent request may have created an active
     * session first. Reload it before failing.
     */
    if (isUniqueViolation(error)) {
      const existingSession =
        await getActiveSession(
          supabase,
          userId,
        );

      if (existingSession) {
        return existingSession;
      }
    }

    throw error;
  }

  return data as unknown as
    PlacementSessionRow;
}

async function getOrCreateActiveSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlacementSessionRow> {
  const activeSession =
    await getActiveSession(
      supabase,
      userId,
    );

  if (activeSession) {
    return activeSession;
  }

  return createPlacementSession(
    supabase,
    userId,
  );
}

async function getQuestionByIndex(
  supabase: SupabaseClient,
  {
    sessionId,
    userId,
    questionIndex,
  }: {
    sessionId: string;
    userId: string;
    questionIndex: number;
  },
): Promise<PlacementQuestionRow | null> {
  const { data, error } = await supabase
    .from("placement_test_questions")
    .select(QUESTION_SELECT)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("question_index", questionIndex)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as
    | PlacementQuestionRow
    | null;
}

async function getPreviousQuestions(
  supabase: SupabaseClient,
  userId: string,
): Promise<PreviousQuestionRow[]> {
  const { data, error } = await supabase
    .from("placement_test_questions")
    .select("question, question_key")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as
    PreviousQuestionRow[];
}

async function generateAndSaveQuestion(
  supabase: SupabaseClient,
  {
    session,
    userId,
    questionIndex,
  }: {
    session: PlacementSessionRow;
    userId: string;
    questionIndex: number;
  },
): Promise<PlacementQuestionRow> {
  /*
   * Another request or an earlier page load may have
   * already generated the current question.
   */
  const existingQuestion =
    await getQuestionByIndex(
      supabase,
      {
        sessionId: session.id,
        userId,
        questionIndex,
      },
    );

  if (existingQuestion) {
    return existingQuestion;
  }

  const planStep =
    TEST_PLAN[questionIndex];

  if (!planStep) {
    throw new Error(
      `Placement test plan step ${questionIndex} does not exist.`,
    );
  }

  const previousQuestionRows =
    await getPreviousQuestions(
      supabase,
      userId,
    );

  const previousQuestions =
    previousQuestionRows.map(
      ({ question }) => question,
    );

  const previousQuestionKeys =
    previousQuestionRows.map(
      ({ question_key }) => question_key,
    );

  let lastInsertError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_DATABASE_INSERT_ATTEMPTS;
    attempt += 1
  ) {
    const generatedQuestion =
      await generatePlacementQuestion({
        level: planStep.level,
        skill: planStep.skill,
        expectedAnswerLength:
          planStep.answerLength,
        previousQuestions,
        previousQuestionKeys,
      });

    const normalizedQuestion =
      normalizeQuestion(
        generatedQuestion.question,
      );

    const { data, error } = await supabase
      .from("placement_test_questions")
      .insert({
        session_id: session.id,
        user_id: userId,
        question_index: questionIndex,

        question:
          generatedQuestion.question,
        normalized_question:
          normalizedQuestion,
        question_key:
          generatedQuestion.questionKey,

        target_level:
          generatedQuestion.level,
        skill:
          generatedQuestion.skill,
        expected_answer_length:
          generatedQuestion
            .expectedAnswerLength,

        generation_metadata: {
          source: "openai",
          attempt,
          planIndex: questionIndex,
          generatedOnStart: true,
        },
      })
      .select(QUESTION_SELECT)
      .single();

    if (!error && data) {
      return data as unknown as
        PlacementQuestionRow;
    }

    lastInsertError = error;

    if (
      error &&
      isUniqueViolation(error)
    ) {
      /*
       * A concurrent request may have inserted the
       * question for this session index.
       */
      const concurrentQuestion =
        await getQuestionByIndex(
          supabase,
          {
            sessionId:
              session.id,
            userId,
            questionIndex,
          },
        );

      if (concurrentQuestion) {
        return concurrentQuestion;
      }

      /*
       * The generated question may conflict with a
       * historical normalized question or key. Add it
       * to the local exclusion lists before retrying.
       */
      previousQuestions.push(
        generatedQuestion.question,
      );

      previousQuestionKeys.push(
        generatedQuestion.questionKey,
      );

      console.warn(
        `Placement start question database conflict on attempt ${attempt}. Retrying.`,
        {
          userId,
          sessionId:
            session.id,
          questionIndex,
          code: error.code,
        },
      );

      continue;
    }

    throw error;
  }

  throw new Error(
    "Failed to save a unique placement test question.",
    {
      cause: lastInsertError,
    },
  );
}

export async function POST() {
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

    const session =
      await getOrCreateActiveSession(
        supabase,
        user.id,
      );

    const questionIndex =
      session.current_question_index;

    const expectedQuestionCount =
      Math.min(
        session.total_questions,
        TEST_PLAN.length,
      );

    /*
     * The final answer has already been saved and the
     * session index was advanced past the last test
     * question. The client must now call /finish.
     *
     * TEST_PLAN contains indexes 0–11, so index 12
     * means all 12 questions have been answered.
     */
    if (
      questionIndex >=
      expectedQuestionCount
    ) {


      return createReadyToFinishResponse(
        session,
      );
    }

    if (questionIndex < 0) {
      console.error(
        "PLACEMENT TEST START INVALID QUESTION INDEX:",
        {
          sessionId:
            session.id,
          userId:
            user.id,
          questionIndex,
          testPlanLength:
            TEST_PLAN.length,
        },
      );

      throw new Error(
        `Invalid placement question index: ${questionIndex}.`,
      );
    }

    const question =
      await generateAndSaveQuestion(
        supabase,
        {
          session,
          userId: user.id,
          questionIndex,
        },
      );

    return NextResponse.json({
      sessionId:
        session.id,
      completed: false,

      currentQuestionIndex:
        question.question_index,

      totalQuestions:
        session.total_questions,

      progress:
        createProgress({
          currentQuestionIndex:
            question.question_index,
          totalQuestions:
            session.total_questions,
        }),

      question:
        createPublicQuestion(
          question,
        ),
    });
  } catch (error) {
    console.error(
      "START PLACEMENT TEST ERROR:",
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
            .failedToStartPlacementTest,

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
