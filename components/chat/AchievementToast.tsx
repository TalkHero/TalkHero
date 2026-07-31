"use client";

import type { UnlockedAchievement } from "@/hooks/useChatStream";

type Props = {
  achievement: UnlockedAchievement | null;
};

export function AchievementToast({
  achievement,
}: Props) {
  if (!achievement) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-50 w-80 rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
        Досягнення розблоковано
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-3xl">
          {achievement.icon}
        </span>

        <div>
          <div className="font-semibold">
            {achievement.title}
          </div>

          <div className="text-sm text-slate-500">
            +{achievement.xpReward} XP
          </div>
        </div>
      </div>
    </div>
  );
}
