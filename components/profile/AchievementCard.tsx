"use client";

import { Lock } from "lucide-react";

export type ProfileAchievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  metric: string;
  targetValue: number;
  xpReward: number;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

type AchievementCardProps = {
  achievement: ProfileAchievement;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <article
      className={`relative rounded-3xl border p-5 transition ${
        achievement.unlocked
          ? "border-amber-200 bg-white shadow-sm"
          : "border-slate-200 bg-slate-50 opacity-70"
      }`}
    >
      {!achievement.unlocked && (
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">
          <Lock className="h-4 w-4" />
        </div>
      )}

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
          achievement.unlocked ? "bg-amber-100" : "bg-slate-200 grayscale"
        }`}
      >
        {achievement.icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">{achievement.title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {achievement.description}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-indigo-600">
          +{achievement.xpReward} XP
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            achievement.unlocked
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {achievement.unlocked ? "Відкрито" : "Заблоковано"}
        </span>
      </div>
    </article>
  );
}
