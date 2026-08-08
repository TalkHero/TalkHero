import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { redirect } from "next/navigation";

import { CampaignMissionList } from "@/components/adventure/CampaignMissionList";
import type {
  AdventureCampaign,
  AdventureMission,
} from "@/lib/adventure/content";
import {
  loadCampaign,
  loadPublishedCampaignQuests,
} from "@/lib/quests/repository";

type CampaignPageProps = {
  params: Promise<{
    campaign: string;
  }>;
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

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { campaign } = await params;

  // Legacy URL compatibility.
  if (campaign === "london-first-day") {
    redirect("/adventure/english-basics");
  }

  let campaignRecord;
  let questRecords;

  try {
    campaignRecord = await loadCampaign(campaign);

    questRecords = await loadPublishedCampaignQuests(campaignRecord.id);
  } catch (error) {
    console.error("FAILED TO LOAD ADVENTURE CAMPAIGN:", error);

    redirect("/adventure");
  }

  const campaignAdventureMetadata = getMetadataObject(
    campaignRecord.metadata.adventure,
  );

  const missions: AdventureMission[] = questRecords.map((quest) => {
    const adventureMetadata = getMetadataObject(quest.metadata.adventure);

    const subtitle =
      getMetadataString(adventureMetadata.subtitle) ??
      quest.description ??
      "Навчальна місія";

    const objectives = getMetadataStringArray(adventureMetadata.objectives);

    return {
      slug: quest.slug,

      title: quest.title,

      subtitle,

      description:
        quest.description ?? "Інтерактивна місія для практики англійської.",

      cefrLevel: quest.cefr_level ?? campaignRecord.cefr_level ?? "A1",

      durationMinutes:
        quest.estimated_minutes !== null
          ? String(quest.estimated_minutes)
          : "10",

      xpReward: quest.xp_reward,

      coinReward: quest.coin_reward,

      questHref: `/quests/${campaignRecord.slug}/${quest.episode_id}/${quest.slug}`,

      objectives,
    };
  });

  const adventureCampaign: AdventureCampaign = {
    slug: campaignRecord.slug,

    progressCampaignSlug: campaignRecord.slug,

    title: campaignRecord.title,

    subtitle:
      getMetadataString(campaignAdventureMetadata.subtitle) ??
      campaignRecord.cefr_level ??
      "Навчальна кампанія",

    description:
      campaignRecord.description ??
      "Інтерактивна кампанія для практики англійської.",

    location:
      getMetadataString(campaignAdventureMetadata.location) ??
      "Велика Британія",

    missions,
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <Link
          href="/adventure"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          До пригод
        </Link>

        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
              <MapPin className="h-7 w-7" aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-300">
                {adventureCampaign.location}
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {adventureCampaign.title}
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                {adventureCampaign.description}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-950">Місії кампанії</h2>

          <p className="mt-1 text-sm text-slate-600">
            Ваші результати, зірки й доступність місій завантажуються з бази
            даних.
          </p>

          <div className="mt-6">
            <CampaignMissionList campaign={adventureCampaign} />
          </div>
        </section>
      </div>
    </main>
  );
}
