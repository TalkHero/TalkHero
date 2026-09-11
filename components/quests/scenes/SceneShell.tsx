"use client";

import type { ReactNode } from "react";
import { Target } from "lucide-react";

import { cn } from "@/lib/utils";

type SceneShellProps = {
  title?: string | null;
  description?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  taskLabel?: string;
  showTaskHeader?: boolean;
};

export function SceneShell({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  taskLabel = "Твоє завдання",
  showTaskHeader = true,
}: SceneShellProps) {
  const hasHeader =
    Boolean(title || description);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px]",
        "border border-slate-200/80",
        "bg-white",
        "shadow-[0_16px_46px_rgba(15,23,42,0.065)]",
        "dark:border-slate-800",
        "dark:bg-slate-950",
        className,
      )}
    >
      {showTaskHeader && hasHeader ? (
        <header className="px-5 pb-1 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <Target
              className="size-5"
              strokeWidth={2.4}
              aria-hidden="true"
            />

            <p className="text-[13px] font-black uppercase tracking-[0.055em]">
              {taskLabel}
            </p>
          </div>

          {title ? (
            <h2 className="mt-4 text-[16px] font-bold leading-6 text-slate-800 sm:text-lg dark:text-slate-100">
              {title}
            </h2>
          ) : null}

          {description ? (
            <div
              className={cn(
                "mt-3 rounded-[17px]",
                "bg-indigo-50/90",
                "px-4 py-3",
                "text-[15px] font-medium leading-6 text-indigo-950",
                "dark:bg-indigo-950/45 dark:text-indigo-100",
              )}
            >
              {description}
            </div>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "px-5 py-4.5 sm:px-7 sm:py-5",
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="px-5 pb-5 sm:px-7 sm:pb-6">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
