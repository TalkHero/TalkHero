import {
  Bot,
  BookOpen,
  Check,
  Mic,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";

const benefits = [
  {
    icon: Bot,
    title: "Персональний ШІ-викладач",
    description:
      "Навчайтеся у власному темпі з викладачем, який адаптується до вашого рівня та цілей.",
  },
  {
    icon: Mic,
    title: "Жива практика говоріння",
    description:
      "Розвивайте вимову, плавність мовлення та впевненість під час голосових діалогів.",
  },
  {
    icon: BookOpen,
    title: "Розумний словник",
    description:
      "Нові слова автоматично зберігаються та повторюються у найкращий момент для запам’ятовування.",
  },
  {
    icon: TrendingUp,
    title: "Видимий прогрес",
    description:
      "Відстежуйте свій розвиток за допомогою статистики, XP та історії навчання.",
  },
  {
    icon: Trophy,
    title: "Мотивація щодня",
    description:
      "Досягнення, рівні та серії занять допомагають не втрачати мотивацію.",
  },
];

export function Comparison() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            Чому обирають TalkHero
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Створено для тих, хто хоче реально заговорити англійською
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            TalkHero поєднує сучасні технології, практику говоріння та
            персоналізоване навчання, щоб кожне заняття приносило відчутний
            результат.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {benefit.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 overflow-hidden rounded-[32px] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-white shadow-2xl shadow-indigo-600/20">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
              <Sparkles className="h-8 w-8" />
            </div>

            <h3 className="mt-6 text-3xl font-black">
              Усе необхідне для ефективного навчання
            </h3>

            <p className="mt-4 max-w-3xl text-lg text-indigo-100">
              Практикуйте діалоги, покращуйте вимову, поповнюйте словниковий
              запас, отримуйте досягнення та відстежуйте прогрес — усе в одному
              сучасному застосунку.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                "ШІ-викладач",
                "Практика говоріння",
                "Розумний словник",
                "Статистика",
                "XP та досягнення",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur"
                >
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
