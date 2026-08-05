"use client";

import {
  Coins,
  Star,
  Target,
} from "lucide-react";

import type {
  PublicQuest,
  QuestProgress,
} from "@/lib/quests";

type MissionHUDProps = {
  quest: PublicQuest;
  progress: QuestProgress;
  score: number;
  xpEarned: number;
  coinsEarned: number;
};

function calculatePercentage(
  progress: QuestProgress,
): number {
  if (progress.total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (progress.completed /
          progress.total) *
          100,
      ),
    ),
  );
}

export function MissionHUD({
  quest,
  progress,
  score,
  xpEarned,
  coinsEarned,
}: MissionHUDProps) {
  const percentage =
    calculatePercentage(progress);

  const currentScene = Math.min(
    Math.max(progress.current, 1),
    Math.max(progress.total, 1),
  );

  return (
    <section
      aria-label="Стан поточної місії"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {quest.cefrLevel && (
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                  Рівень {quest.cefrLevel}
                </span>
              )}

              {quest.estimatedMinutes && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {quest.estimatedMinutes} хв
                </span>
              )}
            </div>

            <h1 className="mt-3 truncate text-2xl font-bold text-slate-950 sm:text-3xl">
              {quest.title}
            </h1>

            {quest.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {quest.description}
              </p>
            )}
          </div>

          <div className="shrink-0 rounded-2xl bg-indigo-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Прогрес
            </p>

            <p className="mt-1 text-2xl font-bold text-indigo-700">
              {percentage}%
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-slate-700">
              Сцена {currentScene} із{" "}
              {progress.total}
            </span>

            <span className="text-slate-500">
              Завершено: {progress.completed}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Прогрес місії"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="h-3 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-center gap-2 border-r border-slate-100 px-3 py-4">
          <Target
            className="h-4 w-4 text-indigo-600"
            aria-hidden="true"
          />

          <div>
            <p className="text-xs text-slate-500">
              Бали
            </p>
            <p className="font-bold text-slate-950">
              {score}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 border-r border-slate-100 px-3 py-4">
          <Star
            className="h-4 w-4 text-amber-500"
            aria-hidden="true"
          />

          <div>
            <p className="text-xs text-slate-500">
              Досвід
            </p>
            <p className="font-bold text-slate-950">
              {xpEarned} XP
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 px-3 py-4">
          <Coins
            className="h-4 w-4 text-emerald-600"
            aria-hidden="true"
          />

          <div>
            <p className="text-xs text-slate-500">
              Монети
            </p>
            <p className="font-bold text-slate-950">
              {coinsEarned}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
