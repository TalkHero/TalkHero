import {
  ArrowRight,
  BookOpen,
  Bot,
  Mic,
  Trophy,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "ШІ-викладач англійської",
    description:
      "Практикуйте природні діалоги з персональним ШІ-викладачем, який адаптується до вашого рівня англійської.",
  },
  {
    icon: Mic,
    title: "Практика говоріння",
    description:
      "Покращуйте вимову, впевненість і швидкість мовлення завдяки голосовим розмовам та миттєвому зворотному зв’язку.",
  },
  {
    icon: BookOpen,
    title: "Розумне вивчення слів",
    description:
      "Нові слова автоматично додаються до словника та повторюються за системою інтервальних повторень.",
  },
  {
    icon: Trophy,
    title: "Навчання як гра",
    description:
      "Отримуйте XP, відкривайте досягнення, підтримуйте серію занять і залишайтеся мотивованими щодня.",
  },
];

export function Features() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            Можливості
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900">
            Усе необхідне для ефективного вивчення англійської
          </h2>

          <p className="mt-5 text-lg text-slate-600">
            TalkHero поєднує штучний інтелект, практику говоріння,
            персоналізоване навчання та гейміфікацію в одному сучасному
            застосунку.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {feature.description}
                </p>

                <div className="mt-8 inline-flex items-center gap-2 font-semibold text-indigo-600">
                  Дізнатися більше
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
