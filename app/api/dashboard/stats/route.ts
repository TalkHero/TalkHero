import { NextResponse } from "next/server";

import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";
import { LONDON_CAMPAIGN } from "@/lib/adventure/content";
import { getAdventureCampaignProgress } from "@/lib/adventure/progress";

type QuestionSnapshot = {
  category?: unknown;
};

type AssessmentItemRow = {
  is_correct: boolean | null;
  response_time_ms: number | null;
  answer_status: string;
  question_snapshot: QuestionSnapshot | null;
};

type CategoryAccumulator = {
  answered: number;
  correct: number;
  totalResponseTimeMs: number;
  timedAnswers: number;
};

function normalizeCategory(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized || null;
}

function buildRecommendedTestSlug(
  englishLevel: string | null | undefined,
): string {
  const normalizedLevel = englishLevel?.trim().toLowerCase() || "a1";

  const supportedLevels = new Set(["a1", "a2", "b1", "b2", "c1"]);

  return supportedLevels.has(normalizedLevel)
    ? `english-${normalizedLevel}`
    : "english-a1";
}

function calculateAssessmentAnalytics(items: AssessmentItemRow[]) {
  const categoryMap = new Map<string, CategoryAccumulator>();

  let totalResponseTimeMs = 0;
  let timedAnswerCount = 0;

  for (const item of items) {
    if (item.answer_status === "pending") {
      continue;
    }

    const category = normalizeCategory(item.question_snapshot?.category);

    if (!category) {
      continue;
    }

    const current = categoryMap.get(category) ?? {
      answered: 0,
      correct: 0,
      totalResponseTimeMs: 0,
      timedAnswers: 0,
    };

    current.answered += 1;

    if (item.is_correct === true) {
      current.correct += 1;
    }

    if (
      typeof item.response_time_ms === "number" &&
      item.response_time_ms >= 0
    ) {
      current.totalResponseTimeMs += item.response_time_ms;

      current.timedAnswers += 1;

      totalResponseTimeMs += item.response_time_ms;

      timedAnswerCount += 1;
    }

    categoryMap.set(category, current);
  }

  const categories = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      answered: stats.answered,
      correct: stats.correct,

      percentage:
        stats.answered > 0
          ? Math.round((stats.correct / stats.answered) * 100)
          : 0,

      averageResponseTimeMs:
        stats.timedAnswers > 0
          ? Math.round(stats.totalResponseTimeMs / stats.timedAnswers)
          : null,
    }))
    .sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }

      return b.answered - a.answered;
    });

  const strongestCategory =
    categories.length > 0 ? categories[0].category : null;

  const weakestCategory =
    categories.length > 0
      ? [...categories].sort((a, b) => {
          if (a.percentage !== b.percentage) {
            return a.percentage - b.percentage;
          }

          return b.answered - a.answered;
        })[0].category
      : null;

  return {
    averageResponseTimeMs:
      timedAnswerCount > 0
        ? Math.round(totalResponseTimeMs / timedAnswerCount)
        : null,

    categories,
    strongestCategory,
    weakestCategory,
  };
}

