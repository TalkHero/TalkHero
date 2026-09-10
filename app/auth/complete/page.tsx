"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { trackEvent } from "@/lib/analytics";

export default function AuthCompletePage() {
  const router = useRouter();

  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;

    const searchParams =
      new URLSearchParams(
        window.location.search,
      );

    let next =
      searchParams.get("next") ??
      "/dashboard";

    if (!next.startsWith("/")) {
      next = "/dashboard";
    }

    trackEvent("sign_up", {
      method: "google",
    });

    /*
     * Даємо GTM / GA4 короткий час,
     * щоб обробити dataLayer event
     * перед переходом на dashboard.
     */
    const timeout =
      window.setTimeout(() => {
        router.replace(next);
      }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

        <p className="mt-4 text-sm font-medium text-slate-600">
          Завершуємо створення акаунта...
        </p>
      </div>
    </main>
  );
}
