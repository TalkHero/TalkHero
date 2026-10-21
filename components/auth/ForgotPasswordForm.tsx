"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Введіть електронну пошту.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectTo =
        `${window.location.origin}/auth/recovery`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo,
          },
        );

      if (resetError) {
        throw resetError;
      }

      setSent(true);
    } catch (resetError) {
      console.error(
        "PASSWORD RESET REQUEST ERROR:",
        resetError,
      );

      setError(
        "Не вдалося надіслати лист. Спробуйте ще раз.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
            Відновлення доступу
          </p>

          <h1 className="mt-4 text-3xl font-black text-slate-950">
            Перевірте пошту
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            Якщо обліковий запис із цією електронною
            адресою існує, ми надіслали посилання для
            встановлення нового пароля.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
            onClick={() => {
              setSent(false);
            }}
          >
            Надіслати ще раз
          </Button>

          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Повернутися до входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
          Відновлення доступу
        </p>

        <h1 className="mt-4 text-3xl font-black text-slate-950">
          Забули пароль?
        </h1>

        <p className="mt-3 leading-7 text-slate-500">
          Введіть електронну пошту вашого акаунта
          TalkHero. Ми надішлемо посилання для
          встановлення нового пароля.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label
            htmlFor="forgot-password-email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Електронна пошта
          </label>

          <input
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
            placeholder="you@example.com"
            disabled={loading}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm font-medium text-red-600"
          >
            {error}
          </p>
        )}

        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading
            ? "Надсилаємо..."
            : "Надіслати посилання"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Згадали пароль?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}