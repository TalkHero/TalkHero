"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  RotateCcw,
} from "lucide-react";

import { DailyGoalsSection } from "@/components/dashboard/DailyGoalsSection";
import { LanguageMasterySection } from "@/components/dashboard/LanguageMasterySection";
import { LearningModesSection } from "@/components/dashboard/LearningModesSection";
import { LevelProgressSection } from "@/components/dashboard/LevelProgressSection";
import { NextStepSection } from "@/components/dashboard/NextStepSection";
import { ProgressOverviewSection } from "@/components/dashboard/ProgressOverviewSection";
import { VocabularyProgressSection } from "@/components/dashboard/VocabularyProgressSection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

const NEXT_ENGLISH_LEVEL: Record<string, string> = {
  A1: "A2",
  A2: "B1",
  B1: "B2",
  B2: "C1",
};

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[420px] items-center justify-center"
    >
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center justify-center gap-3">
          <Loader2
            className="size-5 animate-spin text-primary"
            aria-hidden="true"
          />

          <span className="text-sm text-muted-foreground">
            Завантажуємо головну сторінку…
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/20 bg-destructive-soft">
      <CardHeader className="text-center">
        <CardTitle className="text-destructive">
          Не вдалося завантажити головну сторінку
        </CardTitle>

        <CardDescription className="text-red-700 dark:text-red-300">
          {message}
        </CardDescription>
      </CardHeader>

      <CardFooter className="justify-center border-destructive/10">
        <Button variant="destructive" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Спробувати ще раз
        </Button>
      </CardFooter>
    </Card>
  );
}

export function HomeScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/dashboard/stats", {
        cache: "no-store",
      });

      const responseData = (await response.json()) as
        DashboardData | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in responseData && responseData.error
            ? responseData.error
            : "Не вдалося отримати дані головної сторінки.",
        );
      }

      setData(responseData as DashboardData);
    } catch (error) {
      console.error("LOAD DASHBOARD ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Сталася невідома помилка під час завантаження.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDashboard]);


  if (loading) {
    return <LoadingState />;
  }

  if (!data) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => {
          void loadDashboard();
        }}
      />
    );
  }

  const currentEnglishLevel =
    data.profile.englishLevel?.trim().toUpperCase() || "A1";

  const nextEnglishLevel =
    NEXT_ENGLISH_LEVEL[currentEnglishLevel] ?? null;

  const levelTestHref = nextEnglishLevel
    ? `/assessment/english-${nextEnglishLevel.toLowerCase()}`
    : null;


  const reviewGoal = data.dailyGoals.items.find((goal) => goal.id === "review");

  const isNewUser =
    data.profile.xp === 0 &&
    data.stats.vocabulary === 0 &&
    !data.assessment.hasAssessment;

  const smartNextStep = isNewUser
    ? {
        label: "Почніть тут",
        title: "Познайомтеся з Еммою",
        description:
          "Почніть із короткої розмови з вашим AI-викладачем. Емма допоможе зробити перший крок без стресу.",
        href: "/chat",
        action: "Написати Еммі",
        context: "Ваше перше заняття",
        kind: "chat" as const,
      }
    : data.nextAdventure.mission
      ? {
          label: "Наступний крок",
          title: data.nextAdventure.mission.title,
          description: data.nextAdventure.mission.description,
          href: data.nextAdventure.mission.href,
          action:
            data.nextAdventure.mission.status === "in_progress"
              ? "Продовжити"
              : "Почати місію",
          context: data.nextAdventure.campaignLocation,
          kind: "adventure" as const,
        }
      : reviewGoal && !reviewGoal.completed && data.stats.dueToday > 0
        ? {
            label: "Рекомендовано",
            title: "Повторення слів",
            description: `У вас ${data.stats.dueToday} слів, готових до повторення.`,
            href: "/review",
            action: "Почати повторення",
            context: "Щоденна ціль",
            kind: "review" as const,
          }
        : {
            label: "Рекомендовано",
            title: "Розмовна практика з Еммою",
            description:
              "Закріпіть свій прогрес у живій розмові та отримайте мовний зворотний зв’язок.",
            href: "/speaking",
            action: "Почати практику",
            context: "Щоденна практика",
            kind: "speaking" as const,
          };

  return (
    <div className="space-y-8">
      <LevelProgressSection
        currentEnglishLevel={currentEnglishLevel}
        nextEnglishLevel={nextEnglishLevel}
        levelTestHref={levelTestHref}
      />
      <DailyGoalsSection goals={data.dailyGoals} />

      <NextStepSection step={smartNextStep} />
      <LearningModesSection
        nextAdventure={data.nextAdventure}
        stats={data.stats}
      />
      <ProgressOverviewSection
        profile={data.profile}
        stats={data.stats}
        nextAdventure={data.nextAdventure}
      />
      <LanguageMasterySection
        languageMastery={data.languageMastery}
      />
      <VocabularyProgressSection
        stats={data.stats}
      />
    </div>
  );
}
