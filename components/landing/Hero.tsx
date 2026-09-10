"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Mic,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* =========================================================
          BACKGROUND
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute -right-44 top-16 h-[520px] w-[520px] rounded-full bg-violet-300/30 blur-3xl" />

        <div className="absolute left-1/2 top-[43%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-200/20 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* =========================================================
          MOBILE
      ========================================================== */}
      <div className="mx-auto w-full max-w-[440px] px-4 lg:hidden">
        <div className="relative pt-7">
          {/* Badge */}
          <div className="relative z-40 inline-flex max-w-[95%] items-center gap-2 rounded-full border border-indigo-200/80 bg-white/95 px-4 py-2.5 text-[12px] font-semibold text-indigo-700 shadow-[0_6px_20px_rgba(79,70,229,0.08)] backdrop-blur">
            <Sparkles className="h-4 w-4 shrink-0" />

            <span className="truncate">
              Персональний AI-викладач англійської
            </span>
          </div>

          {/* Main composition */}
          <div className="relative mt-5 h-[545px]">
            {/* Headline */}
            <div className="absolute left-0 top-0 z-30 w-[88%]">
              <h1 className="text-[43px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950">
                Практикуй

                <span className="block">
                  англійську з AI
                </span>

                <span className="mt-1 block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  вже зараз.
                </span>
              </h1>
            </div>

            {/* Description */}
            <div className="absolute left-0 top-[158px] z-30 w-[62%]">
              <p className="text-[15px] font-medium leading-[1.55] text-slate-600">
                Реальні розмови з{" "}
                <span className="font-bold text-slate-800">
                  Emma
                </span>
                . Вона почує тебе, виправить помилки та
                пояснить українською, як говорити природніше.
              </p>
            </div>

            {/* Emma glow */}
            <div className="pointer-events-none absolute right-[-55px] top-[85px] z-0 h-[380px] w-[380px] rounded-full bg-gradient-to-br from-indigo-300/45 via-violet-300/30 to-fuchsia-200/20 blur-3xl" />

            {/* Emma */}
            <div className="pointer-events-none absolute -right-[76px] top-[72px] z-20 h-[460px] w-[345px]">
              <Image
                src="/images/emma/emma-hero.png"
                alt="Emma — AI-викладач англійської TalkHero"
                width={1024}
                height={1200}
                priority
                className="h-full w-full object-contain object-bottom drop-shadow-[0_28px_40px_rgba(79,70,229,0.22)]"
              />
            </div>

            {/* Speech bubble */}
            <div className="absolute right-[-1px] top-[54px] z-40">
              <div className="relative min-w-[128px] rounded-[28px] border border-indigo-200 bg-white/95 px-[18px] py-3.5 shadow-[0_12px_30px_rgba(79,70,229,0.12)] backdrop-blur">
                <p className="text-[16px] font-black leading-tight text-indigo-600">
                  Hi!
                </p>

                <p className="text-[15px] font-black leading-tight text-indigo-600">
                  I&apos;m Emma 👋
                </p>

                <span className="absolute -bottom-2.5 right-7 h-5 w-5 rotate-45 border-b border-r border-indigo-200 bg-white" />
              </div>
            </div>

            {/* CTA */}
            <div className="absolute left-0 top-[342px] z-50 w-[67%]">
              <a
  href="#speaking-demo"
  className="group flex h-[62px] w-full items-center justify-center gap-2.5 rounded-[22px] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 text-[14px] font-bold text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)] transition active:scale-[0.98]"
>
  <Mic className="h-[18px] w-[18px] shrink-0" />

  <span>Спробувати розмову</span>

  <ArrowRight className="h-[18px] w-[18px] shrink-0 transition group-hover:translate-x-1" />
