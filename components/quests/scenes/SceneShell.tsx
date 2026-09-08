"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SceneShellProps = {
  title?: string | null;
  description?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SceneShell({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: SceneShellProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground",
        "shadow-card",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className,
      )}
    >
      {title || description ? (
        <header className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6 sm:py-5">
          {title ? (
            <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {title}
            </h2>
          ) : null}

          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "px-5 py-5 sm:px-6 sm:py-6",
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="border-t border-border bg-muted/20 px-5 py-3.5 sm:px-6 sm:py-4">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
