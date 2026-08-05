"use client";

import Link from "next/link";

type QuestHeaderProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
  backHref?: string;
};

function calculateProgress(
  currentStep: number,
  totalSteps: number,
): number {
  if (totalSteps <= 0) {
    return 0;
  }

  const normalizedCurrentStep = Math.max(
    0,
    Math.min(currentStep, totalSteps),
  );

  return Math.round(
    (normalizedCurrentStep / totalSteps) * 100,
  );
}

export function QuestHeader({
  title,
  currentStep,
  totalSteps,
  backHref = "/quests",
}: QuestHeaderProps) {
  const progress = calculateProgress(
    currentStep,
    totalSteps,
  );

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            aria-label="Повернутися до списку квестів"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            ← Назад
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Квест
            </p>

            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {title}
            </h1>
          </div>

          <div
            aria-label={`Прогрес квесту: ${progress}%`}
            className="flex min-h-11 min-w-20 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700"
          >
            {progress}%
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <span>
              Сцена {Math.min(currentStep, totalSteps)} із{" "}
              {totalSteps}
            </span>

            <span>{progress}% завершено</span>
          </div>

          <div
            role="progressbar"
            aria-label="Прогрес проходження квесту"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2.5 overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
