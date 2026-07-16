"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, BookOpen, Brain, UserRound, LayoutDashboard } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";


const NAVIGATION = [
  {
    href: "/chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
  href: "/vocabulary",
  label: "Vocabulary",
  icon: BookOpen,
},
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
  },
  {
  href: "/review",
  label: "Review",
  icon: Brain,
},
{
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
},
];

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="relative z-20 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5 lg:px-7">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/chat"
            className="flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-lg shadow-sm">
              🎓
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-950">
              TalkHero
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
