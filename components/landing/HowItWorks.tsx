import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Mic,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Mic,
    title: "Ви говорите",
    description:
      "Практикуєтесь англійською в реальних діалогах — голосом або текстом.",
    example: "Yesterday I go to work.",
    accent: "indigo",
  },
  {
    number: "02",
    icon: Brain,
    title: "Emma розуміє",
    description:
      "AI аналізує зміст вашої відповіді та визначає, що саме ви хотіли сказати.",
    example: "Speech → meaning",
    accent: "violet",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Виправляє",
    description:
      "Важливі помилки пояснюються українською, без зайвих лекцій.",
    example: "go → went",
    accent: "emerald",
  },
  {
    number: "04",
    icon: BookOpen,
    title: "Запам’ятовує",
    description:
      "Нові слова, повторювані помилки та прогрес стають частиною вашого навчання.",
    example: "Past Simple +1",
    accent: "amber",
  },
  {
    number: "05",
    icon: WandSparkles,
    title: "Адаптує навчання",
    description:
      "Наступні розмови та завдання підлаштовуються під ваш реальний рівень.",
    example: "Наступний фокус: Past Simple",
    accent: "fuchsia",
  },
];

const accentClasses = {
  indigo: {
    icon: "bg-indigo-100 text-indigo-600",
    number: "text-indigo-500",
    example: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  violet: {
    icon: "bg-violet-100 text-violet-600",
    number: "text-violet-500",
    example: "border-violet-100 bg-violet-50 text-violet-700",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-600",
    number: "text-emerald-500",
    example: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600",
    number: "text-amber-500",
    example: "border-amber-100 bg-amber-50 text-amber-700",
  },
  fuchsia: {
    icon: "bg-fuchsia-100 text-fuchsia-600",
    number: "text-fuchsia-500",
    example: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700",
  },
} as const;

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-180px] top-20 h-[420px] w-[420px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute right-[-180px] bottom-10 h-[460px] w-[460px] rounded-full bg-violet-100/60 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Як працює TalkHero
          </div>

          <h2 className="mt-6 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-6xl">
            Одна розмова.
            <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              П’ять речей відбуваються автоматично.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Ви просто говорите англійською. TalkHero допомагає Emma
            аналізувати розмову, виправляти важливі помилки та будувати
            наступні кроки навчання.
          </p>
        </div>

        {/* Main learning loop */}
        <div className="relative mt-14 lg:mt-18">
          {/* Desktop connector */}
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-[73px] hidden h-px bg-gradient-to-r from-indigo-200 via-violet-300 to-fuchsia-200 lg:block" />

          <div className="grid gap-5 lg:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors =
                accentClasses[
                  step.accent as keyof typeof accentClasses
                ];

              return (
                <div
                  key={step.number}
                  className="group relative"
                >
                  {/* Connector arrow */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-4 top-[57px] z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm lg:flex">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}

                  <div className="relative h-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_28px_80px_rgba(79,70,229,0.10)]">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.icon}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <span
                        className={`text-sm font-black tracking-[0.18em] ${colors.number}`}
                      >
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-black text-slate-950">
                      {step.title}
                    </h3>

                    <p className="mt-3 min-h-[84px] text-sm leading-7 text-slate-600">
                      {step.description}
                    </p>

                    <div
                      className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${colors.example}`}
                    >
                      {step.example}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation intelligence panel */}
        <div className="relative mt-14 overflow-hidden rounded-[32px] border border-indigo-100 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-1 shadow-2xl shadow-indigo-200/30">
          <div className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:items-center">
              {/* Left */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-violet-200">
                  <Brain className="h-4 w-4" />
                  Learning Intelligence
                </div>

                <h3 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Emma бачить не одну відповідь.
                  <span className="block text-violet-300">
                    Вона бачить ваш прогрес.
                  </span>
                </h3>

                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                  TalkHero поступово визначає сильні сторони, повторювані
                  помилки та теми, які варто практикувати далі.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {[
                    "Grammar",
                    "Vocabulary",
                    "Speaking",
                    "Comprehension",
                  ].map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right intelligence UI */}
              <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                      Your English
                    </p>

                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-4xl font-black text-white">
                        B1
                      </span>

                      <span className="pb-1 text-sm font-bold text-violet-300">
                        78% → B2
                      </span>
                    </div>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" />
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <SkillRow label="Grammar" value={72} />
                  <SkillRow label="Vocabulary" value={81} />
                  <SkillRow label="Speaking" value={76} />
                  <SkillRow label="Comprehension" value={84} />
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Emma помітила
                  </p>

                  <div className="mt-4 space-y-3">
                    <FocusRow label="Past Simple" level={3} />
                    <FocusRow label="Prepositions" level={2} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300">
                      Наступний фокус
                    </p>

                    <p className="mt-1 text-sm font-bold text-white">
                      Past Simple in conversation
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-violet-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SkillRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-300">{label}</span>
        <span className="text-white">{value}%</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FocusRow({
  label,
  level,
}: {
  label: string;
  level: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-200">
        {label}
      </span>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`h-2.5 w-2.5 rounded-full ${
              dot <= level
                ? "bg-violet-400"
                : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
