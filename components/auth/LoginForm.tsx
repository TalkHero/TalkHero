"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

    trackEvent("login", {
      method: "email",
    });

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
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Електронна пошта
          </label>

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
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
            autoComplete="current-password"
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
