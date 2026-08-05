import Link from "next/link";
import {
  redirect,
} from "next/navigation";
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
  getMissionBySlug,
  LONDON_CAMPAIGN,
} from "@/lib/adventure/content";
import {
  getAdventureCampaignProgress,
  getMissionProgressBySlug,
} from "@/lib/adventure/progress";

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

export default async function MissionPage({
  params,
}: MissionPageProps) {
  const {
    campaign,
    mission: missionSlug,
  } = await params;

  if (
    campaign !==
    LONDON_CAMPAIGN.slug
  ) {
    redirect("/adventure");
  }

  const mission =
    getMissionBySlug(
      missionSlug,
    );

  if (!mission) {
    redirect(
      `/adventure/${LONDON_CAMPAIGN.slug}`,
    );
  }

  let progress;

  try {
    progress =
      await getAdventureCampaignProgress(
        LONDON_CAMPAIGN
          .progressCampaignSlug,
      );
  } catch {
    redirect("/login");
  }

  const missionProgress =
    getMissionProgressBySlug(
      progress,
      mission.slug,
    );

  if (
    !missionProgress ||
    missionProgress.status ===
      "locked"
  ) {
    redirect(
      `/adventure/${LONDON_CAMPAIGN.slug}`,
    );
  }

  const Icon =
    ICONS[
      mission.slug as
        keyof typeof ICONS
    ] ?? Coffee;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/adventure/${LONDON_CAMPAIGN.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          До кампанії
        </Link>

        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-6 sm:p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
              <Icon className="h-10 w-10" />
            </div>

            <p className="mt-6 text-sm font-semibold text-emerald-700">
              {
                LONDON_CAMPAIGN.title
              }
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              {mission.title}
            </h1>

            <p className="mt-2 text-lg font-medium text-slate-700">
              {mission.subtitle}
            </p>

            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              {
                mission.description
              }
            </p>
          </div>

          <div className="grid gap-4 border-t border-slate-100 p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3 className="h-5 w-5 text-indigo-600" />
              <p className="mt-3 font-bold text-slate-950">
                {
                  mission.durationMinutes
                }{" "}
                хвилин
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Орієнтовна тривалість
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Star className="h-5 w-5 text-amber-600" />
              <p className="mt-3 font-bold text-slate-950">
                {mission.xpReward} XP
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Нагорода досвідом
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Coins className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 font-bold text-slate-950">
                {
                  mission.coinReward
                }{" "}
                монет
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Нагорода за завершення
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <Target className="h-4 w-4" />
            Що ви потренуєте
          </div>

          <ul className="mt-5 space-y-3">
            {mission.objectives.map(
              (item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ),
            )}
          </ul>

          <Link
            href={mission.questHref}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            {missionProgress.status ===
            "in_progress"
              ? "Продовжити місію"
              : missionProgress.status ===
                  "completed"
                ? "Пройти ще раз"
                : "Почати місію"}

            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
