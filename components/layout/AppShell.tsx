"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";

type AppShellProps = {
  children: React.ReactNode;
  fullName: string;
  englishLevel: string;
  xp: number;
  streak: number;
};

export function AppShell({
  children,
  fullName,
  englishLevel,
  xp,
  streak,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName =
    fullName.trim().split(/\s+/)[0] || "Student";

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                Hello, {firstName} 👋
              </p>

              <p className="text-xs text-slate-400">
                Ready for your next lesson?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 sm:flex">
              <span>🔥</span>
              <span className="text-sm font-bold text-orange-700">
                {streak}
              </span>
              <span className="text-xs text-orange-500">
                day streak
              </span>
            </div>

            <div className="hidden items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 sm:flex">
              <span>✨</span>
              <span className="text-sm font-bold text-amber-700">
                {xp} XP
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                {firstName.slice(0, 1).toUpperCase()}
              </div>

              <div className="hidden sm:block">
                <p className="max-w-28 truncate text-xs font-semibold text-slate-800">
                  {firstName}
                </p>

                <p className="text-[11px] text-slate-400">
                  Level {englishLevel}
                </p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
