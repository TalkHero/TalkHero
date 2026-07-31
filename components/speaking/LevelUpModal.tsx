"use client";

import { Sparkles, Trophy, X } from "lucide-react";

type LevelUpModalProps = {
  isOpen: boolean;
  previousLevel: number;
  newLevel: number;
  onClose: () => void;
};

export function LevelUpModal({
  isOpen,
  previousLevel,
  newLevel,
  onClose,
}: LevelUpModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-1 shadow-2xl">
        <div className="relative overflow-hidden rounded-[22px] bg-white px-6 py-8 text-center sm:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити вікно нового рівня"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200">
            <Trophy className="h-10 w-10" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            <Sparkles className="h-4 w-4" />
            Підвищення рівня
            <Sparkles className="h-4 w-4" />
          </div>

          <h2
            id="level-up-title"
            className="mt-3 text-3xl font-black text-slate-950"
          >
            Новий рівнь розблоковано!
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Чудова робота. Ваша практика спілкування вивела вас на новий рівень.
          </p>

          <div className="mt-7 flex items-center justify-center gap-4">
            <div className="rounded-2xl bg-slate-100 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Попередній
              </p>

              <p className="mt-1 text-3xl font-black text-slate-700">
                {previousLevel}
              </p>
            </div>

            <div className="text-2xl font-black text-violet-500">→</div>

            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-4 text-white shadow-lg shadow-violet-200">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-100">
                Новий рівень
              </p>

              <p className="mt-1 text-3xl font-black">{newLevel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Продовжити
          </button>
        </div>
      </div>
    </div>
  );
}
