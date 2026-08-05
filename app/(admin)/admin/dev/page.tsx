import Link from "next/link";
import {
  ArrowRight,
  Bug,
  ClipboardCheck,
  ListChecks,
} from "lucide-react";

const TOOLS = [
  {
    href: "/admin/dev/release",
    title: "Release Dashboard",
    description: "Загальний стан релізу, прогрес London Campaign і чек-лист Beta.",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/dev/quests",
    title: "Quest Inspector",
    description: "Перегляд структури місій, навчальних цілей і швидкий запуск.",
    icon: ListChecks,
  },
  {
    href: "/admin/dev/validate",
    title: "Campaign Validator",
    description: "Статичні перевірки маршрутів, slug, прогресії та контенту.",
    icon: Bug,
  },
];

export default function DevHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
          Internal tools
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
          Developer Console
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Внутрішній центр контролю підготовки TalkHero Beta 1.0.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-3">
        {TOOLS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
              Відкрити
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
