"use client";

import { Star } from "lucide-react";

type XpProgressProps = {
  xp: number;
  level: number;
  xpInsideCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercent: number;
};

export function XpProgress({
  xp,
  level,
  xpInsideCurrentLevel,
  xpRequiredForNextLevel,
  progressPercent,
}: XpProgressProps) {
  const safeProgressPercent = Math.min(
    100,
    Math.max(0, progressPercent),
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Прогрес навчання
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Рівень {level}
          </h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Star className="h-6 w-6 fill-current" />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            {xpInsideCurrentLevel} / {xpRequiredForNextLevel} XP
          </span>

          <span className="font-semibold text-indigo-600">
            {safeProgressPercent}%
          </span>
        </div>

        <div
          className="h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Прогрес поточного рівня"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgressPercent}
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${safeProgressPercent}%`,
            }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Усього досвіду: {xp} XP
        </p>
      </div>
    </section>
  );
}
