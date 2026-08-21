export type DailyGoalId = "speaking" | "review" | "mission";

export type DashboardData = {
  profile: {
    fullName: string;
    englishLevel: string;
    xp: number;
    level: number;
    streak: number;
  };

  stats: {
    conversations: number;
    vocabulary: number;
    learned: number;
    dueToday: number;
    speakingToday: number;
    reviewedToday: number;
    completedMissionsToday: number;
  };

  languageMastery: {
    activeErrors: number;
    masteredErrors: number;

    practiceItems: Array<{
      errorKey: string;
      errorType: string;
      originalText: string;
      correctedText: string;
      occurrenceCount: number;
      successfulUses: number;
    }>;
  };

  dailyGoals: {
    completedCount: number;
    totalCount: number;

    items: Array<{
      id: DailyGoalId;
      title: string;
      description: string;
      current: number;
      target: number;
      completed: boolean;
      href: string;
    }>;
  };

  nextAdventure: {
    campaignTitle: string;
    campaignLocation: string;
    completedMissions: number;
    totalMissions: number;
    mission: {
      slug: string;
      title: string;
      subtitle: string;
      description: string;
      status: "available" | "in_progress";
      href: string;
    } | null;
  };

  assessment: {
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
  };
};
