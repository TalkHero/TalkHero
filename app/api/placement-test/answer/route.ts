import { NextResponse } from "next/server";
import { z } from "zod";

import {
  evaluatePlacementAnswer,
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
import {
  decideAdaptiveProgress,
  type AdaptiveQuestionResult,
} from "@/lib/ai/placement-test/adaptive-plan";

const MAX_ANSWER_LENGTH = 10_000;
const MAX_DATABASE_INSERT_ATTEMPTS = 4;

const AnswerRequestSchema = z.object({
  sessionId: z
    .string()
    .uuid(),

  questionId: z
    .string()
    .uuid(),

  answer: z
    .string()
    .trim()
    .min(1)
    .max(MAX_ANSWER_LENGTH),
});

interface PlacementSessionRow {
  id: string;
  user_id: string;
  status: "in_progress" | "completed" | "abandoned";
  current_question_index: number;
  total_questions: number;
  started_at: string;
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
  grammar_score: number | null;
  vocabulary_score: number | null;
  comprehension_score: number | null;
  complexity_score: number | null;
  task_completion_score: number | null;
  estimated_level: CEFRLevel | null;
  evaluation: unknown;
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
}

type SupabaseClient = Awaited<
  ReturnType<typeof createClient>
>;

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

async function getPlacementSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<PlacementSessionRow | null> {
  const { data, error } = await supabase
    .from("placement_test_sessions")
    .select(
      [
        "id",
        "user_id",
        "status",
        "current_question_index",
        "total_questions",
        "started_at",
      ].join(", "),
    )
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

async function getPlacementQuestion(
  supabase: SupabaseClient,
  {
    questionId,
    sessionId,
    userId,
  }: {
    questionId: string;
    sessionId: string;
    userId: string;
  },
): Promise<PlacementQuestionRow | null> {
  const { data, error } = await supabase
    .from("placement_test_questions")
    .select(
      [
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
        "grammar_score",
        "vocabulary_score",
        "comprehension_score",
        "complexity_score",
        "task_completion_score",
        "estimated_level",
        "evaluation",
        "created_at",
        "answered_at",
      ].join(", "),
    )
    .eq("id", questionId)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as
    | PlacementQuestionRow
    | null;
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
    .select(
      [
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
        "grammar_score",
        "vocabulary_score",
        "comprehension_score",
        "complexity_score",
        "task_completion_score",
        "estimated_level",
        "evaluation",
        "created_at",
        "answered_at",
      ].join(", "),
    )
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

async function saveEvaluation(
  supabase: SupabaseClient,
  {
    question,
    userId,
    answer,
    evaluation,
  }: {
    question: PlacementQuestionRow;
    userId: string;
    answer: string;
    evaluation: {
      grammar: number;
      vocabulary: number;
      comprehension: number;
      complexity: number;
      taskCompletion: number;
      estimatedLevel: CEFRLevel;
      feedback: string;
    };
  },
): Promise<PlacementQuestionRow | null> {
  const answeredAt = new Date().toISOString();

  /*
   * The answer IS NULL condition prevents two requests
   * from saving two evaluations for the same question.
   */
  const { data, error } = await supabase
    .from("placement_test_questions")
    .update({
      answer,
      grammar_score: evaluation.grammar,
      vocabulary_score: evaluation.vocabulary,
      comprehension_score:
        evaluation.comprehension,
      complexity_score: evaluation.complexity,
      task_completion_score:
        evaluation.taskCompletion,
      estimated_level:
        evaluation.estimatedLevel,
      evaluation: {
        grammar: evaluation.grammar,
        vocabulary: evaluation.vocabulary,
        comprehension:
          evaluation.comprehension,
        complexity: evaluation.complexity,
        taskCompletion:
          evaluation.taskCompletion,
        estimatedLevel:
          evaluation.estimatedLevel,
        feedback: evaluation.feedback,
      },
      answered_at: answeredAt,
    })
    .eq("id", question.id)
    .eq("session_id", question.session_id)
    .eq("user_id", userId)
    .is("answer", null)
    .select(
      [
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
        "grammar_score",
        "vocabulary_score",
        "comprehension_score",
        "complexity_score",
        "task_completion_score",
        "estimated_level",
        "evaluation",
        "created_at",
        "answered_at",
      ].join(", "),
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as
    | PlacementQuestionRow
    | null;
}

interface AdaptiveQuestionRow {
  target_level: CEFRLevel;
  estimated_level: CEFRLevel | null;
  grammar_score: number | null;
  vocabulary_score: number | null;
  comprehension_score: number | null;
  complexity_score: number | null;
  task_completion_score: number | null;
}

async function getAdaptiveQuestionResults(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<AdaptiveQuestionResult[]> {
  const { data, error } = await supabase
    .from("placement_test_questions")
    .select(
      [
        "target_level",
        "estimated_level",
        "grammar_score",
        "vocabulary_score",
        "comprehension_score",
        "complexity_score",
        "task_completion_score",
      ].join(", "),
    )
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .not("answer", "is", null)
    .order("question_index", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const rows =
    (data ?? []) as unknown as
      AdaptiveQuestionRow[];

  return rows
    .filter(
      (
        row,
      ): row is AdaptiveQuestionRow & {
        estimated_level: CEFRLevel;
        grammar_score: number;
        vocabulary_score: number;
        comprehension_score: number;
        complexity_score: number;
        task_completion_score: number;
      } =>
        row.estimated_level !== null &&
        typeof row.grammar_score === "number" &&
        typeof row.vocabulary_score === "number" &&
        typeof row.comprehension_score === "number" &&
        typeof row.complexity_score === "number" &&
        typeof row.task_completion_score === "number",
    )
    .map((row) => ({
      targetLevel: row.target_level,
      estimatedLevel: row.estimated_level,
      grammar: row.grammar_score,
      vocabulary: row.vocabulary_score,
      comprehension: row.comprehension_score,
      complexity: row.complexity_score,
      taskCompletion:
        row.task_completion_score,
    }));
}

async function advancePlacementSession(
  supabase: SupabaseClient,
  {
    session,
    userId,
    nextQuestionIndex,
    totalQuestions,
  }: {
    session: PlacementSessionRow;
    userId: string;
    nextQuestionIndex: number;
    totalQuestions?: number;
  },
): Promise<PlacementSessionRow> {
  const sessionUpdate: {
    current_question_index: number;
    total_questions?: number;
  } = {
    current_question_index:
      nextQuestionIndex,
  };

  if (
    typeof totalQuestions === "number"
  ) {
    sessionUpdate.total_questions =
      totalQuestions;
  }

  /*
   * Matching current_question_index makes this a
   * compare-and-set update and protects against
   * concurrent answer requests.
   */
  const { data, error } = await supabase
    .from("placement_test_sessions")
    .update(sessionUpdate)
    .eq("id", session.id)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .eq(
      "current_question_index",
      session.current_question_index,
    )
    .select(
      [
        "id",
        "user_id",
        "status",
        "current_question_index",
        "total_questions",
        "started_at",
      ].join(", "),
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as unknown as
      PlacementSessionRow;
  }

  /*
   * The session may already have been advanced by a
   * concurrent request. Reload it before failing.
   */
  const currentSession =
    await getPlacementSession(
      supabase,
      session.id,
      userId,
    );

  if (
    currentSession &&
    currentSession.status ===
      "in_progress" &&
    currentSession.current_question_index >=
      nextQuestionIndex
  ) {
    return currentSession;
  }

  throw new Error(
    "Placement test session could not be advanced.",
  );
}

async function generateAndSaveNextQuestion(
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

  const planStep = TEST_PLAN[questionIndex];

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
        question: generatedQuestion.question,
        normalized_question:
          normalizedQuestion,
        question_key:
          generatedQuestion.questionKey,
        target_level:
          generatedQuestion.level,
        skill: generatedQuestion.skill,
        expected_answer_length:
          generatedQuestion.expectedAnswerLength,
        generation_metadata: {
          source: "openai",
          attempt,
          planIndex: questionIndex,
          generatedAfterAnswer: true,
        },
      })
      .select(
        [
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
          "grammar_score",
          "vocabulary_score",
          "comprehension_score",
          "complexity_score",
          "task_completion_score",
          "estimated_level",
          "evaluation",
          "created_at",
          "answered_at",
        ].join(", "),
      )
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
       * Another request may already have inserted the
       * question for this session index.
       */
      const concurrentQuestion =
        await getQuestionByIndex(
          supabase,
          {
            sessionId: session.id,
            userId,
            questionIndex,
          },
        );

      if (concurrentQuestion) {
        return concurrentQuestion;
      }

      /*
       * The generated text may conflict with a historical
       * normalized question. Add it to local history before
       * asking the generator for another question.
       */
      previousQuestions.push(
        generatedQuestion.question,
      );

      previousQuestionKeys.push(
        generatedQuestion.questionKey,
      );

      console.warn(
        `Placement next-question database conflict on attempt ${attempt}. Retrying.`,
        {
          userId,
          sessionId: session.id,
          questionIndex,
          code: error.code,
        },
      );

      continue;
    }

    throw error;
  }

  throw new Error(
    "Failed to save a unique next placement question.",
    {
      cause: lastInsertError,
    },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: API_ERRORS.invalidRequestData,
        },
        {
          status: 400,
        },
      );
    }

    const parsedBody =
      AnswerRequestSchema.safeParse(
        requestBody,
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: API_ERRORS.invalidRequestData,
          details:
            parsedBody.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const {
      sessionId,
      questionId,
      answer,
    } = parsedBody.data;

    const session =
      await getPlacementSession(
        supabase,
        sessionId,
        user.id,
      );

    if (
      !session ||
      session.status !== "in_progress"
    ) {
      return NextResponse.json(
        {
          error:
            API_ERRORS.placementSessionNotFound,
        },
        {
          status: 404,
        },
      );
    }

    const question =
      await getPlacementQuestion(
        supabase,
        {
          questionId,
          sessionId,
          userId: user.id,
        },
      );

    if (!question) {
      return NextResponse.json(
        {
          error:
            API_ERRORS.placementQuestionNotFound,
        },
        {
          status: 404,
        },
      );
    }

    if (question.answer !== null) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .placementQuestionAlreadyAnswered,
        },
        {
          status: 409,
        },
      );
    }

    if (
      question.question_index !==
      session.current_question_index
    ) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .placementQuestionOutOfOrder,
        },
        {
          status: 409,
        },
      );
    }

    const evaluation =
      await evaluatePlacementAnswer({
        question: question.question,
        answer,
        targetLevel:
          question.target_level,
        skill: question.skill,
        expectedAnswerLength:
          question.expected_answer_length,
      });

    const savedQuestion =
      await saveEvaluation(
        supabase,
        {
          question,
          userId: user.id,
          answer,
          evaluation,
        },
      );

    /*
     * Another request may have saved an answer while
     * this request was waiting for AI evaluation.
     */
    if (!savedQuestion) {
      return NextResponse.json(
        {
          error:
            API_ERRORS
              .placementQuestionAlreadyAnswered,
        },
        {
          status: 409,
        },
      );
    }

    const nextQuestionIndex =
  question.question_index + 1;

