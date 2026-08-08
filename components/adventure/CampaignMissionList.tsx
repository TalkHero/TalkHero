"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Coffee,
  Hotel,
  Landmark,
  Loader2,
  Mail,
  Pill,
  ShoppingCart,
  Utensils,
  CarTaxiFront,
  LockKeyhole,
  MapPin,
  Plane,
  Play,
  RotateCcw,
  Star,
  TrainFront,
} from "lucide-react";

import type { AdventureMission } from "@/lib/adventure/content";

import type {
  AdventureCampaignProgress,
  MissionProgressStatus,
} from "@/lib/adventure/progress";

type CampaignMissionListProps = {
  campaign: {
    slug: string;
    progressCampaignSlug: string;
    missions: AdventureMission[];
  };
};

const ICONS = [
  Coffee,
  TrainFront,
  Hotel,
  Plane,
  Utensils,
  ShoppingCart,
  Landmark,
  Pill,
  CarTaxiFront,
  Mail,
];

function StarRating({ stars }: { stars: number }) {
  return (
    <div
      aria-label={`Зароблено зірок: ${stars} із 3`}
      className="flex items-center gap-1"
    >
      {[1, 2, 3].map((value) => (
        <Star
          key={value}
          className={[
            "h-4 w-4",
            value <= stars ? "fill-amber-400 text-amber-400" : "text-slate-300",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function getStatusLabel(status: MissionProgressStatus): string {
  switch (status) {
    case "completed":
      return "Завершено";
    case "in_progress":
      return "Розпочато";
    case "available":
      return "Наступна місія";
    default:
      return "Заблоковано";
  }
}

function getNodeClasses(status: MissionProgressStatus): string {
  switch (status) {
    case "completed":
      return "border-emerald-500 bg-emerald-500 text-white shadow-emerald-200";
    case "in_progress":
      return "border-amber-500 bg-amber-500 text-white shadow-amber-200";
    case "available":
      return "border-violet-600 bg-violet-600 text-white shadow-violet-200";
    default:
      return "border-slate-300 bg-slate-100 text-slate-400 shadow-slate-100";
  }
}

function getCardClasses(status: MissionProgressStatus): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50/60";
    case "in_progress":
      return "border-amber-200 bg-amber-50/60";
    case "available":
      return "border-violet-200 bg-white ring-2 ring-violet-100";
    default:
      return "border-slate-200 bg-slate-50 opacity-75";
  }
}

export function CampaignMissionList({ campaign }: CampaignMissionListProps) {
  const [progress, setProgress] = useState<AdventureCampaignProgress | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadProgress() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/adventure/progress?campaign=${encodeURIComponent(
          campaign.progressCampaignSlug,
        )}`,
        {
          cache: "no-store",
        },
      );

      const result = (await response.json()) as AdventureCampaignProgress & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Не вдалося завантажити прогрес.");
      }

      setProgress(result);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Сталася невідома помилка.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProgress();
  }, [campaign.progressCampaignSlug]);

  const progressBySlug = useMemo(
    () =>
      new Map(
        (progress?.missions ?? []).map((mission) => [
          mission.questSlug,
          mission,
        ]),
      ),
    [progress],
  );

  const completedPercentage =
    progress && progress.totalMissions > 0
      ? Math.round((progress.completedMissions / progress.totalMissions) * 100)
      : 0;

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-52 items-center justify-center rounded-3xl border border-slate-200 bg-white"
      >
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Завантаження карти пригоди…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-red-200 bg-red-50 p-6"
      >
        <h2 className="font-bold text-red-800">
          Не вдалося відкрити карту пригоди
        </h2>

        <p className="mt-2 text-sm text-red-700">{error}</p>

        <button
          type="button"
          onClick={() => {
            void loadProgress();
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
              <MapPin className="h-4 w-4" />
              Маршрут пригоди
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {progress?.completedMissions ?? 0} із{" "}
              {progress?.totalMissions ?? 0} місій завершено
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">Зароблено зірок</p>

            <p className="mt-1 text-xl font-bold text-amber-600">
              {progress?.earnedStars ?? 0} / {progress?.totalStars ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-indigo-500 transition-all duration-500"
            style={{
              width: `${completedPercentage}%`,
            }}
          />
        </div>

        <p className="mt-2 text-right text-sm font-semibold text-slate-600">
          {completedPercentage}% кампанії
        </p>
      </section>

      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute bottom-12 left-7 top-12 w-1 -translate-x-1/2 rounded-full bg-slate-200 sm:left-9"
        />

        <div className="space-y-6">
          {campaign.missions.map((mission: AdventureMission, index) => {
            const Icon = ICONS[index] ?? Coffee;

            const databaseProgress = progressBySlug.get(mission.slug);

            const status: MissionProgressStatus =
              databaseProgress?.status ??
              (index === 0 ? "available" : "locked");

            const available = status !== "locked";

            const card = (
              <article
                className={[
                  "relative ml-16 rounded-3xl border p-5 shadow-sm transition sm:ml-20 sm:p-6",
                  getCardClasses(status),
                  available ? "hover:-translate-y-0.5 hover:shadow-md" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "absolute -left-16 top-7 z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 shadow-lg sm:-left-20 sm:h-16 sm:w-16",
                    getNodeClasses(status),
                  ].join(" ")}
                >
                  {status === "completed" ? (
                    <Check className="h-7 w-7" />
                  ) : status === "available" || status === "in_progress" ? (
                    <Icon className="h-7 w-7" />
                  ) : (
                    <LockKeyhole className="h-6 w-6" />
                  )}
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                        Рівень {mission.cefrLevel}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Clock3 className="h-3.5 w-3.5" />
                        {mission.durationMinutes} хв
                      </span>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : status === "available"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-slate-200 text-slate-500",
                        ].join(" ")}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">
                      {mission.title}
                    </h3>

                    <p className="mt-1 font-medium text-slate-700">
                      {mission.subtitle}
                    </p>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {mission.description}
                    </p>

                    {databaseProgress &&
                      databaseProgress.timesCompleted > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                          <StarRating stars={databaseProgress.stars} />

                          <span className="text-slate-600">
                            Найкращий результат:{" "}
                            <strong className="text-slate-900">
                              {Math.round(databaseProgress.bestScorePercentage)}
                              %
                            </strong>
                          </span>

                          <span className="text-slate-500">
                            Завершень: {databaseProgress.timesCompleted}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="shrink-0">
                    {status === "locked" ? (
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <LockKeyhole className="h-4 w-4" />
                        Завершіть попередню місію
                      </div>
                    ) : (
                      <div
                        className={[
                          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white",
                          status === "completed"
                            ? "bg-emerald-600"
                            : status === "in_progress"
                              ? "bg-amber-600"
                              : "bg-violet-600",
                        ].join(" ")}
                      >
                        {status === "completed" ? (
                          <>
                            Пройти ще раз
                            <ArrowRight className="h-4 w-4" />
                          </>
                        ) : status === "in_progress" ? (
                          <>
                            Продовжити
                            <Play className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Почати місію
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );

            return available ? (
              <Link
                key={mission.slug}
                href={`/adventure/${campaign.slug}/${mission.slug}`}
                className="block"
              >
                {card}
              </Link>
            ) : (
              <div key={mission.slug}>{card}</div>
            );
          })}
        </div>
      </div>

      <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6">
        <p className="text-sm font-semibold text-violet-700">Порада від Емми</p>

        <p className="mt-2 leading-7 text-slate-700">
          Проходьте місії послідовно. Кожна завершена ситуація відкриває
          наступний крок вашої подорожі Лондоном.
        </p>
      </section>
    </div>
  );
}
