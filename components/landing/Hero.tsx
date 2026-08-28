"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Play,
  Sparkles,
  TrendingUp,
  Volume2,
  Zap,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="absolute right-[-180px] top-16 h-[520px] w-[520px] rounded-full bg-violet-300/35 blur-3xl" />

        <div className="absolute left-1/2 top-[45%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-fuchsia-200/20 blur-3xl" />

        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_70%_35%,rgba(124,58,237,0.08),transparent_42%)]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8 lg:px-8 lg:py-14">
        {/* Left content */}
        <div className="relative z-20 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Ваш персональний AI-викладач англійської
          </div>

          <h1 className="mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[68px]">
            Англійська, яка

            <span className="block">
              починає звучати
            </span>

            <span className="mt-1 block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              природно.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            Говоріть з Emma — вашим персональним AI-викладачем.
            Вона слухає, виправляє помилки та адаптує навчання
            саме під вас.
          </p>

          {/* CTA */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-600/25"
            >
              Почати безкоштовно

              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-7 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>

              Як це працює
            </Link>
          </div>

          {/* Trust markers */}
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-[18px] w-[18px] text-indigo-500" />
              Без картки
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-[18px] w-[18px] text-indigo-500" />
              Українські пояснення
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-[18px] w-[18px] text-indigo-500" />
              Від A1 до C1
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className="relative mx-auto min-h-[570px] w-full max-w-[700px] lg:min-h-[610px]">
          {/* Emma glow */}
          <div className="pointer-events-none absolute left-[-3%] top-[7%] h-[430px] w-[430px] rounded-full bg-gradient-to-br from-indigo-300/50 via-violet-300/35 to-fuchsia-200/30 blur-3xl" />

          <div className="pointer-events-none absolute left-[7%] top-[11%] h-[365px] w-[365px] rounded-full border border-indigo-200/60" />

          <div className="pointer-events-none absolute left-[11%] top-[15%] h-[315px] w-[315px] rounded-full border border-violet-200/50" />

          {/* Emma */}
          <div className="absolute left-[-7%] top-[3%] z-10 w-[59%] min-w-[315px] sm:left-[-4%] sm:w-[56%] lg:left-[-8%] lg:w-[58%]">
            <Image
              src="/images/emma/emma-hero.png"
              alt="Emma — персональний AI-викладач англійської TalkHero"
              width={1024}
              height={1200}
              priority
              className="h-auto w-full drop-shadow-[0_30px_35px_rgba(79,70,229,0.20)]"
            />
          </div>

          {/* Main correction card */}
          <div className="absolute right-[-3%] top-[11%] z-20 w-[61%] min-w-[330px] overflow-hidden rounded-[28px] border border-white/80 bg-white/88 shadow-[0_30px_80px_rgba(79,70,229,0.18)] backdrop-blur-xl sm:w-[58%]">
            {/* Emma header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 ring-2 ring-white shadow-md">
                  <Image
                    src="/images/emma/emma-hero.png"
                    alt=""
                    width={80}
                    height={80}
                    className="absolute left-1/2 top-[6px] w-[78px] max-w-none -translate-x-1/2"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-950">
                      Emma
                    </p>

                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  </div>

                  <p className="text-xs font-medium text-slate-500">
                    AI English Coach
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">
                B1 → B2
              </div>
            </div>

            {/* Card content */}
            <div className="space-y-3 p-5">
              {/* User phrase */}
              <div className="rounded-2xl bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  You
                </p>

                <p className="mt-1.5 text-sm font-medium leading-6 text-slate-800">
                  Yesterday I{" "}
                  <span className="border-b-2 border-red-300 text-red-600">
                    go
                  </span>{" "}
                  to my friend&apos;s house.
                </p>
              </div>

              {/* Correction */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />

                  <p className="text-sm font-bold text-slate-900">
                    Майже правильно
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-800">
                  Yesterday I{" "}
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700">
                    went
                  </span>{" "}
                  to my friend&apos;s house.
                </p>

                {/* Grammar */}
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      go → went
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Past Simple
                    </p>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Volume2 className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Bottom actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                  <Volume2 className="h-4 w-4" />
                  Прослухати
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                  <Zap className="h-3.5 w-3.5 fill-amber-400" />
                  +15 XP
                </div>
              </div>
            </div>
          </div>

          {/* Floating streak */}
          <div className="absolute right-[1%] top-[2%] z-30 hidden w-[140px] rounded-2xl border border-orange-100 bg-white/90 p-3.5 shadow-xl shadow-orange-100/50 backdrop-blur sm:block">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
              Серія занять
            </div>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-[28px] font-black leading-none text-slate-950">
                7
              </span>

              <span className="pb-0.5 text-xs font-medium text-slate-500">
                днів
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
            </div>
          </div>

          {/* Floating speaking */}
          <div className="absolute bottom-[12%] left-[3%] z-30 hidden w-[160px] rounded-2xl border border-indigo-100 bg-white/90 p-3.5 shadow-xl shadow-indigo-100/60 backdrop-blur sm:block">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                Говоріння
              </p>

              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-[28px] font-black leading-none text-slate-950">
                92%
              </span>

              <span className="pb-0.5 text-xs font-bold text-emerald-600">
                ↑
              </span>
            </div>

            <div className="mt-3 flex items-end gap-1">
              {[
                16,
                24,
                18,
                30,
                21,
                35,
                28,
                38,
                24,
                31,
                20,
              ].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-1.5 rounded-full bg-indigo-400"
                  style={{
                    height: `${Math.max(
                      6,
                      height / 2,
                    )}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Floating progress */}
          <div className="absolute bottom-[5%] right-[7%] z-30 hidden items-center gap-2 rounded-2xl border border-violet-100 bg-white/90 px-3.5 py-2.5 shadow-xl shadow-violet-100/60 backdrop-blur md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Sparkles className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Прогрес
              </p>

              <p className="text-xs font-black text-slate-900">
                Ще 78 XP до B2
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
