import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Coins,
  Play,
  Star,
} from "lucide-react";

import { LONDON_CAMPAIGN } from "@/lib/adventure/content";

export default function QuestInspectorPage() {
  const firstMission = LONDON_CAMPAIGN.missions[0];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Content tools</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Quest Inspector</h1>
        <p className="mt-3 text-slate-600">MVP-перегляд місій кампанії без запитів до бази даних.</p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500">London missions</p>
          <div className="mt-3 space-y-1">
            {LONDON_CAMPAIGN.missions.map((mission, index) => (
              <div
                key={mission.slug}
                className={[
                  "rounded-xl px-4 py-3 text-sm font-semibold",
                  index === 0 ? "bg-violet-600 text-white" : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                <span className="mr-2 text-xs opacity-70">{index + 1}.</span>
                {mission.title}
              </div>
            ))}
          </div>
        </aside>

        {firstMission && (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-600">Selected quest</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">{firstMission.title}</h2>
                <p className="mt-2 text-slate-600">{firstMission.description}</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                CEFR {firstMission.cefrLevel}
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <Clock3 className="h-5 w-5 text-indigo-600" />
                <p className="mt-3 font-bold text-slate-950">{firstMission.durationMinutes} хв</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <Star className="h-5 w-5 text-amber-600" />
                <p className="mt-3 font-bold text-slate-950">{firstMission.xpReward} XP</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <Coins className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 font-bold text-slate-950">{firstMission.coinReward} монет</p>
              </div>
            </div>

            <section className="mt-8">
              <h3 className="font-bold text-slate-950">Навчальні цілі</h3>
              <ul className="mt-4 space-y-3">
                {firstMission.objectives.map((objective) => (
                  <li key={objective} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {objective}
                  </li>
                ))}
              </ul>
            </section>

            <Link
              href={firstMission.questHref}
              className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Play className="h-4 w-4" />
              Запустити квест
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        )}
      </section>

      <p className="text-sm text-slate-500">
        У наступній версії Inspector вибір місії та статистика сцен будуть динамічними.
      </p>
    </div>
  );
}
