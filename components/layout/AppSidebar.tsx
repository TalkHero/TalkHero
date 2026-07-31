"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  LayoutDashboard,
  MessageCircle,
  Mic,
  UserRound,
  X,
} from "lucide-react";

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const NAVIGATION = [
  {
    href: "/dashboard",
    label: "Головна",
    icon: LayoutDashboard,
  },
  {
    href: "/chat",
    label: "Чат з Еммою",
    icon: MessageCircle,
  },
  {
    href: "/speaking",
    label: "Говоріння",
    icon: Mic,
  },
  {
    href: "/vocabulary",
    label: "Словник",
    icon: BookOpen,
  },
  {
    href: "/review",
    label: "Щоденне повторення",
    icon: Brain,
  },
];

const ACCOUNT_NAVIGATION = [
  {
    href: "/profile",
    label: "Профіль",
    icon: UserRound,
  },
];

export function AppSidebar({
  open,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  function renderLink(item: {
    href: string;
    label: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
  }) {
    const Icon = item.icon;

    const active =
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        }`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${
            active
              ? "text-white"
              : "text-slate-400 group-hover:text-slate-700"
          }`}
        />

        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl shadow-lg shadow-indigo-200">
              🎓
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">
                TalkHero
              </p>

              <p className="text-xs text-slate-400">
                Навчайся з Emma
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Навчання
            </p>

            <nav className="space-y-1">
              {NAVIGATION.map(renderLink)}
            </nav>
          </div>

          <div className="mt-8">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Акаунт
            </p>

            <nav className="space-y-1">
              {ACCOUNT_NAVIGATION.map(renderLink)}
            </nav>
          </div>

          <div className="mt-auto pt-8">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Щоденна практика
              </p>

              <p className="mt-2 text-sm font-semibold">
                Збережи свою серію
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Пройдіть чат, сесію розмови або повторіть словниковий запас сьогодні.
              </p>

              <Link
                href="/review"
                onClick={onClose}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
              >
                Почати огляд
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
