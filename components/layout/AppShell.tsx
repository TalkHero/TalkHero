"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Gamepad2,
  Home,
  Menu,
  MessageCircle,
  Star,
  UserRound,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  fullName: string;
  englishLevel: string;
  xp: number;
  streak: number;
};

type MobileNavigationItem = {
  href: string;
  label: string;
  icon: typeof Home;
  activePrefixes?: string[];
};

const MOBILE_NAVIGATION: MobileNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Головна",
    icon: Home,
  },
  {
    href: "/adventure",
    label: "Пригода",
    icon: Gamepad2,
    activePrefixes: ["/adventure", "/quests"],
  },
  {
    href: "/chat",
    label: "Чат",
    icon: MessageCircle,
  },
  {
    href: "/profile",
    label: "Профіль",
    icon: UserRound,
  },
];

function getUkrainianDayWord(value: number): string {
  const normalizedValue = Math.abs(value);
  const lastTwoDigits = normalizedValue % 100;
  const lastDigit = normalizedValue % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "днів";
  }

  if (lastDigit === 1) {
    return "день";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "дні";
  }

  return "днів";
}

function isMobileItemActive(
  pathname: string,
  item: MobileNavigationItem,
): boolean {
  const prefixes = item.activePrefixes ?? [item.href];

  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AppShell({
  children,
  fullName,
  englishLevel,
  xp,
  streak,
}: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = fullName.trim().split(/\s+/)[0] || "Користувач";

  const initial = firstName.slice(0, 1).toUpperCase();
  const streakLabel = getUkrainianDayWord(streak);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Відкрити навігацію"
              className={cn(
                "talkhero-focus flex size-11 shrink-0 items-center justify-center rounded-md",
                "text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground lg:hidden",
              )}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Привіт, {firstName}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                Готові продовжити навчання?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden min-h-10 items-center gap-2 rounded-full bg-warning-soft px-3 sm:flex">
              <Flame className="size-4 text-amber-600" aria-hidden="true" />

              <span className="text-sm font-bold text-amber-700">{streak}</span>

              <span className="text-xs text-amber-700/70">
                {streakLabel} поспіль
              </span>
            </div>

            <div className="hidden min-h-10 items-center gap-2 rounded-full bg-primary-soft px-3 sm:flex">
              <Star className="size-4 text-primary" aria-hidden="true" />

              <span className="text-sm font-bold text-primary">{xp} XP</span>
            </div>

            <Link
              href="/profile"
              aria-label={`Відкрити профіль користувача ${firstName}`}
              className={cn(
                "talkhero-focus flex min-h-11 items-center gap-3 rounded-md",
                "border border-border bg-card py-1.5 pl-1.5 pr-2",
                "transition-colors hover:bg-muted",
              )}
            >
              <div className="flex size-9 items-center justify-center rounded-sm bg-primary-soft text-sm font-bold text-primary">
                {initial}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-28 truncate text-xs font-semibold text-foreground">
                  {firstName}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  Рівень {englishLevel}
                </p>
              </div>
            </Link>

            <LogoutButton />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
            {children}
          </div>
        </main>

        <nav
          aria-label="Мобільна навігація"
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 grid grid-cols-4",
            "border-t border-border bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
            "backdrop-blur lg:hidden",
          )}
        >
          {MOBILE_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const active = isMobileItemActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "talkhero-focus flex min-h-14 flex-col items-center justify-center gap-1 rounded-md",
                  "text-[11px] font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
