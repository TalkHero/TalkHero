"use client";

import { Award, Sparkles, X } from "lucide-react";

export type UnlockedAchievement = {
  achievement_id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
};

type AchievementUnlockedModalProps = {
  achievement: UnlockedAchievement | null;
  onClose: () => void;
};

export function AchievementUnlockedModal({
  achievement,
  onClose,
}: AchievementUnlockedModalProps) {
  if (!achievement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close achievement modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="absolute left-5 top-5 text-amber-300">
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-5xl shadow-lg shadow-amber-200">
          {achievement.icon || <Award className="h-12 w-12 text-white" />}
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
          Досягнення розблоковано
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {achievement.title}Досягнення розблоковано
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {achievement.description}
        </p>

        {achievement.xp_reward > 0 && (
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 font-bold text-amber-700">
            <Sparkles className="h-4 w-4" />
            +{achievement.xp_reward} XP
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