export async function GET() {
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

    const now = new Date();

    const startOfToday = new Date(now);

    startOfToday.setHours(0, 0, 0, 0);

    const nowIso = now.toISOString();

    const startOfTodayIso = startOfToday.toISOString();

    const [
      profileResult,
      conversationsResult,
      vocabularyResult,
      learnedResult,
      dueResult,
      speakingTodayResult,
      reviewedTodayResult,
      completedMissionsTodayResult,
      latestAssessmentResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, english_level, xp, level, streak")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("conversations")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "learned"),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .lte("next_review_at", nowIso),

      supabase
        .from("speaking_sessions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .gte("completed_at", startOfTodayIso)
        .lte("completed_at", nowIso),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .gte("last_reviewed_at", startOfTodayIso)
        .lte("last_reviewed_at", nowIso),

      supabase
        .from("quest_runs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", startOfTodayIso)
        .lte("completed_at", nowIso),

      supabase
        .from("assessment_attempts")
        .select(
          `
            id,
            test_id,
            percentage,
            passed,
            final_level,
            completed_at
          `,
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (conversationsResult.error) {
      throw conversationsResult.error;
    }

    if (vocabularyResult.error) {
      throw vocabularyResult.error;
    }

    if (learnedResult.error) {
      throw learnedResult.error;
    }

    if (dueResult.error) {
      throw dueResult.error;
    }

    if (speakingTodayResult.error) {
      throw speakingTodayResult.error;
    }

    if (reviewedTodayResult.error) {
      throw reviewedTodayResult.error;
    }

    if (completedMissionsTodayResult.error) {
      throw completedMissionsTodayResult.error;
    }

    if (latestAssessmentResult.error) {
      throw latestAssessmentResult.error;
    }

    const englishLevel = profileResult.data?.english_level || "A1";

    const recommendedTestSlug = buildRecommendedTestSlug(englishLevel);

    const adventureProgress = await getAdventureCampaignProgress(
      LONDON_CAMPAIGN.progressCampaignSlug,
    );

    const nextProgressMission =
      adventureProgress.missions.find(
        (mission) => mission.status === "in_progress",
      ) ??
      adventureProgress.missions.find(
        (mission) => mission.status === "available",
      ) ??
      null;

    const nextAdventureMission = nextProgressMission
      ? (LONDON_CAMPAIGN.missions.find(
          (mission) => mission.slug === nextProgressMission.questSlug,
        ) ?? null)
      : null;

    const nextAdventure = {
      campaignTitle: LONDON_CAMPAIGN.title,
      campaignLocation: LONDON_CAMPAIGN.location,
      completedMissions: adventureProgress.completedMissions,
      totalMissions: adventureProgress.totalMissions,

      mission:
        nextProgressMission && nextAdventureMission
          ? {
              slug: nextAdventureMission.slug,
              title: nextAdventureMission.title,
              subtitle: nextAdventureMission.subtitle,
              description: nextAdventureMission.description,
              status:
                nextProgressMission.status === "in_progress"
                  ? ("in_progress" as const)
                  : ("available" as const),
              href: `/adventure/${LONDON_CAMPAIGN.slug}/${nextAdventureMission.slug}`,
            }
          : null,
    };

    let assessment: {
      hasAssessment: boolean;

      latest: {
        attemptId: string;
        testSlug: string;
        testName: string;
        cefrLevel: string | null;
        finalLevel: string | null;
        percentage: number;
        passed: boolean | null;
        completedAt: string;
        averageResponseTimeMs: number | null;
      } | null;

      categories: Array<{
        category: string;
        answered: number;
        correct: number;
        percentage: number;
        averageResponseTimeMs: number | null;
      }>;

      strongestCategory: string | null;

      weakestCategory: string | null;

      recommendedTestSlug: string;
    } = {
      hasAssessment: false,
      latest: null,
      categories: [],
      strongestCategory: null,
      weakestCategory: null,
      recommendedTestSlug,
    };

    const latestAttempt = latestAssessmentResult.data;

    if (latestAttempt) {
      const [testResult, itemsResult] = await Promise.all([
        supabase
          .from("assessment_tests")
          .select("slug, name_uk, cefr_level")
          .eq("id", latestAttempt.test_id)
          .maybeSingle(),

        supabase
          .from("assessment_attempt_items")
          .select(
            `
              is_correct,
              response_time_ms,
              answer_status,
              question_snapshot
            `,
          )
          .eq("attempt_id", latestAttempt.id)
          .neq("answer_status", "pending"),
      ]);

      if (testResult.error) {
        throw testResult.error;
      }

      if (itemsResult.error) {
        throw itemsResult.error;
      }

      const analytics = calculateAssessmentAnalytics(
        (itemsResult.data ?? []) as AssessmentItemRow[],
      );

      assessment = {
        hasAssessment: true,

        latest: {
          attemptId: latestAttempt.id,

          testSlug: testResult.data?.slug ?? recommendedTestSlug,

          testName: testResult.data?.name_uk ?? "Тест рівня",

          cefrLevel: testResult.data?.cefr_level ?? null,

          finalLevel: latestAttempt.final_level ?? null,

          percentage: latestAttempt.percentage ?? 0,

          passed: latestAttempt.passed ?? null,

          completedAt: latestAttempt.completed_at ?? nowIso,

          averageResponseTimeMs: analytics.averageResponseTimeMs,
        },

        categories: analytics.categories,

        strongestCategory: analytics.strongestCategory,

        weakestCategory: analytics.weakestCategory,

        recommendedTestSlug,
      };
    }

    const speakingToday = speakingTodayResult.count ?? 0;

    const reviewedToday = reviewedTodayResult.count ?? 0;

    const completedMissionsToday = completedMissionsTodayResult.count ?? 0;

    const dailyGoalItems = [
      {
        id: "speaking" as const,

        title: "Розмовна практика",

        description: "Завершіть одну голосову практику з Еммою.",

        current: speakingToday,
        target: 1,

        completed: speakingToday >= 1,

        href: "/speaking",
      },

      {
        id: "review" as const,

        title: "Повторення слів",

        description: "Повторіть щонайменше 5 слів зі словника.",

        current: reviewedToday,
        target: 5,

        completed: reviewedToday >= 5,

        href: "/review",
      },

      {
        id: "mission" as const,

        title: "Місія пригоди",

        description: "Завершіть одну навчальну місію.",

        current: completedMissionsToday,

        target: 1,

        completed: completedMissionsToday >= 1,

        href: "/adventure",
      },
    ];

    const completedDailyGoals = dailyGoalItems.filter(
      (goal) => goal.completed,
    ).length;

    return NextResponse.json({
      profile: {
        fullName:
          profileResult.data?.full_name ||
          user.email?.split("@")[0] ||
          "Студент",

        englishLevel,

        xp: profileResult.data?.xp ?? 0,

        level: profileResult.data?.level ?? 1,

        streak: profileResult.data?.streak ?? 0,
      },

      stats: {
        conversations: conversationsResult.count ?? 0,

        vocabulary: vocabularyResult.count ?? 0,

        learned: learnedResult.count ?? 0,

        dueToday: dueResult.count ?? 0,

        speakingToday,

        reviewedToday,

        completedMissionsToday,
      },

      dailyGoals: {
        completedCount: completedDailyGoals,

        totalCount: dailyGoalItems.length,

        items: dailyGoalItems,
      },

      nextAdventure,

      assessment,
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);

    return NextResponse.json(
      {
        error: API_ERRORS.failedToLoadDashboardStatistics,
      },
      {
        status: 500,
      },
    );
  }
}
