"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SpeakingAnalyticsSession = {
  id: string;

  overall_score: number;
  grammar_score: number;
  fluency_score: number;
  vocabulary_score: number;
  naturalness_score: number;

  duration_seconds: number;
  xp_earned: number;

  created_at: string;
};

type SpeakingAnalyticsProps = {
  sessions: SpeakingAnalyticsSession[];
};

type ScoreMetric =
  | "overall"
  | "grammar"
  | "fluency"
  | "vocabulary"
  | "naturalness";

type AnalyticsPoint = {
  session: number;
  date: string;
  fullDate: string;

  overall: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  naturalness: number;

  xp: number;
  durationMinutes: number;
};

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: AnalyticsPoint;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  valueSuffix?: string;
};

const SCORE_METRICS: Array<{
  key: ScoreMetric;
  label: string;
  stroke: string;
}> = [
  {
    key: "overall",
    label: "Overall",
    stroke: "#7c3aed",
  },
  {
    key: "grammar",
    label: "Grammar",
    stroke: "#2563eb",
  },
  {
    key: "fluency",
    label: "Fluency",
    stroke: "#059669",
  },
  {
    key: "vocabulary",
    label: "Vocabulary",
    stroke: "#d97706",
  },
  {
    key: "naturalness",
    label: "Naturalness",
    stroke: "#db2777",
  },
];

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Невідома дата";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getMetricLabel(dataKey?: string) {
  const metric = SCORE_METRICS.find((item) => item.key === dataKey);

  if (metric) {
    return metric.label;
  }

  if (dataKey === "xp") {
    return "XP earned";
  }

  if (dataKey === "durationMinutes") {
    return "Practice time";
  }

  return dataKey ?? "Value";
}

function CustomTooltip({
  active,
  payload,
  valueSuffix = "",
}: CustomTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  return (
    <div className="min-w-44 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      {point ? (
        <div className="mb-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Session #{point.session}
          </p>

          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {point.fullDate}
          </p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={`${item.dataKey}-${item.name}`}
            className="flex items-center justify-between gap-5 text-sm"
          >
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              {getMetricLabel(item.dataKey)}
            </span>

            <span className="font-semibold text-slate-950 dark:text-white">
              {item.value}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl dark:bg-violet-500/10">
        📊
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
        Аналітика з'явиться тут
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Завершіть хоча б одну розмовну сесію, щоб відстежувати оцінки,
XP та час практики.
      </p>
    </div>
  );
}

