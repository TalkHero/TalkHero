import {
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { LONDON_CAMPAIGN } from "@/lib/adventure/content";

type ValidationItem = {
  label: string;
  details: string;
  passed: boolean;
};

function buildValidationItems(): ValidationItem[] {
  const slugs = LONDON_CAMPAIGN.missions.map((mission) => mission.slug);
  const hrefs = LONDON_CAMPAIGN.missions.map((mission) => mission.questHref);
  const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  const duplicateHrefs = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);

  return [
    {
      label: "Campaign slug",
      details: LONDON_CAMPAIGN.slug,
      passed: Boolean(LONDON_CAMPAIGN.slug),
    },
    {
      label: "Mission list",
      details: `${LONDON_CAMPAIGN.missions.length} місій`,
      passed: LONDON_CAMPAIGN.missions.length > 0,
    },
    {
      label: "Duplicate mission slugs",
      details: duplicateSlugs.length === 0 ? "Дублікатів не знайдено" : duplicateSlugs.join(", "),
      passed: duplicateSlugs.length === 0,
    },
    {
      label: "Duplicate quest routes",
      details: duplicateHrefs.length === 0 ? "Дублікатів не знайдено" : duplicateHrefs.join(", "),
      passed: duplicateHrefs.length === 0,
    },
    {
      label: "Quest href format",
      details: "Усі маршрути починаються з /quests/",
      passed: hrefs.every((href) => href.startsWith("/quests/")),
    },
    {
      label: "Mission objectives",
      details: "Кожна місія має навчальні цілі",
      passed: LONDON_CAMPAIGN.missions.every((mission) => mission.objectives.length > 0),
    },
  ];
}

export default function CampaignValidatorPage() {
  const validationItems = buildValidationItems();
  const passedCount = validationItems.filter((item) => item.passed).length;
  const allPassed = passedCount === validationItems.length;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
          <ShieldCheck className="h-4 w-4" />
          Static validation
        </div>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Campaign Validator</h1>
        <p className="mt-3 text-slate-600">Базові перевірки конфігурації London Campaign.</p>
      </header>

      <section
        className={[
          "rounded-3xl border p-6 shadow-sm",
          allPassed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className={["h-7 w-7", allPassed ? "text-emerald-600" : "text-amber-600"].join(" ")} />
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {allPassed ? "Validation passed" : "Validation needs attention"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {passedCount} із {validationItems.length} перевірок успішні
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {validationItems.map((item) => (
            <article key={item.label} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-950">{item.label}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.details}</p>
              </div>
              <span
                className={[
                  "w-fit rounded-full px-3 py-1 text-xs font-bold",
                  item.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                ].join(" ")}
              >
                {item.passed ? "PASS" : "FAIL"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <p className="text-sm text-slate-500">
        MVP перевіряє лише статичний контент. Перевірка Supabase, JSON і переходів між сценами буде додана окремим етапом.
      </p>
    </div>
  );
}
