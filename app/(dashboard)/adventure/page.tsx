import Link from "next/link";
import {
  ArrowRight,
  Gamepad2,
  MapPin,
  Star,
} from "lucide-react";

import {
  LONDON_CAMPAIGN,
} from "@/lib/adventure/content";

export default function AdventurePage() {
  const availableMissions = 1;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <Gamepad2 className="h-4 w-4" />
                Режим пригоди
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Проживайте реальні ситуації англійською
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Подорожуйте, знайомтеся з персонажами та використовуйте
                англійську для виконання сюжетних місій.
              </p>

              <Link
                href={`/adventure/${LONDON_CAMPAIGN.slug}`}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Відкрити кампанію
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="min-w-[250px] rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-emerald-300" />

                <div>
                  <p className="text-sm text-slate-300">
                    Поточна кампанія
                  </p>

                  <p className="font-bold">
                    {LONDON_CAMPAIGN.title}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  Доступні місії
                </span>

                <span className="font-bold">
                  {availableMissions} /{" "}
                  {LONDON_CAMPAIGN.missions.length}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-amber-300">
                <Star className="h-4 w-4" />
                Перший маршрут: рівень A1
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
