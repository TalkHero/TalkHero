import {
  CheckCircle2,
  Circle,
  Database,
  FileCode2,
  Gauge,
  Map,
  Sparkles,
} from "lucide-react";

import { LONDON_CAMPAIGN } from "@/lib/adventure/content";

const COMPLETED_MISSION_SLUGS = new Set([
  "coffee-shop",
  "underground",
  "hotel",
  "airport",
  "restaurant",
  "supermarket",
  "bank",
  "pharmacy",
  "taxi",
  "post-office",
]);

const HEALTH_ITEMS = [
  { label: "Quest Engine", status: "PASS", icon: FileCode2 },
  { label: "Adventure", status: "PASS", icon: Map },
  { label: "Database", status: "PASS", icon: Database },
  { label: "Living NPC", status: "PASS", icon: Sparkles },
];

const RELEASE_CHECKLIST = [
  { label: "Quest Engine", completed: true },
  { label: "Adventure Mode", completed: true },
  { label: "Progress System", completed: true },
  { label: "Living NPC", completed: true },
  { label: "London Campaign", completed: false },
  { label: "UI Polish", completed: false },
  { label: "Release QA", completed: false },
  { label: "Beta Build", completed: false },
];

export default function ReleaseDashboardPage() {
  const completedMissions = LONDON_CAMPAIGN.missions.filter((mission) =>
    COMPLETED_MISSION_SLUGS.has(mission.slug),
  ).length;

  const totalMissions = LONDON_CAMPAIGN.missions.length;
  const campaignPercentage = totalMissions > 0
    ? Math.round((completedMissions / totalMissions) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
          <Gauge className="h-4 w-4" />
          Release Candidate
        </div>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Release Dashboard</h1>
        <p className="mt-3 text-slate-600">Статичний MVP стану TalkHero Beta 1.0.</p>
      </header>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Project Health</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {HEALTH_ITEMS.map(({ label, status, icon: Icon }) => (
            <article key={label} className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{status}</span>
              </div>
              <p className="mt-4 font-bold text-slate-950">{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-violet-600">London Campaign</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {completedMissions} із {totalMissions} місій
              </h2>
            </div>
            <p className="text-3xl font-bold text-violet-700">{campaignPercentage}%</p>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-600" style={{ width: `${campaignPercentage}%` }} />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {LONDON_CAMPAIGN.missions.map((mission) => {
              const completed = COMPLETED_MISSION_SLUGS.has(mission.slug);
              return (
                <div key={mission.slug} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                  <span className="text-sm font-semibold text-slate-700">{mission.title}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Release Checklist</h2>
          <div className="mt-5 space-y-3">
            {RELEASE_CHECKLIST.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                )}
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
