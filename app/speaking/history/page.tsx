"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SpeakingAnalytics from "@/components/speaking/SpeakingAnalytics";

type SpeakingSession = {
  id: string;
  conversation_id: string | null;

  overall_score: number;
  grammar_score: number;
  fluency_score: number;
  vocabulary_score: number;
  naturalness_score: number;

  answers_count: number;
  duration_seconds: number;
  xp_earned: number;

  started_at: string;
  completed_at: string;
  created_at: string;
};

type SpeakingStats = {
  totalSessions: number;
  totalXP: number;
  averageOverall: number;
  bestScore: number;
  totalPracticeMinutes: number;
  totalAnswers: number;
};

type SpeakingHistoryResponse = {
  sessions: SpeakingSession[];
  stats: SpeakingStats;
};

const EMPTY_STATS: SpeakingStats = {
  totalSessions: 0,
  totalXP: 0,
  averageOverall: 0,
  bestScore: 0,
  totalPracticeMinutes: 0,
  totalAnswers: 0,
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Невідома дата";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 80) {
    return "Great";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 60) {
    return "Keep going";
  }

  return "Needs practice";
}

function getScoreStyles(score: number) {
  if (score >= 90) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      background: "bg-emerald-500",
      badge:
        "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    };
  }

  if (score >= 80) {
    return {
      text: "text-blue-600 dark:text-blue-400",
      background: "bg-blue-500",
      badge:
        "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
    };
  }

  if (score >= 70) {
    return {
      text: "text-violet-600 dark:text-violet-400",
      background: "bg-violet-500",
      badge:
        "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
    };
  }

  if (score >= 60) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      background: "bg-amber-500",
      badge:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
    };
  }

  return {
    text: "text-rose-600 dark:text-rose-400",
    background: "bg-rose-500",
    badge:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
  };
}

function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const safeScore = Math.min(100, Math.max(0, score));
  const styles = getScoreStyles(safeScore);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>

        <span className="font-semibold text-slate-900 dark:text-white">
          {safeScore}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.background}`}
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: string;
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>

        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl dark:bg-violet-500/10"
        >
          {icon}
        </span>
      </div>

      <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>

      {helper ? (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SessionCard({
  session,
  index,
}: {
  session: SpeakingSession;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  const scoreStyles = getScoreStyles(session.overall_score);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
        aria-expanded={isExpanded}
      >
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${scoreStyles.badge} ring-1`}
        >
          <span
            className={`text-2xl font-bold leading-none ${scoreStyles.text}`}
          >
            {session.overall_score}
          </span>

          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
            Загальна оцінка
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-semibold text-slate-950 dark:text-white">
              {formatDate(session.created_at)}
            </h2>

            <span className="text-sm text-slate-400">
              {formatTime(session.created_at)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span>⏱ {formatDuration(session.duration_seconds)}</span>

            <span>
              💬 {session.answers_count}{" "}
              {session.answers_count === 1 ? "answer" : "answers"}
            </span>

            <span className="font-semibold text-violet-600 dark:text-violet-400">
              +{session.xp_earned} XP
            </span>
          </div>

          <div className="mt-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${scoreStyles.badge}`}
            >
              {getScoreLabel(session.overall_score)}
            </span>
          </div>
        </div>

        <span
          aria-hidden="true"
          className={`shrink-0 text-xl text-slate-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      {isExpanded ? (
        <div className="border-t border-slate-100 px-5 pb-6 pt-5 dark:border-slate-800 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <ScoreBar
              label="Grammar"
              score={session.grammar_score}
            />

            <ScoreBar
              label="Fluency"
              score={session.fluency_score}
            />

            <ScoreBar
              label="Vocabulary"
              score={session.vocabulary_score}
            />

            <ScoreBar
              label="Naturalness"
              score={session.naturalness_score}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />

            <div className="flex-1">
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />

              <div className="mt-3 h-4 w-64 max-w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpeakingHistoryPage() {
  const [sessions, setSessions] = useState<SpeakingSession[]>([]);
  const [stats, setStats] = useState<SpeakingStats>(EMPTY_STATS);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/speaking/history", {
        method: "GET",
        credentials: "include",
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
            : "Не вдалося завантажити історію розмовної практики.";

        throw new Error(message);
      }

      const historyData = responseData as SpeakingHistoryResponse;

      setSessions(historyData.sessions ?? []);
      setStats(historyData.stats ?? EMPTY_STATS);
    } catch (error) {
      console.error("LOAD SPEAKING HISTORY ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити історію розмовної практики.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const averageDuration = useMemo(() => {
    if (stats.totalSessions === 0) {
      return 0;
    }

    const totalSeconds = sessions.reduce(
      (sum, session) => sum + session.duration_seconds,
      0,
    );

    return Math.round(totalSeconds / stats.totalSessions);
  }, [sessions, stats.totalSessions]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <span aria-hidden="true">🎤</span>
                Speaking practice
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Історія розмовної практики
              </h1>

              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
                Стежте за розмовними сесіями, оцінками, часом практики та отриманими XP.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadHistory()}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isLoading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/30"
          >
            <h2 className="font-semibold text-rose-800 dark:text-rose-300">
              Could not load history
            </h2>

            <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadHistory()}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Спробуйте ще
            </button>
          </div>
        ) : null}

        <section
          aria-label="Speaking statistics"
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <StatCard
            icon="🎤"
            label="Усього сесій"
            value={stats.totalSessions}
            helper="Завершені розмовні практики"
          />

          <StatCard
            icon="📈"
            label="Середній бал"
            value={`${stats.averageOverall}/100`}
            helper="Середня загальна продуктивність"
          />

          <StatCard
            icon="🏆"
            label="Кращий результат"
            value={`${stats.bestScore}/100`}
            helper="Найвищий загальний бал"
          />

          <StatCard
            icon="⚡"
            label="розмовний досвід XP"
            value={`+${stats.totalXP}`}
            helper="XP отримано за час розмовної практики"
          />

          <StatCard
            icon="⏱"
            label="Час практики"
            value={`${stats.totalPracticeMinutes} min`}
            helper={
              stats.totalSessions > 0
                ? `У середньому ${formatDuration(averageDuration)} за сесію`
                : "Розпочніть практику, щоб відстежувати час"
            }
          />

          <StatCard
            icon="💬"
            label="Всього відповідей"
            value={stats.totalAnswers}
            helper="Відповіді, оцінені вашим викладачем"
          />
        </section>

        {!isLoading && !errorMessage ? (
          <SpeakingAnalytics sessions={sessions} />
        ) : null}



        {!isLoading && !errorMessage ? (
          <SpeakingAnalytics sessions={sessions} />
        ) : null}

        <section aria-labelledby="session-history-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="session-history-title"
                className="text-xl font-bold text-slate-950 dark:text-white"
              >
                Recent sessions
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Newest sessions appear first.
              </p>
            </div>

            {!isLoading && sessions.length > 0 ? (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {sessions.length}
              </span>
            ) : null}
          </div>

          {isLoading ? <LoadingState /> : null}

          {!isLoading && !errorMessage && sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <div
                aria-hidden="true"
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl dark:bg-violet-500/10"
              >
                🎙️
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                No speaking sessions yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-slate-500 dark:text-slate-400">
                Complete your first speaking session and your scores, XP and
                progress will appear here.
              </p>

              <a
                href="/speaking"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                Start speaking
              </a>
            </div>
          ) : null}

          {!isLoading && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={index}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
