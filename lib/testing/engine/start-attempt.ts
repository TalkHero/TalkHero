import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAssessmentBlueprint } from "@/lib/testing/blueprints";
import {
  createQuestionSnapshot,
  selectQuestionsForBlueprint,
} from "@/lib/testing/question-bank";
import type {
  AssessmentAttemptItemRecord,
  AssessmentAttemptRecord,
  AssessmentQuestionCategory,
  AssessmentQuestionRecord,
  AssessmentTestRecord,
  CefrLevel,
  PublicAssessmentQuestion,
  PublicAssessmentTest,
} from "@/lib/testing/types";

import { AssessmentEngineError } from "./errors";

type StartAssessmentAttemptInput = {
  userId: string;
  testSlug: string;
};

export type AssessmentAttemptProgress = {
  current: number;
  total: number;
  answered: number;
  skipped: number;
};

export type StartedAssessmentAttempt = {
  attemptId: string;
  resumed: boolean;
  test: PublicAssessmentTest;
  progress: AssessmentAttemptProgress;
  question: PublicAssessmentQuestion;
};

type AttemptItemInsert = {
  attempt_id: string;
  question_id: string;
  question_code: string;
  order_index: number;
  weight: number;
  question_snapshot: PublicAssessmentQuestion;
  user_answer: null;
  answer_status: "pending";
  is_correct: null;
  raw_score: null;
  max_score: number;
  ai_evaluation: null;
  presented_at: string | null;
  response_time_ms: null;
  answered_at: null;
};

function mapAssessmentTest(
  test: AssessmentTestRecord,
): PublicAssessmentTest {
  return {
    id: test.id,
    slug: test.slug,
    name: test.name_uk,
    description: test.description_uk,
    testType: test.test_type,
    cefrLevel: test.cefr_level,
    questionCount: test.question_count,
    passingScore: test.passing_score,
  };
}

function getBlueprintFilters(testSlug: string): {
  levels: CefrLevel[];
  categories: AssessmentQuestionCategory[];
} {
  const blueprint = getAssessmentBlueprint(testSlug);

  if (!blueprint) {
    throw new AssessmentEngineError(
      "BLUEPRINT_NOT_FOUND",
      `Assessment blueprint not found for test: ${testSlug}`,
      { testSlug },
    );
  }

  const levels = Array.from(
    new Set(blueprint.slots.map((slot) => slot.cefrLevel)),
  );

  const categories = Array.from(
    new Set(blueprint.slots.map((slot) => slot.category)),
  );

  return {
    levels,
    categories,
  };
}

function calculateMaxScore(
  items: Array<{ weight: number }>,
): number {
  return items.reduce((total, item) => total + item.weight, 0);
}

