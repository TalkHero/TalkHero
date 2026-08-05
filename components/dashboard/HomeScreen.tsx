"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Flame,
  Gamepad2,
  GraduationCap,
  Loader2,
  MessageCircle,
  Mic,
  RotateCcw,
  Star,
  Target,
  Trophy,
} from "lucide-react";

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

const ADVENTURE_HREF = "/adventure/london-first-day/coffee-shop";

type LearningMode = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: typeof MessageCircle;
  iconClassName: string;
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
    void loadDashboard();
  }, [loadDashboard]);

  const testHref = useMemo(() => {
    const slug = data?.assessment.recommendedTestSlug;

    return slug ? `/assessment/${encodeURIComponent(slug)}` : "/placement-test";
  }, [data]);

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

  const xpPerLevel = 100;
  const currentLevelStartXp = Math.max(data.profile.level - 1, 0) * xpPerLevel;

  const xpInsideCurrentLevel = Math.min(
    Math.max(data.profile.xp - currentLevelStartXp, 0),
    xpPerLevel,
  );

  const learnedPercentage =
    data.stats.vocabulary > 0
      ? Math.round((data.stats.learned / data.stats.vocabulary) * 100)
      : 0;

  const modes: LearningMode[] = [
    {
      href: ADVENTURE_HREF,
      title: "Пригода",
      description:
        "Проходьте сюжетні місії та використовуйте англійську в реальних ситуаціях.",
      actionLabel: "Продовжити пригоду",
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
      label: "Рівень англійської",
      value: data.profile.englishLevel,
      icon: GraduationCap,
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

  const userName = data.profile.fullName?.trim().split(/\s+/)[0] || "друже";

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white via-white to-primary-soft">
          <CardHeader className="pb-2">
            <Badge className="mb-2">
              <Gamepad2 aria-hidden="true" />
              Наступний крок
            </Badge>

            <CardTitle className="text-3xl sm:text-4xl">
              Вітаємо, {userName}
            </CardTitle>

            <CardDescription className="max-w-2xl text-base">
              Продовжуйте навчання з місії Coffee Shop і практикуйте англійську
              в живій ситуації.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-xl border border-primary/10 bg-white/80 p-5 backdrop-blur">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    London First Day
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    Coffee Shop
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Замовте напій, поспілкуйтеся з баристою та отримайте
                    персональний відгук.
                  </p>
                </div>

                <Link href={ADVENTURE_HREF} className={buttonVariants()}>
                  Продовжити
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription>Рівень користувача</CardDescription>

                <CardTitle className="mt-1 text-3xl">
                  {data.profile.level}
                </CardTitle>
              </div>

              <div className="flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Target className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Progress
              value={xpInsideCurrentLevel}
              max={xpPerLevel}
              label={`${xpInsideCurrentLevel} із ${xpPerLevel} XP`}
              showValue
            />
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

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription>Оцінювання знань</CardDescription>

                <CardTitle className="mt-1">
                  {data.assessment.latest
                    ? `Останній результат: ${Math.round(
                        data.assessment.latest.percentage,
                      )}%`
                    : "Визначте свій рівень англійської"}
                </CardTitle>
              </div>

              <div className="flex size-12 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <BookOpenCheck className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {data.assessment.latest
                ? "Пройдіть рекомендований тест, щоб перевірити прогрес і знайти теми для покращення."
                : "Пройдіть коротке оцінювання й отримайте персональні рекомендації."}
            </p>
          </CardContent>

          <CardFooter>
            <Link href={testHref} className={buttonVariants()}>
              {data.assessment.hasAssessment
                ? "Пройти наступний тест"
                : "Почати тест"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>

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
