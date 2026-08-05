"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coins,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";

type CompletionSceneProps = {
  score: number;
  xpEarned: number;
  coinsEarned: number;
  onRestart: () => void;
  adventureHref?: string;
};

export function CompletionScene({
  score,
  xpEarned,
  coinsEarned,
  onRestart,
  adventureHref = "/adventure",
}: CompletionSceneProps) {
  return (
    <section
      aria-labelledby="mission-completion-title"
      className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl"
    >
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-10 text-center text-white sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 shadow-lg backdrop-blur"
        >
          <Trophy className="h-10 w-10" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
          Місію виконано
        </p>

        <h1
          id="mission-completion-title"
          className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Чудова робота!
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg">
          Результати проходження та отримані нагороди успішно збережено.
        </p>
      </div>

      <div className="p-6 sm:p-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Target className="h-5 w-5" aria-hidden="true" />
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-950">
              {score}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-600">
              Бали
            </p>
          </article>

          <article className="rounded-3xl border border-amber-100 bg-amber-50 p-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Star className="h-5 w-5" aria-hidden="true" />
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-950">
              +{xpEarned}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-600">
              Досвід
            </p>
          </article>

          <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Coins className="h-5 w-5" aria-hidden="true" />
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-950">
              +{coinsEarned}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-600">
              Монети
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-3xl border border-violet-100 bg-violet-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                Продовжуйте пригоду
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Повторіть місію, щоб покращити результат, або поверніться до карти пригод і оберіть наступне завдання.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Пройти ще раз
          </button>

          <Link
            href={adventureHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
          >
            Повернутися до пригоди
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
