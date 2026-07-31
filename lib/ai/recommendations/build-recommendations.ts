import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type {
  LearningRecommendation,
  RecommendationCategoryStats,
  RecommendationTopicStats,
} from "./types";

const MAX_REASONABLE_RESPONSE_TIME_MS = 120_000;

type QuestionSnapshot = {
  category?: unknown;
  topic?: unknown;
};

type AttemptItemRow = {
  answer_status: string;
  is_correct: boolean | null;
  response_time_ms: number | null;
  question_snapshot: QuestionSnapshot | null;
};

type MutableCategoryStats = {
  category: string;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  totalResponseTimeMs: number;
  timedAnswers: number;
};

type MutableTopicStats = {
  topic: string;
  category: string | null;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeCategory(value: unknown): string | null {
  const normalized = normalizeText(value);

  return normalized?.toLowerCase() ?? null;
}

function calculatePercentage(
  correct: number,
  answered: number,
): number {
  if (answered <= 0) {
    return 0;
  }

  return Math.round((correct / answered) * 100);
}

function buildSummary(
  strongestCategories: RecommendationCategoryStats[],
  weakestCategories: RecommendationCategoryStats[],
  weakestTopics: RecommendationTopicStats[],
): string {
  const strongest = strongestCategories[0];
  const weakest = weakestCategories[0];
  const topic = weakestTopics[0];

  if (!strongest && !weakest) {
    return "Поки недостатньо даних для персональних рекомендацій.";
  }

  if (strongest && weakest && topic) {
    return [
      `Найкращий результат у категорії «${strongest.category}».`,
      `Найбільше уваги варто приділити категорії «${weakest.category}»`,
      `та темі «${topic.topic}».`,
    ].join(" ");
  }

  if (strongest && weakest) {
    return [
      `Найкращий результат у категорії «${strongest.category}».`,
      `Для подальшого прогресу варто попрацювати над категорією «${weakest.category}».`,
    ].join(" ");
  }

  return "Продовжуйте практику, щоб отримати точніші персональні рекомендації.";
}

export async function buildRecommendations(
  attemptId: string,
): Promise<LearningRecommendation> {
  const normalizedAttemptId = attemptId.trim();

  if (!normalizedAttemptId) {
    throw new Error(
      "Attempt ID is required to build recommendations.",
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("assessment_attempt_items")
    .select(
      `
        answer_status,
        is_correct,
        response_time_ms,
        question_snapshot
      `,
    )
    .eq("attempt_id", normalizedAttemptId)
    .neq("answer_status", "pending");

  if (error) {
    console.error(
      "Failed to load assessment items for recommendations:",
      error,
    );

    throw new Error(
      "Failed to load assessment data for recommendations.",
    );
  }

  const items = (data ?? []) as AttemptItemRow[];

  const categoryMap = new Map<
    string,
    MutableCategoryStats
  >();

  const topicMap = new Map<
    string,
    MutableTopicStats
  >();

  let totalResponseTimeMs = 0;
  let timedAnswerCount = 0;

  for (const item of items) {
    const category =
      normalizeCategory(
        item.question_snapshot?.category,
      ) ?? "unknown";

    const topic = normalizeText(
      item.question_snapshot?.topic,
    );

    const isSkipped =
      item.answer_status === "skipped";

    const isCorrect =
      item.is_correct === true;

    const isIncorrect =
      !isSkipped &&
      item.is_correct === false;

    const categoryStats =
      categoryMap.get(category) ?? {
        category,
        answered: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        totalResponseTimeMs: 0,
        timedAnswers: 0,
      };

    categoryStats.answered += 1;

    if (isCorrect) {
      categoryStats.correct += 1;
    }

    if (isIncorrect) {
      categoryStats.incorrect += 1;
    }

    if (isSkipped) {
      categoryStats.skipped += 1;
    }

    const responseTimeMs =
      item.response_time_ms;

    if (
      typeof responseTimeMs === "number" &&
      responseTimeMs >= 0 &&
      responseTimeMs <=
        MAX_REASONABLE_RESPONSE_TIME_MS
    ) {
      categoryStats.totalResponseTimeMs +=
        responseTimeMs;

      categoryStats.timedAnswers += 1;

      totalResponseTimeMs += responseTimeMs;
      timedAnswerCount += 1;
    }

    categoryMap.set(
      category,
      categoryStats,
    );

    if (topic) {
      const topicKey =
        `${category}:${topic.toLowerCase()}`;

      const topicStats =
        topicMap.get(topicKey) ?? {
          topic,
          category:
            category === "unknown"
              ? null
              : category,
          answered: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        };

      topicStats.answered += 1;

      if (isCorrect) {
        topicStats.correct += 1;
      }

      if (isIncorrect) {
        topicStats.incorrect += 1;
      }

      if (isSkipped) {
        topicStats.skipped += 1;
      }

      topicMap.set(topicKey, topicStats);
    }
  }

  const categories: RecommendationCategoryStats[] =
    Array.from(categoryMap.values()).map(
      (stats) => ({
        category: stats.category,
        answered: stats.answered,
        correct: stats.correct,
        incorrect: stats.incorrect,
        skipped: stats.skipped,
        percentage: calculatePercentage(
          stats.correct,
          stats.answered,
        ),
        averageResponseTimeMs:
          stats.timedAnswers > 0
            ? Math.round(
                stats.totalResponseTimeMs /
                  stats.timedAnswers,
              )
            : null,
      }),
    );

  const strongestCategories = [...categories]
    .filter(
      (category) =>
        category.category !== "unknown",
    )
    .sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }

      return b.answered - a.answered;
    })
    .slice(0, 2);

  const weakestCategories = [...categories]
    .filter(
      (category) =>
        category.category !== "unknown",
    )
    .sort((a, b) => {
      if (a.percentage !== b.percentage) {
        return a.percentage - b.percentage;
      }

      if (b.incorrect !== a.incorrect) {
        return b.incorrect - a.incorrect;
      }

      return b.answered - a.answered;
    })
    .slice(0, 2);

  const topics: RecommendationTopicStats[] =
    Array.from(topicMap.values()).map(
      (stats) => ({
        topic: stats.topic,
        category: stats.category,
        answered: stats.answered,
        correct: stats.correct,
        incorrect: stats.incorrect,
        skipped: stats.skipped,
        percentage: calculatePercentage(
          stats.correct,
          stats.answered,
        ),
      }),
    );

  const weakestTopics = topics
    .filter(
      (topic) =>
        topic.incorrect > 0 ||
        topic.skipped > 0,
    )
    .sort((a, b) => {
      if (a.percentage !== b.percentage) {
        return a.percentage - b.percentage;
      }

      if (b.incorrect !== a.incorrect) {
        return b.incorrect - a.incorrect;
      }

      return b.skipped - a.skipped;
    })
    .slice(0, 5);

  const recommendedTopics = weakestTopics
    .map((topic) => topic.topic)
    .filter(
      (topic, index, allTopics) =>
        allTopics.indexOf(topic) === index,
    )
    .slice(0, 3);

  return {
    attemptId: normalizedAttemptId,

    strongestCategories,
    weakestCategories,

    weakestTopics,
    recommendedTopics,

    averageResponseTimeMs:
      timedAnswerCount > 0
        ? Math.round(
            totalResponseTimeMs /
              timedAnswerCount,
          )
        : null,

    summary: buildSummary(
      strongestCategories,
      weakestCategories,
      weakestTopics,
    ),
  };
}