async function loadCurrentQuestion(
  attemptId: string,
  currentQuestionIndex: number,
): Promise<AssessmentAttemptItemRecord> {
  const admin = createAdminClient();

  const { data, error } = await admin
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
      ai_evaluation,
      presented_at,
      response_time_ms,
      answered_at,
      created_at
      `,
    )
    .eq("attempt_id", attemptId)
    .eq("order_index", currentQuestionIndex)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to load current assessment question:", error);

    throw new AssessmentEngineError(
      "ATTEMPT_LOAD_FAILED",
      "Failed to load the current assessment question",
      {
        attemptId,
        currentQuestionIndex,
      },
    );
  }

  return data as AssessmentAttemptItemRecord;
}

async function markQuestionPresented(
  attemptId: string,
  orderIndex: number,
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("assessment_attempt_items")
    .update({
      presented_at: new Date().toISOString(),
    })
    .eq("attempt_id", attemptId)
    .eq("order_index", orderIndex)
    .eq("answer_status", "pending")
    .is("presented_at", null);

  if (error) {
    console.error(
      "Failed to mark assessment question as presented:",
      error,
    );

    throw new AssessmentEngineError(
      "ATTEMPT_LOAD_FAILED",
      "Failed to prepare the current assessment question",
      {
        attemptId,
        orderIndex,
      },
    );
  }
}

async function resumeAssessmentAttempt(
  test: AssessmentTestRecord,
  attempt: AssessmentAttemptRecord,
): Promise<StartedAssessmentAttempt> {
  await markQuestionPresented(
    attempt.id,
    attempt.current_question_index,
  );

  const currentItem = await loadCurrentQuestion(
    attempt.id,
    attempt.current_question_index,
  );

  const storedQuestionCount =
    typeof attempt.metadata.questionCount === "number"
      ? attempt.metadata.questionCount
      : test.question_count;

  return {
    attemptId: attempt.id,
    resumed: true,
    test: mapAssessmentTest(test),
    progress: {
      current: attempt.current_question_index + 1,
      total: storedQuestionCount,
      answered: attempt.answered_question_count,
      skipped: attempt.skipped_question_count,
    },
    question: currentItem.question_snapshot,
  };
}

async function removeFailedAttempt(attemptId: string): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("assessment_attempts")
    .delete()
    .eq("id", attemptId);

  if (error) {
    console.error("Failed to clean up assessment attempt:", error);
  }
}

export async function startAssessmentAttempt({
  userId,
  testSlug,
}: StartAssessmentAttemptInput): Promise<StartedAssessmentAttempt> {
  const normalizedSlug = testSlug.trim().toLowerCase();

  if (!userId) {
    throw new AssessmentEngineError(
      "ATTEMPT_CREATE_FAILED",
      "User ID is required",
    );
  }

  if (!normalizedSlug) {
    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      "Assessment test slug is required",
    );
  }

  const admin = createAdminClient();

  const { data: testData, error: testError } = await admin
    .from("assessment_tests")
    .select(
      `
        id,
        slug,
        name_uk,
        description_uk,
        test_type,
        cefr_level,
        question_count,
        passing_score,
        is_active,
        config,
        created_at,
        updated_at
      `,
    )
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (testError) {
    console.error("Failed to load assessment test:", testError);

    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      "Failed to load assessment test",
      { testSlug: normalizedSlug },
    );
  }

  if (!testData) {
    throw new AssessmentEngineError(
      "TEST_NOT_FOUND",
      `Active assessment test not found: ${normalizedSlug}`,
      { testSlug: normalizedSlug },
    );
  }

  const test = testData as AssessmentTestRecord;

  const { data: activeAttemptData, error: activeAttemptError } =
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
          percentage,
          passed,
          final_level,
          confidence,
          current_ability,
          skill_scores,
          metadata,
          started_at,
          completed_at,
          updated_at
        `,
      )
      .eq("user_id", userId)
      .eq("test_id", test.id)
      .eq("status", "in_progress")
      .maybeSingle();

  if (activeAttemptError) {
    console.error(
      "Failed to check active assessment attempt:",
      activeAttemptError,
    );

    throw new AssessmentEngineError(
      "ATTEMPT_LOAD_FAILED",
      "Failed to check active assessment attempt",
      {
        userId,
        testId: test.id,
      },
    );
  }

  if (activeAttemptData) {
    return resumeAssessmentAttempt(
      test,
      activeAttemptData as AssessmentAttemptRecord,
    );
  }

  const blueprint = getAssessmentBlueprint(test.slug);

  if (!blueprint) {
    throw new AssessmentEngineError(
      "BLUEPRINT_NOT_FOUND",
      `Assessment blueprint not found for test: ${test.slug}`,
      { testSlug: test.slug },
    );
  }

  const { levels, categories } = getBlueprintFilters(test.slug);

  const { data: questionData, error: questionError } = await admin
  .from("assessment_questions")
  .select(`
    id,
    question_code,
    cefr_level,
    category,
    question_type,
    prompt,
    passage,
    options,
    correct_answer,
    explanation_uk,
    difficulty,
    discrimination,
    estimated_time_seconds,
    topic,
    tags,
    source,
    status,
    created_at,
    updated_at
  `)
  .eq("status", "published")
  .not("question_code", "like", "LEGACY-%")
  .in("cefr_level", levels)
  .in("category", categories);

  if (questionError) {
    console.error(
      "Failed to load assessment question bank:",
      questionError,
    );

    throw new AssessmentEngineError(
      "NOT_ENOUGH_QUESTIONS",
      "Failed to load assessment question bank",
      { testSlug: test.slug },
    );
  }

  const questionPool =
    (questionData ?? []) as AssessmentQuestionRecord[];

  const selection = selectQuestionsForBlueprint(
    questionPool,
    blueprint,
  );

  if (
    selection.missingSlots.length > 0 ||
    selection.questions.length !== blueprint.questionCount
  ) {
    throw new AssessmentEngineError(
      "NOT_ENOUGH_QUESTIONS",
      "Not enough published questions for assessment blueprint",
      {
        testSlug: test.slug,
        expectedQuestionCount: blueprint.questionCount,
        selectedQuestionCount: selection.questions.length,
        missingSlots: selection.missingSlots,
      },
    );
  }

  const maxScore = calculateMaxScore(selection.questions);

  const initialAbility =
    test.test_type === "placement" ? 0.5 : null;

  const { data: attemptData, error: attemptError } = await admin
    .from("assessment_attempts")
    .insert({
      user_id: userId,
      test_id: test.id,
      status: "in_progress",
      current_question_index: 0,
      answered_question_count: 0,
      correct_answer_count: 0,
      skipped_question_count: 0,
      raw_score: 0,
      max_score: maxScore,
      percentage: null,
      passed: null,
      final_level: null,
      confidence: test.test_type === "placement" ? 0 : null,
      current_ability: initialAbility,
      skill_scores: {},
      metadata: {
        questionCount: selection.questions.length,
        blueprintSlug: blueprint.slug,
        adaptive: test.test_type === "placement",
      },
      completed_at: null,
    })
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
        percentage,
        passed,
        final_level,
        confidence,
        current_ability,
        skill_scores,
        metadata,
        started_at,
        completed_at,
        updated_at
      `,
    )
    .single();

  if (attemptError || !attemptData) {
    /*
     * A concurrent request may have created the active attempt after
     * our first lookup. Try loading that attempt before failing.
     */
    if (attemptError?.code === "23505") {
      const { data: concurrentAttempt } = await admin
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
            percentage,
            passed,
            final_level,
            confidence,
            current_ability,
            skill_scores,
            metadata,
            started_at,
            completed_at,
            updated_at
          `,
        )
        .eq("user_id", userId)
        .eq("test_id", test.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (concurrentAttempt) {
        return resumeAssessmentAttempt(
          test,
          concurrentAttempt as AssessmentAttemptRecord,
        );
      }
    }

    console.error("Failed to create assessment attempt:", attemptError);

    throw new AssessmentEngineError(
      "ATTEMPT_CREATE_FAILED",
      "Failed to create assessment attempt",
      {
        userId,
        testId: test.id,
      },
    );
  }

  const attempt = attemptData as AssessmentAttemptRecord;
