import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bug,
  ClipboardCheck,
  Gauge,
  ListChecks,
} from "lucide-react";

type DevLayoutProps = {
  children: React.ReactNode;
};

const NAVIGATION = [
  { href: "/admin/dev", label: "Огляд", icon: Gauge },
  { href: "/admin/dev/release", label: "Release Dashboard", icon: ClipboardCheck },
  { href: "/admin/dev/quests", label: "Quest Inspector", icon: ListChecks },
  { href: "/admin/dev/validate", label: "Campaign Validator", icon: Bug },
];

export default function DevLayout({ children }: DevLayoutProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-950 px-5 py-6 text-white lg:border-b-0 lg:border-r">
          <Link href="/admin/dev" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">Developer Console</p>
              <p className="text-xs text-slate-400">TalkHero Beta 1.0</p>
            </div>
          </Link>

          <nav aria-label="Навігація Developer Console" className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p className="font-semibold">Development only</p>
            <p className="mt-1 text-xs leading-5 text-amber-200/80">
              У production ці маршрути повертають 404.
            </p>
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</section>
      </div>
    </main>
  );
}
