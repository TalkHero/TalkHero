"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Flame,
  GraduationCap,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
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
    title: "Practice with Emma",
    description:
      "Start a personalized English conversation.",
    icon: MessageCircle,
  },
  {
    href: "/review",
    title: "Review vocabulary",
    description:
      "Practice words that are due today.",
    icon: Brain,
  },
  {
    href: "/vocabulary",
    title: "Open vocabulary",
    description:
      "Manage your saved words and phrases.",
    icon: BookOpen,
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

        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <Icon className="h-5 w-5" />
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
