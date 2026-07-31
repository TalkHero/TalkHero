import {
  ArrowRight,
  BarChart3,
 BookOpen,
  Bot,
  Mic,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Bot,
    title: "Почніть спілкуватися з ШІ-викладачем",
    description:
      "Розмовляйте англійською на повсякденні теми. ШІ підлаштовується під ваш рівень і допомагає навчатися у власному темпі.",
  },
  {
    number: "02",
    icon: Mic,
    title: "Практикуйте говоріння",
    description:
      "Використовуйте голосовий режим, щоб покращувати вимову, впевненість і плавність мовлення в реальних ситуаціях.",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Поповнюйте словниковий запас",
    description:
      "Нові слова та корисні вирази автоматично зберігаються, щоб ви могли легко повторювати їх пізніше.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Спостерігайте за своїм прогресом",
    description:
      "Отримуйте XP, відкривайте досягнення, підтримуйте серію занять і бачте, як ваші навички зростають щодня.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            Як це працює
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Від першої розмови до впевненої англійської
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            TalkHero перетворює щоденну практику на простий та зрозумілий процес,
            який допомагає навчатися регулярно й бачити реальні результати.
          </p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.number} className="relative">
                  <div className="group relative h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black tracking-[0.2em] text-indigo-600">
                        {step.number}
                      </span>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <h3 className="mt-8 text-xl font-bold text-slate-900">
                      {step.title}
                    </h3>

                    <p className="mt-4 leading-7 text-slate-600">
                      {step.description}
                    </p>
                  </div>

                  {!isLast && (
                    <div className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 shadow-sm lg:flex">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <div className="inline-flex flex-col items-center gap-2 rounded-3xl border border-indigo-200 bg-indigo-50 px-6 py-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Кожна розмова наближає вас до вільного володіння англійською
              </p>

              <p className="text-sm text-slate-600">
                Навчайтеся регулярно, підтримуйте серію занять і відкривайте нові
                досягнення разом із TalkHero.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
