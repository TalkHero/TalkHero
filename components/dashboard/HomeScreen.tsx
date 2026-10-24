"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Flame,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageCircle,
  Mic,
  RotateCcw,
  Star,
  Target,
  Trophy,
} from "lucide-react";

import { DailyGoalsSection } from "@/components/dashboard/DailyGoalsSection";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/dashboard/types";

type LearningMode = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: typeof MessageCircle;
  iconClassName: string;
};

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

function ModeCard({ mode }: { mode: LearningMode }) {
  const Icon = mode.icon;

  return (
    <Link href={mode.href} className="talkhero-focus group rounded-xl">
      <Card
        interactive
        className="h-full transition-colors group-hover:border-primary/20"
      >
        <CardHeader>
          <div
            className={[
              "flex size-12 items-center justify-center rounded-lg",
              mode.iconClassName,
            ].join(" ")}
          >
            <Icon className="size-6" aria-hidden="true" />
          </div>

          <CardTitle className="pt-3">{mode.title}</CardTitle>

          <CardDescription>{mode.description}</CardDescription>
        </CardHeader>

        <CardFooter className="mt-auto border-0 pt-0">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {mode.actionLabel}

            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </CardFooter>
      </Card>
    </Link>
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


  const learnedPercentage =
    data.stats.vocabulary > 0
      ? Math.round((data.stats.learned / data.stats.vocabulary) * 100)
      : 0;

  const modes: LearningMode[] = [
    {
      href: data.nextAdventure.mission?.href ?? "/adventure",
      title: "Пригода",
      description: data.nextAdventure.mission
        ? data.nextAdventure.mission.description
        : `Кампанію «${data.nextAdventure.campaignTitle}» завершено. Перегляньте доступні пригоди.`,
      actionLabel: data.nextAdventure.mission
        ? data.nextAdventure.mission.status === "in_progress"
          ? "Продовжити пригоду"
          : "Почати місію"
        : "Переглянути пригоди",
      icon: Gamepad2,
      iconClassName: "bg-primary-soft text-primary",
    },
    {
      href: "/speaking",
      title: "Розмовна практика",
      description:
        "Говоріть уголос, тренуйте вимову та отримуйте зворотний зв’язок.",
      actionLabel: "Почати говорити",
      icon: Mic,
      iconClassName: "bg-violet-50 text-violet-700",
    },
    {
      href: "/vocabulary",
      title: "Словник",
      description:
        "Зберігайте корисні слова й фрази та відстежуйте свій прогрес.",
      actionLabel: "Відкрити словник",
      icon: BookOpen,
      iconClassName: "bg-success-soft text-emerald-700",
    },
    {
      href: "/review",
      title: "Повторення",
      description:
        "Повертайтеся до складних слів і закріплюйте вивчений матеріал.",
      actionLabel: "Почати повторення",
      icon: Trophy,
      iconClassName: "bg-warning-soft text-amber-700",
    },
  ];

  const statistics = [
    {
      label: "Завершено місій",
      value: data.nextAdventure.completedMissions.toString(),
      icon: Gamepad2,
      iconClassName: "bg-primary-soft text-primary",
    },
    {
      label: "Загальний досвід",
      value: `${data.profile.xp} XP`,
      icon: Star,
      iconClassName: "bg-warning-soft text-amber-700",
    },
    {
      label: "Поточна серія",
      value: `${data.profile.streak} дн.`,
      icon: Flame,
      iconClassName: "bg-orange-50 text-orange-700",
    },
    {
      label: "Вивчено слів",
      value: data.stats.learned.toString(),
      icon: BookOpen,
      iconClassName: "bg-success-soft text-emerald-700",
    },
  ];

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
      <section aria-labelledby="level-progress-heading">
        <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-white via-white to-violet-50">
          <CardHeader>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <Badge variant="neutral" className="mb-3">
                  <BookOpenCheck aria-hidden="true" />
                  Оцінювання знань
                </Badge>

                <CardTitle
                  id="level-progress-heading"
                  className="text-3xl sm:text-4xl"
                >
                  Ваш рівень англійської
                </CardTitle>

                <CardDescription className="mt-3 text-base leading-7">
                  {nextEnglishLevel
                    ? `Наступна ціль — ${nextEnglishLevel}. Складіть тест рівня ${nextEnglishLevel} щонайменше на 70%, щоб підвищити свій рівень англійської.`
                    : "Ви досягли найвищого рівня, для якого зараз доступний тест у TalkHero."}
                </CardDescription>
              </div>

              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <GraduationCap className="size-7" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-xl border bg-white p-5">
                <p className="text-sm font-medium text-muted-foreground">
                  Поточний рівень
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {currentEnglishLevel}
                </p>
              </div>

              <div className="hidden justify-center sm:flex">
                <ArrowRight
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
                <p className="text-sm font-medium text-violet-700">
                  {nextEnglishLevel
                    ? "Наступна ціль"
                    : "Прогрес рівня"}
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {nextEnglishLevel ?? currentEnglishLevel}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            {nextEnglishLevel && levelTestHref ? (
              <Link
                href={levelTestHref}
                className={buttonVariants()}
              >
                Пройти тест {nextEnglishLevel}
                <ArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <Badge variant="neutral">
                Максимальний доступний рівень
              </Badge>
            )}
          </CardFooter>
        </Card>
      </section>


      <DailyGoalsSection goals={data.dailyGoals} />

      <section aria-labelledby="next-step-heading">
        <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white via-white to-primary-soft">
          <CardHeader className="pb-3">
            <Badge className="mb-2 w-fit">
              <Target aria-hidden="true" />
              {smartNextStep.label}
            </Badge>

            <CardTitle
              id="next-step-heading"
              className="text-3xl sm:text-4xl"
            >
              {smartNextStep.title}
            </CardTitle>

            <CardDescription className="max-w-3xl text-base leading-7">
              {smartNextStep.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white/80 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {smartNextStep.context}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Продовжуйте з того місця, де зупинилися.
                </p>
              </div>

              <Link
                href={smartNextStep.href}
                className={buttonVariants()}
              >
                {smartNextStep.action}
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="learning-modes-heading">
        <div className="mb-5">
          <h2
            id="learning-modes-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Ваші напрями навчання
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Оберіть формат, який найкраще відповідає вашій сьогоднішній цілі.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modes.map((mode) => (
            <ModeCard key={mode.title} mode={mode} />
          ))}
        </div>
      </section>

      <section aria-labelledby="progress-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2
              id="progress-heading"
              className="text-2xl font-bold tracking-tight"
            >
              Ваш прогрес
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Короткий огляд поточних результатів.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
  <Link
    href="/speaking/history"
    className={buttonVariants({
      variant: "ghost",
      size: "sm",
    })}
  >
    <Mic aria-hidden="true" />
    Історія розмовної практики
  </Link>

  <Link
    href="/profile"
    className={buttonVariants({
      variant: "ghost",
      size: "sm",
    })}
  >
    Відкрити профіль
    <ArrowRight aria-hidden="true" />
  </Link>
</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label}>
                <CardContent>
                  <div
                    className={[
                      "flex size-11 items-center justify-center rounded-lg",
                      item.iconClassName,
                    ].join(" ")}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>

                  <p className="mt-5 text-2xl font-bold">{item.value}</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="language-mastery-heading">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="language-mastery-heading"
              className="text-2xl font-bold tracking-tight"
            >
              Робота над помилками
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              TalkHero запам’ятовує складні моменти й відстежує, як ви їх
              закріплюєте.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">
              Активні: {data.languageMastery.activeErrors}
            </Badge>

            <Badge variant="neutral">
              Закріплено: {data.languageMastery.masteredErrors}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription>Персональне повторення</CardDescription>

                <CardTitle className="mt-1">Що варто закріпити</CardTitle>
              </div>

              <div className="flex size-12 items-center justify-center rounded-lg bg-warning-soft text-amber-700">
                <Lightbulb className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {data.languageMastery.practiceItems.length > 0 ? (
              <div className="space-y-4">
                {data.languageMastery.practiceItems.map((item) => {
                  const masteryProgress = Math.min(
                    3,
                    Math.max(0, item.successfulUses),
                  );

                  return (
                    <div
                      key={item.errorKey}
                      className="rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{item.errorType}</Badge>

                            <span className="text-xs text-muted-foreground">
                              Повторень помилки: {item.occurrenceCount}
                            </span>
                          </div>

                          <p className="text-sm leading-6">
                            <span className="text-muted-foreground">Було:</span>{" "}
                            <span className="font-medium">
                              {item.originalText}
                            </span>
                          </p>

                          <p className="mt-1 text-sm leading-6">
                            <span className="text-muted-foreground">
                              Правильно:
                            </span>{" "}
                            <span className="font-semibold text-foreground">
                              {item.correctedText}
                            </span>
                          </p>
                        </div>

                        <div className="shrink-0 sm:w-40">
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">
                              Закріплення
                            </span>

                            <span className="font-semibold">
                              {masteryProgress}/3
                            </span>
                          </div>

                          <Progress
                            value={masteryProgress}
                            max={3}
                            label={`${masteryProgress} із 3 успішних використань`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-success/20 bg-success-soft p-5">
                <p className="font-semibold text-emerald-800">
                  Усе актуальне вже закріплено
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Нові рекомендації з’являться тут, коли TalkHero помітить
                  повторювану мовну помилку.
                </p>
              </div>
            )}
          </CardContent>

          {data.languageMastery.practiceItems.length > 0 && (
            <CardFooter>
              <Link
                href="/chat"
                className={buttonVariants({
                  variant: "outline",
                })}
              >
                Потренуватися з Еммою
                <ArrowRight aria-hidden="true" />
              </Link>
            </CardFooter>
          )}
        </Card>
      </section>

      <section>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription>Словниковий запас</CardDescription>

                <CardTitle className="mt-1">
                  {data.stats.learned} із {data.stats.vocabulary} слів вивчено
                </CardTitle>
              </div>

              <div className="flex size-12 items-center justify-center rounded-lg bg-success-soft text-emerald-700">
                <BookOpen className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Progress
              value={learnedPercentage}
              label={`${data.stats.dueToday} слів доступно для повторення`}
              showValue
              indicatorClassName="bg-success"
            />
          </CardContent>

          <CardFooter className="flex-wrap">
            <Link
              href="/review"
              className={buttonVariants({
                variant: "success",
              })}
            >
              Повторити слова
              <ArrowRight aria-hidden="true" />
            </Link>

            <Link
              href="/vocabulary"
              className={buttonVariants({
                variant: "outline",
              })}
            >
              Відкрити словник
            </Link>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
