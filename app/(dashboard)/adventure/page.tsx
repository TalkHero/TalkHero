import Link from "next/link";
import { ArrowRight, Gamepad2, MapPin, Star } from "lucide-react";

import { loadPublishedCampaigns } from "@/lib/quests/repository";

export default async function AdventurePage() {
  const campaigns = await loadPublishedCampaigns();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                <Gamepad2 className="h-4 w-4" />
                Режим пригоди
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Проживайте реальні ситуації англійською
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Подорожуйте, знайомтеся з персонажами та використовуйте
                англійську для виконання сюжетних місій.
              </p>
            </div>

            <div className="min-w-[250px] rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-emerald-300" />

                <div>
                  <p className="text-sm text-slate-300">Доступні кампанії</p>

                  <p className="font-bold">{campaigns.length}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-amber-300">
                <Star className="h-4 w-4" />
                Навчальні маршрути за рівнями CEFR
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="campaigns-heading">
          <div className="mb-5">
            <h2
              id="campaigns-heading"
              className="text-2xl font-bold text-slate-950"
            >
              Кампанії
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Оберіть маршрут і продовжуйте навчання у своєму темпі.
            </p>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-slate-950">
                Поки що немає доступних кампаній.
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Нові пригоди з’являться тут після публікації.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/adventure/${campaign.slug}`}
                  className="group block"
                >
                  <article className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-violet-600">
                          {campaign.cefr_level
                            ? `Рівень ${campaign.cefr_level}`
                            : "Навчальна кампанія"}
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-slate-950">
                          {campaign.title}
                        </h3>
                      </div>

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 leading-7 text-slate-600">
                      {campaign.description ||
                        "Інтерактивна кампанія для практики англійської у реальних ситуаціях."}
                    </p>

                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                      Відкрити кампанію
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