const firstPresentedAt = new Date().toISOString();

const attemptItems: AttemptItemInsert[] =
  selection.questions.map((selected, orderIndex) => ({
    attempt_id: attempt.id,
    question_id: selected.question.id,
    question_code: selected.question.question_code,
    order_index: orderIndex,
    weight: selected.weight,
    question_snapshot: createQuestionSnapshot(
      selected.question,
    ),
    user_answer: null,
    answer_status: "pending",
    is_correct: null,
    raw_score: null,
    max_score: selected.weight,
    ai_evaluation: null,
    presented_at:
      orderIndex === 0 ? firstPresentedAt : null,
    response_time_ms: null,
    answered_at: null,
  }));

  const { error: itemsError } = await admin
    .from("assessment_attempt_items")
    .insert(attemptItems);

  if (itemsError) {
    console.error(
      "Failed to create assessment attempt items:",
      itemsError,
    );

    await removeFailedAttempt(attempt.id);

    throw new AssessmentEngineError(
      "ATTEMPT_ITEMS_CREATE_FAILED",
      "Failed to create assessment attempt items",
      {
        attemptId: attempt.id,
        itemCount: attemptItems.length,
      },
    );
  }

  return {
    attemptId: attempt.id,
    resumed: false,
    test: mapAssessmentTest(test),
    progress: {
      current: 1,
      total: selection.questions.length,
      answered: 0,
      skipped: 0,
    },
    question: attemptItems[0].question_snapshot,
  };
}
