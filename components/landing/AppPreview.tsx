import {
  Bot,
  Flame,
  MessageCircle,
  Mic,
  Trophy,
  User,
} from "lucide-react";

const cards = [
  {
    icon: MessageCircle,
    title: "Спілкування з ШІ",
    color: "bg-indigo-500",
    content: (
      <>
        <div className="rounded-xl bg-slate-100 p-3 text-sm">
          AI: What did you do this weekend?
        </div>

        <div className="ml-auto mt-3 w-fit rounded-xl bg-indigo-600 p-3 text-sm text-white">
          I visited my grandparents and we had dinner together.
        </div>
      </>
    ),
  },
  {
    icon: Mic,
    title: "Практика говоріння",
    color: "bg-violet-500",
    content: (
      <div className="space-y-3">
        <div className="h-3 rounded-full bg-slate-200">
          <div className="h-3 w-[92%] rounded-full bg-violet-500" />
        </div>

        <p className="text-sm text-slate-600">
          Оцінка вимови
        </p>

        <p className="text-3xl font-black text-slate-900">
          92%
        </p>
      </div>
    ),
  },
  {
    icon: Trophy,
    title: "Досягнення",
    color: "bg-amber-500",
    content: (
      <div className="grid grid-cols-2 gap-3">
        {["🔥", "🏆", "⭐", "🎯"].map((emoji) => (
          <div
            key={emoji}
            className="flex aspect-square items-center justify-center rounded-2xl bg-amber-100 text-3xl"
          >
            {emoji}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: User,
    title: "Ваш прогрес",
    color: "bg-emerald-500",
    content: (
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Рівень</span>
          <span className="font-bold">12</span>
        </div>

        <div className="h-3 rounded-full bg-slate-200">
          <div className="h-3 w-3/4 rounded-full bg-emerald-500" />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-orange-500" />
          Серія: 14 днів
        </div>
      </div>
    ),
  },
];

export function AppPreview() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            Платформа
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900 sm:text-5xl">
            Усе необхідне для навчання — в одному місці
          </h2>

          <p className="mt-5 text-lg text-slate-600">
            Практикуйте діалоги, покращуйте вимову, відкривайте досягнення та
            відстежуйте свій прогрес в одному сучасному інтерфейсі.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${card.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {card.title}
                  </h3>
                </div>

                {card.content}
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-[32px] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-center text-white">
          <Bot className="mx-auto h-12 w-12" />

          <h3 className="mt-5 text-3xl font-black">
            Ваш ШІ-викладач завжди поруч
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
            Практикуйте англійську тоді, коли вам зручно. Без розкладів, без
            очікування — лише живі діалоги, персональні рекомендації та
            постійний розвиток.
          </p>
        </div>
      </div>
    </section>
  );
}
