"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUpStartedTracked = useRef(false);

  function trackSignUpStarted() {
    if (signUpStartedTracked.current) {
      return;
    }

    signUpStartedTracked.current = true;

    trackEvent("sign_up_started", {
      method: "email",
    });
  }

  async function handleRegister() {
    if (loading) {
      return;
    }

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

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
              full_name: normalizedFullName,
            },
          },
        });

      if (error) {
        alert(
          "Не вдалося створити акаунт. Перевірте введені дані.",
        );
        return;
      }

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
          Почніть перше заняття з TalkHero вже сьогодні.
        </p>
      </div>

      <div className="mt-7 space-y-5">
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
            onFocus={trackSignUpStarted}
            onChange={(event) => {
              setFullName(event.target.value);
            }}
            placeholder="Наприклад, Андрій"
            disabled={loading}
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
            onFocus={trackSignUpStarted}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="you@example.com"
            disabled={loading}
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
            onFocus={trackSignUpStarted}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            placeholder="Щонайменше 8 символів"
            disabled={loading}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Використовуйте щонайменше 8 символів.
          </p>
        </div>

        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={loading}
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
            disabled={loading}
          >
            Увійти
          </button>
        </p>

        <p className="text-center text-xs leading-5 text-slate-400">
          Створюючи акаунт, ви погоджуєтеся з умовами
          використання TalkHero та політикою конфіденційності.
        </p>
      </div>
    </div>
  );
}
