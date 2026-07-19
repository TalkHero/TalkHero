"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Flame,
  GraduationCap,
  Loader2,
  MessageCircle,
  Mic,
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
  };
};

const QUICK_ACTIONS = [
  {
    href: "/chat",
    title: "Chat with Emma",
    description:
      "Practice real English conversations with your AI tutor.",
    icon: MessageCircle,
    iconClassName:
      "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
  },
  {
    href: "/speaking",
    title: "Speaking practice",
    description:
      "Speak out loud and receive instant AI feedback.",
    icon: Mic,
    iconClassName:
      "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
  },
  {
    href: "/review",
    title: "Daily review",
    description:
      "Review vocabulary cards that are ready today.",
    icon: Brain,
    iconClassName:
      "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
  },
  {
    href: "/vocabulary",
    title: "Vocabulary",
    description:
      "Manage your saved English words and phrases.",
    icon: BookOpen,
    iconClassName:
      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  },
];

export function DashboardOverview() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/dashboard/stats",
        {
          cache: "no-store",
        },
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            "Failed to load dashboard.",
        );
      }

      setData(responseData);
    } catch (error) {
      console.error("LOAD DASHBOARD ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your progress...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">
          Could not load dashboard
        </p>

        <p className="mt-2 text-sm text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={loadDashboard}
          className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const learnedPercentage =
    data.stats.vocabulary > 0
      ? Math.round(
          (data.stats.learned /
            data.stats.vocabulary) *
            100,
        )
      : 0;

      const xpPerLevel = 100;

const currentLevelStartXp =
  Math.max(data.profile.level - 1, 0) * xpPerLevel;

const nextLevelXp =
  data.profile.level * xpPerLevel;

const xpInsideCurrentLevel = Math.min(
  Math.max(
    data.profile.xp - currentLevelStartXp,
    0,
  ),
  xpPerLevel,
);

const xpProgressPercentage = Math.min(
  Math.round(
    (xpInsideCurrentLevel / xpPerLevel) * 100,
  ),
  100,
);

const xpRemaining = Math.max(
  nextLevelXp - data.profile.xp,
  0,
);

const dailyTasks = [
  {
    label: "Start a conversation with Emma",
    href: "/chat",
    completed:
      data.stats.conversations > 0,
  },
  {
    label: "Review vocabulary",
    href: "/review",
    completed:
      data.stats.dueToday === 0 &&
      data.stats.vocabulary > 0,
  },
  {
    label: "Practice speaking",
    href: "/speaking",
    completed: false,
  },
  {
    label: "Learn new vocabulary",
    href: "/vocabulary",
    completed:
      data.stats.vocabulary > 0,
  },
];

const completedDailyTasks = dailyTasks.filter(
  (task) => task.completed,
).length;

const dailyGoalPercentage = Math.round(
  (completedDailyTasks / dailyTasks.length) * 100,
);

  const statistics = [
    {
      label: "Current streak",
      value: data.profile.streak,
      suffix: "days",
      icon: Flame,
      iconClassName:
        "bg-orange-50 text-orange-600",
    },
    {
      label: "Vocabulary",
      value: data.stats.vocabulary,
      suffix: "words",
      icon: BookOpen,
      iconClassName:
        "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Learned",
      value: data.stats.learned,
      suffix: "words",
      icon: Trophy,
      iconClassName:
        "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Conversations",
      value: data.stats.conversations,
      suffix: "chats",
      icon: MessageCircle,
      iconClassName:
        "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Welcome back
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Hello, {data.profile.fullName}
            </h1>

            <p className="mt-3 max-w-xl leading-7 text-slate-300">
              Continue practicing English and keep building
              your daily learning habit.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Practice with Emma
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/review"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Review {data.stats.dueToday} words
              </Link>
            </div>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <GraduationCap className="h-5 w-5 text-indigo-300" />

              <p className="mt-4 text-2xl font-bold">
                {data.profile.englishLevel}
              </p>

              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                English level
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <Star className="h-5 w-5 text-amber-300" />

              <p className="mt-4 text-2xl font-bold">
                {data.profile.xp}
              </p>

              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                Total XP
              </p>
            </div>
          </div>
        </div>
      </section>
<section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
  <article className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm sm:p-7">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
          <Star className="h-4 w-4" />
          Level progress
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Level {data.profile.level}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Earn XP by chatting, speaking, and reviewing
          vocabulary.
        </p>
      </div>

      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-200">
        {data.profile.level}
      </div>
    </div>

    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-slate-700">
          {xpInsideCurrentLevel} / {xpPerLevel} XP
        </span>

        <span className="font-medium text-indigo-600">
          {xpProgressPercentage}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{
            width: `${xpProgressPercentage}%`,
          }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Total:{" "}
          <strong className="text-slate-800">
            {data.profile.xp} XP
          </strong>
        </span>

        <span>
          {xpRemaining > 0
            ? `${xpRemaining} XP until level ${
                data.profile.level + 1
              }`
            : "Next level unlocked"}
        </span>
      </div>
    </div>
  </article>

  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
          <Target className="h-4 w-4" />
          Daily goal
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Today&apos;s plan
        </h2>
      </div>

      <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
        {dailyGoalPercentage}%
      </div>
    </div>

    <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-700"
        style={{
          width: `${dailyGoalPercentage}%`,
        }}
      />
    </div>

    <div className="mt-6 space-y-3">
      {dailyTasks.map((task) => (
        <Link
          key={task.label}
          href={task.href}
          className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
              task.completed
                ? "bg-emerald-100 text-emerald-600"
                : "border border-slate-200 bg-white text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-500"
            }`}
          >
            {task.completed ? (
              <Check className="h-4 w-4" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-current" />
            )}
          </div>

          <span
            className={`text-sm font-medium ${
              task.completed
                ? "text-slate-400 line-through"
                : "text-slate-700 group-hover:text-indigo-600"
            }`}
          >
            {task.label}
          </span>
        </Link>
      ))}
    </div>
  </article>
</section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClassName}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-5 text-3xl font-bold text-slate-950">
                {item.value}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {item.label}
              </p>

              <p className="mt-3 text-xs text-slate-400">
                {item.value} {item.suffix}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Vocabulary progress
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track how many saved words you have learned.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              {learnedPercentage}%
            </div>
          </div>

          <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${learnedPercentage}%`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {data.stats.learned} learned
            </span>

            <span className="font-medium text-slate-700">
              {data.stats.vocabulary} total
            </span>
          </div>

          <Link
            href="/vocabulary"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            View vocabulary
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Brain className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            Daily review
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            You currently have{" "}
            <strong className="text-slate-800">
              {data.stats.dueToday}
            </strong>{" "}
            vocabulary cards ready for review.
          </p>

          <Link
            href="/review"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start review
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-950">
            Continue learning
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose what you would like to practice next.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
               <div
  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200 ${action.iconClassName}`}
>
  <Icon className="h-6 w-6" />
</div>

                <h3 className="mt-5 font-semibold text-slate-950">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {action.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                  Open
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
