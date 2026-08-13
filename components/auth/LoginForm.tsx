"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert("Не вдалося увійти через Google.");
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      alert("Введіть електронну пошту та пароль.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert("Не вдалося увійти. Перевірте електронну пошту та пароль.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
      <div>
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
          З поверненням
        </span>

        <h1 className="mt-4 text-3xl font-black text-slate-950">
          Увійти в TalkHero
        </h1>

        <p className="mt-2 leading-7 text-slate-500">
          Продовжуйте навчання з того місця, де зупинилися.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.38Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.96-.89 6.61-2.39l-3.22-2.51c-.89.6-2.03.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.6A9.99 9.99 0 0 0 12 22Z"
            />
            <path
              fill="#FBBC05"
              d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93v-2.6H3.06A9.97 9.97 0 0 0 2 12c0 1.61.39 3.14 1.06 4.53l3.33-2.6Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.61 9.61 0 0 0 12 2a9.99 9.99 0 0 0-8.94 5.47l3.33 2.6C7.18 7.7 9.39 5.94 12 5.94Z"
            />
          </svg>
          Продовжити з Google
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />

          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            або
          </span>

          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Електронна пошта
          </label>

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Пароль
          </label>

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ваш пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? "Вхід..." : "Увійти"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Ще не маєте акаунта?{" "}
          <a
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Створити акаунт
          </a>
        </p>
      </div>
    </div>
  );
}