</a>

              <p className="mt-3 whitespace-nowrap text-center text-[11px] font-medium text-slate-500">
                Без реєстрації · Без картки · Безкоштовно
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="relative z-40 -mt-6 grid grid-cols-3 gap-3 pb-8">
            <Benefit
              icon={<Mic className="h-5 w-5" />}
              title="Говори"
              text={
                <>
                  Реальні діалоги
                  <br />з AI
                </>
              }
            />

            <Benefit
              icon={<Sparkles className="h-5 w-5" />}
              title="Виправляйся"
              text={
                <>
                  Зрозумілі пояснення
                  <br />
                  українською
                </>
              }
            />

            <Benefit
              icon={<TrendingUp className="h-5 w-5" />}
              title="Прогресуй"
              text={
                <>
                  Від A1
                  <br />
                  до C2
                </>
              }
            />
          </div>

          {/* Direct transition to live demo */}
          <a
  href="#speaking-demo"
  className="group mx-auto mb-8 flex w-fit flex-col items-center text-center"
>
  <p className="text-sm font-semibold text-slate-500 transition group-hover:text-indigo-600">
    Спробуй TalkHero прямо зараз
  </p>

  <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 transition group-hover:translate-y-1 group-hover:bg-indigo-100">
    <ArrowDown className="h-4 w-4" />
  </div>
</a>
        </div>
      </div>

      {/* =========================================================
          DESKTOP
      ========================================================== */}
      <div className="mx-auto hidden min-h-[calc(100vh-80px)] max-w-7xl grid-cols-[0.9fr_1.1fr] items-center gap-8 px-8 py-14 lg:grid">
        {/* Left */}
        <div className="relative z-30 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
            <Sparkles className="h-4 w-4" />

            Персональний AI-викладач англійської
          </div>

          <h1 className="mt-7 text-[68px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950">
            Практикуй

            <span className="block">
              англійську з AI
            </span>

            <span className="mt-1 block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              вже зараз.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-xl leading-8 text-slate-600">
            Реальні розмови з Emma. Вона почує тебе,
            виправить помилки та пояснить українською, як
            говорити природніше.
          </p>

          <div className="mt-9">
  <a
    href="#speaking-demo"
    className="group inline-flex h-14 min-w-[290px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 transition hover:-translate-y-0.5"
  >
    <Mic className="h-4 w-4" />

    Спробувати розмову

    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
  </a>

  <p className="mt-3 text-xs text-slate-500">
    Без реєстрації · Без картки · Безкоштовно
  </p>
</div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-6">
            <DesktopBenefit
              icon={<Mic className="h-5 w-5" />}
              title="Говори"
              text="Реальні діалоги з AI"
            />

            <DesktopBenefit
              icon={<Sparkles className="h-5 w-5" />}
              title="Виправляйся"
              text="Пояснення українською"
            />

            <DesktopBenefit
              icon={<TrendingUp className="h-5 w-5" />}
              title="Прогресуй"
              text="Від A1 до C2"
            />
          </div>
        </div>

        {/* Emma */}
        <div className="relative min-h-[650px]">
          <div className="absolute left-1/2 top-[44%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-300/45 via-violet-300/30 to-fuchsia-200/20 blur-3xl" />

          <div className="absolute left-[7%] top-[6%] z-30 rounded-[28px] border border-indigo-200 bg-white/95 px-5 py-4 shadow-xl">
            <p className="text-xl font-black text-indigo-600">
              Hi!
            </p>

            <p className="text-lg font-black text-indigo-600">
              I&apos;m Emma 👋
            </p>
          </div>

          <Image
            src="/images/emma/emma-hero.png"
            alt="Emma — AI English Coach TalkHero"
            width={1024}
            height={1200}
            priority
            className="absolute bottom-0 right-[-3%] z-20 h-[625px] w-auto object-contain drop-shadow-[0_30px_45px_rgba(79,70,229,0.22)]"
          />
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   SMALL COMPONENTS
============================================================= */

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-indigo-100 bg-white/95 text-indigo-600 shadow-[0_8px_24px_rgba(79,70,229,0.10)]">
        {icon}
      </div>

      <p className="mt-3 text-[14px] font-black text-slate-950">
        {title}
      </p>

      <p className="mt-1 text-[11px] leading-[1.45] text-slate-500">
        {text}
      </p>
    </div>
  );
}

function DesktopBenefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <p className="mt-3 font-black text-slate-950">
        {title}
      </p>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}
