import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  Coffee,
  Hotel,
  Plane,
  Star,
  Target,
  TrainFront,
} from "lucide-react";

import {
  getAdventureCampaignProgress,
  getMissionProgressBySlug,
} from "@/lib/adventure/progress";
import {
  loadCampaign,
  loadEpisodeById,
  loadPublishedCampaignQuests,
} from "@/lib/quests/repository";

type MissionPageProps = {
  params: Promise<{
    campaign: string;
    mission: string;
  }>;
};

const ICONS = {
  "coffee-shop": Coffee,
  underground: TrainFront,
  hotel: Hotel,
  airport: Plane,
};

function getMetadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getMetadataString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getMetadataStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { campaign, mission: missionSlug } = await params;

  if (campaign === "london-first-day") {
    redirect(`/adventure/english-basics/${missionSlug}`);
  }

  let campaignRecord;
  let questRecords;

  try {
    campaignRecord = await loadCampaign(campaign);

    questRecords = await loadPublishedCampaignQuests(campaignRecord.id);
  } catch (error) {
    console.error("FAILED TO LOAD ADVENTURE MISSION:", error);

    redirect("/adventure");
  }

  const quest = questRecords.find((item) => item.slug === missionSlug);

  if (!quest) {
    redirect(`/adventure/${campaignRecord.slug}`);
  }

  let episode;

  try {
    episode = await loadEpisodeById(quest.episode_id);
  } catch (error) {
    console.error("FAILED TO LOAD ADVENTURE EPISODE:", error);

    redirect(`/adventure/${campaignRecord.slug}`);
  }

  let progress;

  try {
    progress = await getAdventureCampaignProgress(campaignRecord.slug);
  } catch {
    redirect("/login");
  }

  const missionProgress = getMissionProgressBySlug(progress, quest.slug);

  if (!missionProgress || missionProgress.status === "locked") {
    redirect(`/adventure/${campaignRecord.slug}`);
  }

  const questAdventureMetadata = getMetadataObject(quest.metadata.adventure);

  const campaignAdventureMetadata = getMetadataObject(
    campaignRecord.metadata.adventure,
  );

  const subtitle =
    getMetadataString(questAdventureMetadata.subtitle) ?? "Навчальна місія";

  const objectives = getMetadataStringArray(questAdventureMetadata.objectives);

  const location =
    getMetadataString(campaignAdventureMetadata.location) ?? "Велика Британія";

  const durationMinutes =
    quest.estimated_minutes !== null ? String(quest.estimated_minutes) : "10";

  const questHref = `/quests/${campaignRecord.slug}/${episode.slug}/${quest.slug}`;

  const Icon = ICONS[quest.slug as keyof typeof ICONS] ?? Coffee;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <Link
          href={`/adventure/${campaignRecord.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          До кампанії
        </Link>

        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-6 sm:p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
              <Icon className="h-10 w-10" aria-hidden="true" />
            </div>

            <p className="mt-6 text-sm font-semibold text-emerald-700">
              {campaignRecord.title}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              {quest.title}
            </h1>

            <p className="mt-2 text-lg font-medium text-slate-700">
              {subtitle}
            </p>

            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              {quest.description ??
                "Інтерактивна місія для практики англійської."}
            </p>

            <p className="mt-4 text-sm font-medium text-slate-500">
              {location}
            </p>
          </div>

          <div className="grid gap-4 border-t border-slate-100 p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3 className="h-5 w-5 text-indigo-600" />

              <p className="mt-3 font-bold text-slate-950">
                {durationMinutes} хвилин
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Орієнтовна тривалість
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Star className="h-5 w-5 text-amber-600" />

              <p className="mt-3 font-bold text-slate-950">
                {quest.xp_reward} XP
              </p>

              <p className="mt-1 text-sm text-slate-500">Нагорода досвідом</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Coins className="h-5 w-5 text-emerald-600" />

              <p className="mt-3 font-bold text-slate-950">
                {quest.coin_reward} монет
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Нагорода за завершення
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <Target className="h-4 w-4" aria-hidden="true" />
            Що ви потренуєте
          </div>

          {objectives.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {objectives.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Виконайте місію та попрактикуйте ключові фрази у реальній
              ситуації.
            </p>
          )}

          <Link
            href={questHref}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            {missionProgress.status === "in_progress"
              ? "Продовжити місію"
              : missionProgress.status === "completed"
                ? "Пройти ще раз"
                : "Почати місію"}

            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
