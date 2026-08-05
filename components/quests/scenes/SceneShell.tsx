"use client";

import type { ReactNode } from "react";

type SceneShellProps = {
  title?: string | null;
  description?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

export function SceneShell({
  title,
  description,
  children,
  footer,
}: SceneShellProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {(title || description) && (
        <header className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-5 sm:px-8">
          {title && (
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-2 leading-7 text-slate-600">
              {description}
            </p>
          )}
        </header>
      )}

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {children}
      </div>

      {footer && (
        <footer className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8">
          {footer}
        </footer>
      )}
    </section>
  );
}
