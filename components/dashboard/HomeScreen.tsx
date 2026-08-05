"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Flame,
  Gamepad2,
  GraduationCap,
  Loader2,
  MessageCircle,
  Mic,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";

type DashboardData = {
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

type ModeCardProps = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: typeof MessageCircle;
  iconClassName: string;
  cardClassName: string;
};

const ADVENTURE_HREF =
  "/quests/english-basics/first-contact/coffee-shop";

function ModeCard({
  href,
  title,
  description,
  actionLabel,
  icon: Icon,
  iconClassName,
  cardClassName,
}: ModeCardProps) {
  return (
    <Link
      href={href}
      className={[
        "group relative overflow-hidden rounded-3xl border p-6 shadow-sm",
        "transition duration-200 hover:-translate-y-1 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        cardClassName,
      ].join(" ")}
    >
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          "transition duration-200 group-hover:scale-105",
          iconClassName,
        ].join(" ")}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>

      <h2 className="mt-6 text-xl font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
        {actionLabel}
        <ArrowRight
          className="h-4 w-4 transition group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[420px] items-center justify-center"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Завантаження головної сторінки…
      </div>
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
    <section
      role="alert"
      className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center"
    >
      <h1 className="text-xl font-bold text-red-800">
        Не вдалося завантажити головну сторінку
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Спробувати ще раз
      </button>
    </section>
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
        | DashboardData
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in responseData && responseData.error
            ? responseData.error
            : "Не вдалося отримати дані головної сторінки.",
        );
      }

      setData(responseData as DashboardData);
    } catch (error) {
      console.error("ПОМИЛКА ЗАВАНТАЖЕННЯ ГОЛОВНОЇ СТОРІНКИ:", error);

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

    return slug
      ? `/assessment/${encodeURIComponent(slug)}`
      : "/assessment";
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
  const currentLevelStartXp =
    Math.max(data.profile.level - 1, 0) * xpPerLevel;
  const xpInsideCurrentLevel = Math.min(
    Math.max(data.profile.xp - currentLevelStartXp, 0),
    xpPerLevel,
  );
  const xpProgressPercentage = Math.min(
    Math.round((xpInsideCurrentLevel / xpPerLevel) * 100),
    100,
  );

  const modes: ModeCardProps[] = [
    {
      href: "/chat",
      title: "Чат",
      description:
        "Спілкуйтеся з Еммою у вільному форматі та ставте запитання про англійську.",
      actionLabel: "Відкрити чат",
      icon: MessageCircle,
      iconClassName: "bg-indigo-100 text-indigo-700",
      cardClassName:
        "border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white",
    },
    {
      href: "/speaking",
      title: "Розмовна практика",
      description:
        "Говоріть уголос, тренуйте вимову та отримуйте зворотний зв’язок.",
      actionLabel: "Почати говорити",
      icon: Mic,
      iconClassName: "bg-violet-100 text-violet-700",
      cardClassName:
        "border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white",
    },
    {
      href: testHref,
      title: "Тести",
      description:
        "Перевіряйте знання, визначайте рівень і знаходьте теми для покращення.",
      actionLabel: "Пройти тест",
      icon: BookOpenCheck,
      iconClassName: "bg-amber-100 text-amber-700",
      cardClassName:
        "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white",
    },
    {
      href: ADVENTURE_HREF,
      title: "Гра",
      description:
        "Проживайте реальні ситуації англійською та проходьте сюжетні місії.",
      actionLabel: "Продовжити пригоду",
      icon: Gamepad2,
      iconClassName: "bg-emerald-100 text-emerald-700",
      cardClassName:
        "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white",
    },
  ];

  const statistics = [
    {
      label: "Рівень англійської",
      value: data.profile.englishLevel,
      icon: GraduationCap,
      className: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Загальний досвід",
      value: `${data.profile.xp} XP`,
      icon: Star,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Поточна серія",
      value: `${data.profile.streak} дн.`,
      icon: Flame,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: "Вивчено слів",
      value: data.stats.learned.toString(),
      icon: Trophy,
      className: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              З поверненням
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Вітаємо, {data.profile.fullName}
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Оберіть режим і зробіть наступний крок до впевненого
              спілкування англійською.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ADVENTURE_HREF}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                Продовжити гру
              </Link>

              <Link
                href="/speaking"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Mic className="h-4 w-4" aria-hidden="true" />
                Розмовна практика
              </Link>
            </div>
          </div>

          <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur sm:min-w-[280px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">
                  Рівень користувача
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {data.profile.level}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/30 text-indigo-200">
                <Target className="h-7 w-7" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                <span>
                  {xpInsideCurrentLevel} / {xpPerLevel} XP
                </span>
                <span>{xpProgressPercentage}%</span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                  style={{ width: `${xpProgressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="main-modes-heading">
        <div className="mb-5">
          <h2
            id="main-modes-heading"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Оберіть режим
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Чотири способи навчатися та практикувати англійську.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {modes.map((mode) => (
            <ModeCard key={mode.title} {...mode} />
          ))}
        </div>
      </section>

      <section aria-labelledby="progress-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2
              id="progress-heading"
              className="text-2xl font-bold tracking-tight text-slate-950"
            >
              Ваш прогрес
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Короткий огляд поточних результатів.
            </p>
          </div>

          <Link
            href="/profile"
            className="hidden items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 sm:inline-flex"
          >
            Відкрити профіль
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.className}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <p className="mt-5 text-2xl font-bold text-slate-950">
                  {item.value}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {item.label}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-violet-600">
                Оцінювання знань
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {data.assessment.latest
                  ? `Останній результат: ${Math.round(
                      data.assessment.latest.percentage,
                    )}%`
                  : "Визначте свій рівень англійської"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {data.assessment.latest
                  ? "Перегляньте результат або пройдіть рекомендований тест."
                  : "Пройдіть тест і отримайте персональні рекомендації."}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          <Link
            href={testHref}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            {data.assessment.hasAssessment
              ? "Пройти наступний тест"
              : "Почати тест"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Словниковий запас
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {data.stats.learned} із {data.stats.vocabulary} слів вивчено
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Сьогодні доступно для повторення:{" "}
                <strong className="text-slate-900">
                  {data.stats.dueToday}
                </strong>
                .
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/review"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Повторити слова
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href="/vocabulary"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Відкрити словник
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
