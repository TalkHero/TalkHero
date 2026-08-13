import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Mic,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";

const features = [
  {
    title: "Практика говоріння",
    description:
      "Говоріть англійською вголос і тренуйте впевненість у реальних діалогах.",
    visual: "speaking",
  },
  {
    title: "Миттєві виправлення",
    description:
      "Emma пояснює помилки зрозумілою українською та показує правильний варіант.",
    visual: "corrections",
  },
  {
    title: "Розумний словник",
    description:
      "Нові слова зберігаються для повторення та поступово закріплюються в пам’яті.",
    visual: "vocabulary",
  },
  {
    title: "Прогрес і мотивація",
    description:
      "XP, серії занять і досягнення допомагають бачити результат і не втрачати темп.",
    visual: "progress",
  },
];

function SpeakingVisual() {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
          <Mic className="h-5 w-5" />
        </div>

        <div className="flex flex-1 items-end gap-1">
          {[18, 28, 42, 22, 36, 52, 32, 46, 25, 38, 20].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1.5 rounded-full bg-indigo-500"
              style={{ height }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Вимова</p>
          <p className="mt-1 text-2xl font-black text-slate-950">92%</p>
        </div>

        <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm">
          Emma слухає
        </div>
      </div>
    </div>
  );
}

function CorrectionsVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <X className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Було
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            Yesterday I go to work.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Правильно
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            Yesterday I went to work.
          </p>
        </div>
      </div>
    </div>
  );
}

function VocabularyVisual() {
  const words = [
    {
      word: "journey",
      translation: "подорож",
    },
    {
      word: "confident",
      translation: "впевнений",
    },
    {
      word: "improve",
      translation: "покращувати",
    },
  ];

  return (
    <div className="space-y-2">
      {words.map((item, index) => (
        <div
          key={item.word}
          className={`flex items-center justify-between rounded-2xl border p-3 ${
            index === 0
              ? "border-indigo-200 bg-indigo-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                index === 0
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <BookOpen className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">{item.word}</p>
              <p className="text-xs text-slate-500">{item.translation}</p>
            </div>
          </div>

          {index === 0 && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600 shadow-sm">
              Повторити
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ProgressVisual() {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Flame className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs text-slate-500">Серія занять</p>
            <p className="font-bold text-slate-900">14 днів</p>
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
          <Trophy className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Рівень 12</span>
          <span>780 / 1000 XP</span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
          <div className="h-full w-[78%] rounded-full bg-amber-400" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">
        <Target className="h-4 w-4 text-indigo-600" />
        До наступного рівня залишилось 220 XP
      </div>
    </div>
  );
}

function FeatureVisual({ visual }: { visual: string }) {
  if (visual === "speaking") {
    return <SpeakingVisual />;
  }

  if (visual === "corrections") {
    return <CorrectionsVisual />;
  }

  if (visual === "vocabulary") {
    return <VocabularyVisual />;
  }

  return <ProgressVisual />;
}

export function Features() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Можливості
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900">
            Не просто уроки — повний цикл практики
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Говоріть, отримуйте виправлення, запам&apos;ятовуйте нові слова та
            бачте свій прогрес в одному місці.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
            >
              <FeatureVisual visual={feature.visual} />

              <div className="mt-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 max-w-xl leading-7 text-slate-600">
                  {feature.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                  Дізнатися більше
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
