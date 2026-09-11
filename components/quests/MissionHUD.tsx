"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Star,
} from "lucide-react";

import type {
  PublicQuest,
  QuestProgress,
} from "@/lib/quests";
import { cn } from "@/lib/utils";

type MissionHUDProps = {
  quest: PublicQuest;
  progress: QuestProgress;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  exitHref?: string;
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
        (progress.completed / progress.total) * 100,
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
  exitHref = "/dashboard",
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
      className={cn(
        "overflow-hidden rounded-[26px]",
        "border border-slate-200/80",
        "bg-white",
        "shadow-[0_12px_36px_rgba(15,23,42,0.06)]",
        "dark:border-slate-800",
        "dark:bg-slate-950",
      )}
    >
      <div className="px-4 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-4">
        <Link
          href={exitHref}
          className={cn(
            "inline-flex items-center gap-1.5",
            "text-xs font-semibold text-slate-500",
            "transition-colors",
            "hover:text-indigo-600",
            "dark:text-slate-400 dark:hover:text-indigo-300",
          )}
        >
          <ArrowLeft
            className="size-3.5"
            aria-hidden="true"
          />

          Повернутись на головну
        </Link>

        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[26px] dark:text-white">
                {quest.title}
              </h1>

              {quest.cefrLevel ? (
                <span className="inline-flex h-7 items-center rounded-full bg-indigo-50 px-2.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {quest.cefrLevel}
                </span>
              ) : null}
            </div>

            {quest.estimatedMinutes ? (
              <span className="mt-2 inline-flex h-7 items-center rounded-full bg-slate-50 px-2.5 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                ≈ {quest.estimatedMinutes} хв
              </span>
            ) : null}
          </div>

          <div
            className={cn(
              "min-w-[72px] shrink-0",
              "rounded-[18px]",
              "bg-indigo-50 px-2.5 py-2",
              "text-center",
              "dark:bg-indigo-950/50",
            )}
          >
            <p className="text-[10px] font-medium text-indigo-400 dark:text-indigo-300">
              Прогрес
            </p>

            <p className="mt-0.5 text-lg font-black leading-none text-indigo-600 dark:text-indigo-300">
              {percentage}%
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-700 sm:text-sm dark:text-slate-200">
            Сцена {currentScene} з {progress.total}
          </p>

          <div className="flex shrink-0 items-center gap-3 text-xs sm:gap-4">
            <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
              <Star
                className="size-3.5 fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              {score}
            </span>

            <span className="font-bold text-indigo-500">
              XP {xpEarned}
            </span>

            <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
              <Coins
                className="size-3.5 text-amber-500"
                aria-hidden="true"
              />
              {coinsEarned}
            </span>
          </div>
        </div>

        <div
          className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label={`Прогрес місії: ${percentage}%`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-[width] duration-500"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
