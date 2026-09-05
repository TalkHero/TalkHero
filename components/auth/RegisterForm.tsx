"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  const signUpStartedTracked =
    useRef(false);

  function trackSignUpStarted(
    method: "email" | "google",
  ) {
    if (signUpStartedTracked.current) {
      return;
    }

    signUpStartedTracked.current = true;

    trackEvent("sign_up_started", {
      method,
    });
  }

  async function handleGoogleRegister() {
    if (googleLoading) {
      return;
    }

    trackSignUpStarted("google");

    setGoogleLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (error) {
        alert(
          "Не вдалося продовжити реєстрацію через Google.",
        );

        setGoogleLoading(false);
      }
    } catch (error) {
      console.error(
        "GOOGLE REGISTER ERROR:",
        error,
      );

      alert(
        "Не вдалося продовжити реєстрацію через Google.",
      );

      setGoogleLoading(false);
    }
  }

  async function handleRegister() {
    if (loading) {
      return;
    }

    const normalizedFullName =
      fullName.trim();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password ||
      !normalizedFullName
    ) {
      alert("Заповніть усі поля.");
      return;
    }

    if (password.length < 8) {
      alert(
        "Пароль має містити щонайменше 8 символів.",
      );

      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name:
                normalizedFullName,
            },
          },
        });

      if (error) {
        alert(
          "Не вдалося створити акаунт. Перевірте введені дані.",
        );

        return;
      }

      /*
       * sign_up відправляємо лише після
       * успішної відповіді Supabase.
       *
       * Google OAuth тут не відстежуємо,
       * оскільки запуск OAuth ще не означає
       * завершену реєстрацію.
       */
      trackEvent("sign_up", {
        method: "email",
      });

      if (data.session) {
        router.push("/dashboard");
        router.refresh();

        return;
      }

      alert(
        "Акаунт створено. Увійдіть у свій профіль.",
      );

      router.push("/login");
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error,
      );

      alert(
        "Не вдалося створити акаунт. Спробуйте ще раз.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
      <div>
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
          Безкоштовний старт
        </span>

        <h1 className="mt-4 text-3xl font-black text-slate-950">
          Створіть акаунт
        </h1>

        <p className="mt-2 leading-7 text-slate-500">
          Почніть перше заняття з
          TalkHero вже сьогодні.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            void handleGoogleRegister();
          }}
          disabled={
            loading ||
            googleLoading
          }
        >
          {googleLoading
            ? "Підключаємо Google..."
            : "Продовжити через Google"}
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />

          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            або
          </span>

          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div>
          <label
            htmlFor="register-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Ваше ім&apos;я
          </label>

          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onFocus={() => {
              trackSignUpStarted("email");
            }}
            onChange={(event) => {
              setFullName(
                event.target.value,
              );
            }}
            placeholder="Наприклад, Андрій"
            disabled={
              loading ||
              googleLoading
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Електронна пошта
          </label>

          <input
            id="register-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onFocus={() => {
              trackSignUpStarted("email");
            }}
            onChange={(event) => {
              setEmail(
                event.target.value,
              );
            }}
            placeholder="you@example.com"
            disabled={
              loading ||
              googleLoading
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Пароль
          </label>

          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onFocus={() => {
              trackSignUpStarted("email");
            }}
            onChange={(event) => {
              setPassword(
                event.target.value,
              );
            }}
            placeholder="Щонайменше 8 символів"
            disabled={
              loading ||
              googleLoading
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Використовуйте щонайменше
            8 символів.
          </p>
        </div>

        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={
            loading ||
            googleLoading
          }
          onClick={() => {
            void handleRegister();
          }}
        >
          {loading
            ? "Створюємо акаунт..."
            : "Створити акаунт"}
        </Button>

        <p className="text-center text-sm leading-6 text-slate-500">
          Уже маєте акаунт?{" "}
          <button
            type="button"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700"
            onClick={() => {
              router.push("/login");
            }}
            disabled={
              loading ||
              googleLoading
            }
          >
            Увійти
          </button>
        </p>

        <p className="text-center text-xs leading-5 text-slate-400">
          Створюючи акаунт, ви
          погоджуєтеся з умовами
          використання TalkHero та
          політикою конфіденційності.
        </p>
      </div>
    </div>
  );
}
