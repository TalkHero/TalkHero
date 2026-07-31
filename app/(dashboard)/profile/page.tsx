"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { XpProgress } from "@/components/profile/XpProgress";
import { StatisticsCards } from "@/components/profile/StatisticsCards";
import { AchievementsGrid } from "@/components/profile/AchievementsGrid";
import type { ProfileAchievement } from "@/components/profile/AchievementCard";
import { ActivityCalendar } from "@/components/profile/ActivityCalendar";

type ProfileDashboardData = {
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    nativeLanguage: string | null;
    targetLanguage: string | null;
    englishLevel: string;
  };

  progress: {
    xp: number;
    level: number;
    currentLevelXp: number;
    nextLevelXp: number;
    xpInsideCurrentLevel: number;
    xpRequiredForNextLevel: number;
    progressPercent: number;
  };

  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  };

  achievements: {
    items: ProfileAchievement[];
    unlocked: ProfileAchievement[];
    locked: ProfileAchievement[];
    total: number;
    unlockedCount: number;
  };
activity: {
  days: {
    date: string;
    count: number;
  }[];
  totalActiveDays: number;
  totalActivities: number;
};
  statistics: {
    messagesSent: number;
    savedWords: number;
    speakingSessions: number;
    conversations: number;
  };


};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        cache: "no-store",
      });

      const responseData: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof responseData === "object" &&
          responseData !== null &&
          "error" in responseData &&
          typeof responseData.error === "string"
            ? responseData.error
            : "Не вдалося завантажити профіль.";

        throw new Error(message);
      }

      setData(responseData as ProfileDashboardData);
    } catch (error) {
      console.error("LOAD PROFILE ERROR:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Не вдалося завантажити профіль.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            Не вдалося завантажити профіль
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {errorMessage ?? "Сталася невідома помилка."}
          </p>

          <button
            type="button"
            onClick={() => void loadProfile()}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4" />
            Спробуйте ще
            </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <ProfileHeader
          fullName={data.profile.fullName}
          email={data.profile.email}
          englishLevel={data.profile.englishLevel}
          currentStreak={data.streak.currentStreak}
          longestStreak={data.streak.longestStreak}
        />

        <XpProgress
          xp={data.progress.xp}
          level={data.progress.level}
          xpInsideCurrentLevel={data.progress.xpInsideCurrentLevel}
          xpRequiredForNextLevel={data.progress.xpRequiredForNextLevel}
          progressPercent={data.progress.progressPercent}
        />

        <StatisticsCards
          messagesSent={data.statistics.messagesSent}
          savedWords={data.statistics.savedWords}
          speakingSessions={data.statistics.speakingSessions}
          conversations={data.statistics.conversations}
        />

        <ActivityCalendar
  days={data.activity.days}
  totalActiveDays={data.activity.totalActiveDays}
  currentStreak={data.streak.currentStreak}
/>

        <AchievementsGrid
          achievements={data.achievements.items}
          unlockedCount={data.achievements.unlockedCount}
          total={data.achievements.total}
        />
      </div>
    </main>
  );
}
