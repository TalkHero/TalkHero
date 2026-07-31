"use client";

import { Flame, Trophy, UserRound } from "lucide-react";

type ProfileHeaderProps = {
  fullName: string | null;
  email: string | null;
  englishLevel: string;
  currentStreak: number;
  longestStreak: number;
};

function getUkrainianDayWord(value: number) {
  const normalizedValue = Math.abs(value);
  const lastTwoDigits = normalizedValue % 100;
  const lastDigit = normalizedValue % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "днів";
  }

  if (lastDigit === 1) {
    return "день";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "дні";
  }

  return "днів";
}

export function ProfileHeader({
  fullName,
  email,
  englishLevel,
  currentStreak,
  longestStreak,
}: ProfileHeaderProps) {
  const displayName =
    fullName?.trim() || "Користувач TalkHero";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <UserRound className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {displayName}
            </h1>

            {email ? (
              <p className="mt-1 text-sm text-slate-500">
                {email}
              </p>
            ) : null}

            <div className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Рівень англійської: {englishLevel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-orange-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
              <Flame className="h-4 w-4" />
              Поточна серія
            </div>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {currentStreak}
            </p>

            <p className="mt-0.5 text-xs text-orange-600">
              {getUkrainianDayWord(currentStreak)} поспіль
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Trophy className="h-4 w-4" />
              Найкраща серія
            </div>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {longestStreak}
            </p>

            <p className="mt-0.5 text-xs text-amber-600">
              {getUkrainianDayWord(longestStreak)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
