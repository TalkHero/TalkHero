"use client";

import { Flame } from "lucide-react";

import type { DailyStreak } from "@/hooks/useChatStream";

type StreakBadgeProps = {
  streak: DailyStreak | null;
};

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (!streak || streak.currentStreak <= 0) {
    return null;
  }

  const dayLabel = streak.currentStreak === 1 ? "day" : "days";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700 shadow-sm"
      title={`Longest streak: ${streak.longestStreak} days`}
    >
      <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />

      <span>
        {streak.currentStreak} {dayLabel}
      </span>
    </div>
  );
}