const adaptiveResults =
  await getAdaptiveQuestionResults(
    supabase,
    session.id,
    user.id,
  );

const adaptiveDecision =
  decideAdaptiveProgress(
    adaptiveResults,
    question.target_level,
  );

const adaptiveFinish =
  adaptiveDecision.action === "finish";

/*
 * When adaptive evaluation determines that enough
 * evidence has been collected, shrink total_questions
 * to the number of questions actually answered.
 *
 * /finish can then use its existing completeness checks
 * without requiring unanswered future TEST_PLAN steps.
 */
const updatedSession =
  await advancePlacementSession(
    supabase,
    {
      session,
      userId: user.id,
      nextQuestionIndex,
      totalQuestions:
        adaptiveFinish
          ? nextQuestionIndex
          : undefined,
    },
  );

const testIsFinished =
  adaptiveFinish ||
  nextQuestionIndex >=
    updatedSession.total_questions ||
  nextQuestionIndex >=
    TEST_PLAN.length;

    const publicEvaluation = {
      grammar: evaluation.grammar,
      vocabulary: evaluation.vocabulary,
      comprehension:
        evaluation.comprehension,
      complexity: evaluation.complexity,
      taskCompletion:
        evaluation.taskCompletion,
      estimatedLevel:
        evaluation.estimatedLevel,
      feedback: evaluation.feedback,
    };

    if (testIsFinished) {
      return NextResponse.json({
        sessionId: updatedSession.id,
        completed: true,
        currentQuestionIndex:
          updatedSession.current_question_index,
        totalQuestions:
          updatedSession.total_questions,
        evaluation: publicEvaluation,
        nextQuestion: null,
      });
    }

    const nextQuestion =
      await generateAndSaveNextQuestion(
        supabase,
        {
          session: updatedSession,
          userId: user.id,
          questionIndex:
            nextQuestionIndex,
        },
      );

    return NextResponse.json({
      sessionId: updatedSession.id,
      completed: false,
      currentQuestionIndex:
        nextQuestion.question_index,
      totalQuestions:
        updatedSession.total_questions,
      progress: {
        completed: nextQuestionIndex,
        current:
          nextQuestion.question_index + 1,
        total:
          updatedSession.total_questions,
      },
      evaluation: publicEvaluation,
      nextQuestion:
        createPublicQuestion(
          nextQuestion,
        ),
    });
  } catch (error) {
    console.error(
      "SUBMIT PLACEMENT TEST ANSWER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          API_ERRORS
            .failedToSubmitPlacementAnswer,
      },
      {
        status: 500,
      },
    );
  }
}
