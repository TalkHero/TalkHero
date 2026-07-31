"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bot,
  CheckCircle2,
  Flame,
  Mic,
  Sparkles,
  Volume2,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-32 top-28 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Ваш персональний ШІ-викладач англійської
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            Заговоріть англійською
            <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              з персональним ШІ-викладачем
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            Практикуйте живі діалоги, покращуйте вимову, поповнюйте
            словниковий запас і відстежуйте свій прогрес разом із
            ШІ-викладачем, який доступний у будь-який час.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Почати безкоштовно
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex h-13 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Увійти
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Без банківської картки
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Почніть менш ніж за хвилину
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-6 top-16 z-20 hidden rounded-2xl border border-orange-200 bg-white p-3 shadow-xl sm:block">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Flame className="h-5 w-5 fill-orange-500" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Серія занять
                </p>

                <p className="text-sm font-bold text-slate-900">
                  14 днів
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -right-5 bottom-20 z-20 hidden rounded-2xl border border-amber-200 bg-white p-3 shadow-xl sm:block">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Award className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Нове досягнення
                </p>

                <p className="text-sm font-bold text-slate-900">
                  Герой розмов
                </p>
              </div>
            </div>
          </div>

          <div className="relative rounded-[32px] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
            <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Емма
                    </p>

                    <p className="text-xs text-emerald-600">
                      Ваш ШІ-викладач англійської
                    </p>
                  </div>
                </div>

                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Онлайн
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div className="max-w-[82%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                    Hi! Let&apos;s practice English. Tell me about your dream
                    vacation.
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                    I would love to visit Japan because I&apos;m interested in
                    the culture and food.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div className="max-w-[82%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                    Чудова відповідь! Природніше англійською це звучатиме так:

                    <span className="mt-2 block font-semibold text-slate-900">
                      “I&apos;d love to visit Japan because I&apos;m fascinated
                      by its culture and cuisine.”
                    </span>

                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"
                    >
                      <Volume2 className="h-4 w-4" />
                      Прослухати
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Sparkles className="h-4 w-4" />

                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Отримано XP
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-black text-indigo-900">
                      +25 XP
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center gap-2 text-violet-700">
                      <Mic className="h-4 w-4" />

                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Говоріння
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-black text-violet-900">
                      92%
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm">
                  <button
                    type="button"
                    aria-label="Почати говорити"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                  >
                    <Mic className="h-5 w-5" />
                  </button>

                  <div className="flex-1 px-2 text-sm text-slate-400">
                    Напишіть Еммі...
                  </div>

                  <button
                    type="button"
                    aria-label="Надіслати повідомлення"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-10 -bottom-5 -z-10 h-24 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
