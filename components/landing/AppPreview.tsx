import {
  ArrowRight,
  BookOpen,
  Flame,
  Gamepad2,
  LayoutDashboard,
  Mic,
  Repeat2,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

export function AppPreview() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Усередині TalkHero
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900 sm:text-5xl">
            Усе навчання видно в одному місці
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Щоденні цілі, розмовна практика, словник, повторення та прогрес —
            без десятків вкладок і складного налаштування.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 sm:mt-14 sm:rounded-[32px] lg:mt-16">
          <div className="grid lg:grid-cols-[230px_1fr]">
            <aside className="hidden border-r border-slate-200 bg-white p-5 lg:block">
              <div className="text-xl font-black text-slate-950">
                Talk<span className="text-indigo-600">Hero</span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Speak. Learn. Become.
              </p>

              <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Навчання
              </p>

              <div className="mt-3 space-y-2">
                <NavItem icon={LayoutDashboard} label="Головна" active />
                <NavItem icon={Gamepad2} label="Пригода" />
                <NavItem icon={Mic} label="Розмовна практика" />
                <NavItem icon={BookOpen} label="Словник" />
                <NavItem icon={Repeat2} label="Повторення" />
              </div>
            </aside>

            <div className="min-w-0 bg-slate-50">
              <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <p className="font-bold text-slate-950">Привіт 👋</p>

                  <p className="text-base text-slate-600">
  Готові продовжити навчання?
</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <TopBadge
                    icon={Flame}
                    value="4"
                    label="дні поспіль"
                    className="bg-amber-50 text-amber-700"
                  />

                  <TopBadge
                    icon={Star}
                    value="2710"
                    label="XP"
                    className="bg-indigo-50 text-indigo-700"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 sm:space-y-6 sm:p-7">
                <div className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-4 sm:rounded-3xl sm:p-6">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600">
                      <Gamepad2 className="h-3.5 w-3.5" />
                      Рекомендовано
                    </span>

                    <h3 className="mt-4 text-2xl font-black text-slate-950 sm:mt-5 sm:text-3xl">
                      Вітаємо у TalkHero
                    </h3>

                    <p className="mt-2 text-slate-600">
                      У вас 107 слів, готових до повторення.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                       <p className="text-base text-slate-600">Щоденна ціль</p>

                        <p className="mt-1 text-xl font-bold text-slate-950">
                          Повторення слів
                        </p>
                      </div>

                      <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white">
  Почати повторення
  <ArrowRight className="h-4 w-4" />
</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base text-slate-600">
  Рівень користувача
</p>

                        <p className="mt-2 text-4xl font-black text-slate-950">
                          28
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Target className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>10 із 100 XP</span>
                        <span>10%</span>
                      </div>

                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[10%] rounded-full bg-indigo-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                        <Target className="h-3.5 w-3.5" />
                        Щоденна практика
                      </span>

                      <h3 className="mt-4 text-2xl font-black text-slate-950">
                        Цілі на сьогодні
                      </h3>

                      <p className="mt-2 text-base leading-7 text-slate-600">
  Виконуйте короткі навчальні цілі та підтримуйте
  регулярний прогрес.
</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm text-slate-500">Виконано</p>

                      <p className="mt-1 text-xl font-black text-slate-950">
                        1 із 3
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-3">
                    <GoalCard
                      icon={Mic}
                      title="Розмовна практика"
                      description="Завершіть одну голосову практику з Emma."
                      status="Виконано"
                      completed
                    />

                    <GoalCard
                      icon={BookOpen}
                      title="Повторення слів"
                      description="Повторіть щонайменше 5 слів зі словника."
                      status="У процесі"
                    />

                    <GoalCard
                      icon={Gamepad2}
                      title="Місія пригоди"
                      description="Завершіть одну навчальну місію."
                      status="У процесі"
                    />
                  </div>
                </div>

                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent sm:h-24" />

                  <div className="relative flex justify-center pt-6 sm:pt-10">
                    <a
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:px-6 sm:py-3.5"
                    >
                      Відкрити TalkHero
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
        active ? "bg-indigo-50 text-indigo-600" : "text-slate-600"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function TopBadge({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: typeof Flame;
  value: string;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${className}`}
    >
      <Icon className="h-4 w-4" />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function GoalCard({
  icon: Icon,
  title,
  description,
  status,
  completed = false,
}: {
  icon: typeof Mic;
  title: string;
  description: string;
  status: string;
  completed?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 sm:rounded-2xl sm:p-4 ${
        completed
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            completed
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
          {status}
        </span>
      </div>

      <h4 className="mt-4 font-bold text-slate-950">{title}</h4>

     <p className="mt-2 text-base leading-6 text-slate-600">
  {description}
</p>
    </div>
  );
}
