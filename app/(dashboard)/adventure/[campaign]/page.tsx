import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import {
  ArrowLeft,
  MapPin,
} from "lucide-react";

import {
  CampaignMissionList,
} from "@/components/adventure/CampaignMissionList";
import {
  LONDON_CAMPAIGN,
} from "@/lib/adventure/content";

type CampaignPageProps = {
  params: Promise<{
    campaign: string;
  }>;
};

export default async function CampaignPage({
  params,
}: CampaignPageProps) {
  const { campaign } = await params;

  if (
    campaign !==
    LONDON_CAMPAIGN.slug
  ) {
    redirect("/adventure");
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/adventure"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          До пригод
        </Link>

        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
              <MapPin className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-300">
                {
                  LONDON_CAMPAIGN.location
                }
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {
                  LONDON_CAMPAIGN.title
                }
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                {
                  LONDON_CAMPAIGN.description
                }
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-950">
            Місії кампанії
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Ваші результати, зірки й доступність місій завантажуються з бази даних.
          </p>

          <div className="mt-6">
            <CampaignMissionList
              campaign={
                LONDON_CAMPAIGN
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}
