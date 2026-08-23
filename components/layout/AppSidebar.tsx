"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  ClipboardCheck,
  Gamepad2,
  LayoutDashboard,
  MessageCircle,
  Mic,
  MessageSquareMore,
  Settings,
  UserRound,
  X,
} from "lucide-react";

import { TalkHeroWordmark } from "@/components/brand/TalkHeroWordmark";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  activePrefixes?: string[];
};

const MAIN_NAVIGATION: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Головна",
    icon: LayoutDashboard,
  },
  {
    href: "/chat",
    label: "Чат",
    icon: MessageCircle,
  },
  {
    href: "/adventure",
    label: "Пригода",
    icon: Gamepad2,
    activePrefixes: ["/adventure", "/quests"],
  },
  {
    href: "/speaking",
    label: "Розмовна практика",
    icon: Mic,
  },
  {
    href: "/placement-test",
    label: "Тест рівня",
    icon: ClipboardCheck,
    activePrefixes: ["/placement-test", "/assessment"],
  },
  {
    href: "/vocabulary",
    label: "Словник",
    icon: BookOpen,
  },
  {
    href: "/review",
    label: "Повторення",
    icon: Brain,
  },
];

const ACCOUNT_NAVIGATION: NavigationItem[] = [
  {
    href: "/profile",
    label: "Профіль",
    icon: UserRound,
  },
  {
    href: "/settings",
    label: "Налаштування",
    icon: Settings,
  },
  {
    href: "/contact",
    label: "Зворотний зв’язок",
    icon: MessageSquareMore,
  },
];

function isNavigationItemActive(
  pathname: string,
  item: NavigationItem,
): boolean {
  const prefixes = item.activePrefixes ?? [item.href];

  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  function renderLink(item: NavigationItem) {
    const Icon = item.icon;
    const active = isNavigationItemActive(pathname, item);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={cn(
          "talkhero-focus group flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5",
          "text-sm font-medium transition-colors duration-150",
          active
            ? "bg-primary-soft text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors",
            active
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden="true"
        />

        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Закрити навігацію"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        aria-label="Основна навігація"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col",
          "border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "transition-transform duration-200",
          "lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <TalkHeroWordmark className="leading-none" showTagline />

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити меню"
            className={cn(
              "talkhero-focus flex size-10 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground lg:hidden",
            )}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Навчання
            </p>

            <nav aria-label="Навчальні розділи" className="space-y-1">
              {MAIN_NAVIGATION.map(renderLink)}
            </nav>
          </div>

          <div className="mt-8">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Обліковий запис
            </p>

            <nav
              aria-label="Налаштування облікового запису"
              className="space-y-1"
            >
              {ACCOUNT_NAVIGATION.map(renderLink)}
            </nav>
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-xl border border-primary/10 bg-primary-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Щоденна практика
              </p>

              <p className="mt-2 text-sm font-semibold text-foreground">
                Закріпіть вивчене
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Повторіть слова, які вже готові до наступного тренування.
              </p>

              <Link
                href="/review"
                onClick={onClose}
                className={cn(
                  "talkhero-focus mt-4 flex min-h-10 w-full items-center justify-center",
                  "rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground",
                  "transition-colors hover:bg-primary-hover",
                )}
              >
                Почати повторення
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
