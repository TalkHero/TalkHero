"use client";

import {
  AchievementCard,
  type ProfileAchievement,
} from "@/components/profile/AchievementCard";

type AchievementsGridProps = {
  achievements: ProfileAchievement[];
  unlockedCount: number;
  total: number;
};

export function AchievementsGrid({
  achievements,
  unlockedCount,
  total,
}: AchievementsGridProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
  Ваш прогрес
</p>

<h2 className="mt-1 text-xl font-bold text-slate-900">
  Досягнення
</h2>
        </div>

        <div className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
          {unlockedCount} / {total}
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Досягнення поки що відсутні.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </section>
  );
}
