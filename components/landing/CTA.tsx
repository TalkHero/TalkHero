import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white shadow-2xl shadow-indigo-600/20 sm:px-10 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Почніть навчання вже сьогодні
            </div>

            <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Заговоріть англійською впевнено разом із TalkHero
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-indigo-100">
              Практикуйте живі діалоги, покращуйте вимову, розширюйте словниковий
              запас і відстежуйте свій прогрес разом із персональним
              ШІ-викладачем.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 sm:w-auto"
              >
                Почати безкоштовно
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
              >
                Увійти
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-indigo-100 sm:flex-row sm:gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                Безкоштовний старт
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                Без банківської картки
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                Навчайтеся будь-коли
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
