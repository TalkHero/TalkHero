import { Brain, CheckCircle2, MessageCircleMore, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Brain,
    title: "Пам’ятає ваш контекст",
    description:
      "Emma запам’ятовує важливі деталі з попередніх розмов і використовує їх у наступних заняттях.",
  },
  {
    icon: CheckCircle2,
    title: "Виправляє з користю",
    description:
      "Помилки перетворюються на короткі пояснення, правильні приклади та матеріал для подальшої практики.",
  },
  {
    icon: MessageCircleMore,
    title: "Продовжує з того місця, де ви зупинились",
    description:
      "Не потрібно щоразу починати знайомство заново — навчання поступово накопичує контекст.",
  },
];

export function AdaptiveLearning() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Персоналізація
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900">
            Практика, яка підлаштовується саме під вас
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            TalkHero використовує контекст ваших занять, щоб кожна наступна
            розмова була природнішою, кориснішою та ближчою до ваших цілей.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute left-1/2 top-1/2 hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-100/60 blur-3xl lg:block" />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_320px_1fr] lg:items-center">
            <div className="space-y-6">
              <BenefitCard benefit={benefits[0]} />
              <BenefitCard benefit={benefits[1]} />
            </div>

            <div className="order-first lg:order-none">
              <div className="mx-auto flex max-w-xs flex-col items-center rounded-[2rem] border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-7 text-center shadow-xl shadow-indigo-100/50">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-black text-white shadow-lg shadow-indigo-200">
                  E
                </div>

                <p className="mt-5 text-xl font-bold text-slate-950">Emma</p>

                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  Ваш ШІ-викладач
                </p>

                <div className="mt-6 w-full rounded-2xl bg-white p-4 text-left shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Пам’ятаю
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Ви працюєте програмістом і хочете впевненіше говорити
                    англійською на роботі.
                  </p>
                </div>

                <div className="mt-3 w-full rounded-2xl bg-slate-100 p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Наступна практика
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Let&apos;s practice a conversation with your
                    English-speaking colleague.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <BenefitCard benefit={benefits[2]} />

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
                <p className="text-sm font-bold text-indigo-700">
                  Чим більше практики — тим точніша персоналізація
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Emma поступово краще розуміє ваш рівень, інтереси та навчальні
                  цілі.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitCard({ benefit }: { benefit: (typeof benefits)[number] }) {
  const Icon = benefit.icon;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{benefit.title}</h3>

      <p className="mt-2 leading-7 text-slate-600">{benefit.description}</p>
    </div>
  );
}