export default function SpeakingAnalytics({
  sessions,
}: SpeakingAnalyticsProps) {
  const [visibleMetrics, setVisibleMetrics] = useState<
    Record<ScoreMetric, boolean>
  >({
    overall: true,
    grammar: true,
    fluency: true,
    vocabulary: true,
    naturalness: true,
  });

  const chartData = useMemo<AnalyticsPoint[]>(() => {
    return [...sessions]
      .sort(
        (first, second) =>
          new Date(first.created_at).getTime() -
          new Date(second.created_at).getTime(),
      )
      .map((session, index) => ({
        session: index + 1,
        date: formatShortDate(session.created_at),
        fullDate: formatFullDate(session.created_at),

        overall: clampScore(session.overall_score),
        grammar: clampScore(session.grammar_score),
        fluency: clampScore(session.fluency_score),
        vocabulary: clampScore(session.vocabulary_score),
        naturalness: clampScore(session.naturalness_score),

        xp: Math.max(0, session.xp_earned),
        durationMinutes: Number(
          (Math.max(0, session.duration_seconds) / 60).toFixed(1),
        ),
      }));
  }, [sessions]);

  const scoreTrend = useMemo(() => {
    if (chartData.length < 2) {
      return null;
    }

    return (
      chartData[chartData.length - 1].overall - chartData[0].overall
    );
  }, [chartData]);

  const toggleMetric = (metric: ScoreMetric) => {
    setVisibleMetrics((current) => {
      const visibleCount = Object.values(current).filter(Boolean).length;

      if (current[metric] && visibleCount === 1) {
        return current;
      }

      return {
        ...current,
        [metric]: !current[metric],
      };
    });
  };

  if (sessions.length === 0) {
    return (
      <section
        aria-labelledby="speaking-analytics-title"
        className="mb-8"
      >
        <div className="mb-4">
          <h2
            id="speaking-analytics-title"
            className="text-xl font-bold text-slate-950 dark:text-white"
          >
            Аналітика прогресу
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Спостерігайте, як ваші розмовні навички покращуються з часом.
          </p>
        </div>

        <AnalyticsEmptyState />
      </section>
    );
  }

  return (
    <section
      aria-labelledby="speaking-analytics-title"
      className="mb-8"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2
            id="speaking-analytics-title"
            className="text-xl font-bold text-slate-950 dark:text-white"
          >
           Аналітика прогресу
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Стежте, як змінюються ваші розмовні навички, XP та час практики.
          </p>
        </div>

        {scoreTrend !== null ? (
          <div
            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
              scoreTrend >= 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
            }`}
          >
            {scoreTrend >= 0 ? "↗" : "↘"}{" "}
            {scoreTrend >= 0 ? "+" : ""}
            {scoreTrend} overall since first session
          </div>
        ) : null}
      </div>

      <div className="grid gap-6">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">
                Прогрес у оцінці навичок
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Бали відображаються за шкалою від 0 до 100.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SCORE_METRICS.map((metric) => {
                const isVisible = visibleMetrics[metric.key];

                return (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => toggleMetric(metric.key)}
                    aria-pressed={isVisible}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isVisible
                        ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: metric.stroke,
                        opacity: isVisible ? 1 : 0.3,
                      }}
                    />

                    {metric.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[320px] w-full sm:h-[380px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -18,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                  tick={{
                    fill: "currentColor",
                    fontSize: 12,
                  }}
                  className="text-slate-500 dark:text-slate-400"
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "currentColor",
                    fontSize: 12,
                  }}
                  className="text-slate-500 dark:text-slate-400"
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#94a3b8",
                    strokeDasharray: "4 4",
                  }}
                />

                {SCORE_METRICS.map((metric) =>
                  visibleMetrics[metric.key] ? (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      name={metric.label}
                      stroke={metric.stroke}
                      strokeWidth={metric.key === "overall" ? 3 : 2}
                      dot={{
                        r: metric.key === "overall" ? 4 : 3,
                        fill: metric.stroke,
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                      }}
                      animationDuration={700}
                    />
                  ) : null,
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5">
              <h3 className="font-bold text-slate-950 dark:text-white">
                XP отримано
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Очки досвіду розмови, що заробляються в кожному сеансі.
              </p>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 8,
                    right: 8,
                    left: -22,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                  />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={18}
                    tick={{
                      fill: "currentColor",
                      fontSize: 11,
                    }}
                    className="text-slate-500 dark:text-slate-400"
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "currentColor",
                      fontSize: 11,
                    }}
                    className="text-slate-500 dark:text-slate-400"
                  />

                  <Tooltip
                    content={<CustomTooltip valueSuffix=" XP" />}
                    cursor={{
                      fill: "rgba(148, 163, 184, 0.1)",
                    }}
                  />

                  <Bar
                    dataKey="xp"
                    name="XP earned"
                    fill="#7c3aed"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5">
              <h3 className="font-bold text-slate-950 dark:text-white">
                Тривалість практики
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Хвилин, витрачених на кожну наступну сесію.
              </p>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 8,
                    right: 8,
                    left: -22,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                  />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={18}
                    tick={{
                      fill: "currentColor",
                      fontSize: 11,
                    }}
                    className="text-slate-500 dark:text-slate-400"
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "currentColor",
                      fontSize: 11,
                    }}
                    className="text-slate-500 dark:text-slate-400"
                  />

                  <Tooltip
                    content={<CustomTooltip valueSuffix=" min" />}
                    cursor={{
                      fill: "rgba(148, 163, 184, 0.1)",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={30}
                    formatter={() => "Practice minutes"}
                  />

                  <Bar
                    dataKey="durationMinutes"
                    name="Practice time"
                    fill="#059669"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
