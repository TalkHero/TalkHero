"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (password.length < 8) {
      setError(
        "Пароль має містити щонайменше 8 символів.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      /*
       * Recovery flow створює тимчасову сесію.
       * Після зміни пароля завершуємо її,
       * щоб користувач увійшов уже новим паролем.
       */
      await supabase.auth.signOut();

      router.replace(
        "/login?password-reset=success",
      );
      router.refresh();
    } catch (updateError) {
      console.error(
        "PASSWORD UPDATE ERROR:",
        updateError,
      );

      setError(
        "Не вдалося змінити пароль. Посилання могло застаріти. Запросіть нове посилання для відновлення.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
          Відновлення доступу
        </p>

        <h1 className="mt-4 text-3xl font-black text-slate-950">
          Створіть новий пароль
        </h1>

        <p className="mt-3 leading-7 text-slate-500">
          Введіть новий пароль для вашого акаунта
          TalkHero.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Новий пароль
          </label>

          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            placeholder="Щонайменше 8 символів"
            disabled={loading}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-new-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Повторіть пароль
          </label>

          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(
                event.target.value,
              );
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
            placeholder="Введіть пароль ще раз"
            disabled={loading}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-medium leading-6 text-red-700">
              {error}
            </p>

            <Link
              href="/forgot-password"
              className="mt-2 inline-block text-sm font-bold text-red-700 underline underline-offset-2"
            >
              Запросити нове посилання
            </Link>
          </div>
        )}

        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading
            ? "Зберігаємо..."
            : "Зберегти новий пароль"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Повернутися до входу
          </Link>
        </p>
      </div>
    </div>
  );
}