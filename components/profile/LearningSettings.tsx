"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Info,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";

type EnglishLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

type UpdatedProfile = {
  id: string;
  fullName: string | null;
  nativeLanguage: string | null;
  targetLanguage: string | null;
  englishLevel: string;
};

type LearningSettingsProps = {
  initialFullName: string | null;
  initialNativeLanguage: string | null;
  initialTargetLanguage: string | null;
  initialEnglishLevel: string;
  onSaved?: (profile: UpdatedProfile) => void;
};

type UpdateProfileSuccessResponse = {
  success: true;
  profile: UpdatedProfile;
};

type ApiErrorResponse = {
  error?: string;
};

const NATIVE_LANGUAGE = "uk";
const TARGET_LANGUAGE = "en";

const englishLevelOptions: {
  value: EnglishLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "A1",
    label: "A1 — Початковий",
    description:
      "Розумію окремі слова та дуже прості фрази.",
  },
  {
    value: "A2",
    label: "A2 — Базовий",
    description:
      "Можу спілкуватися у простих повсякденних ситуаціях.",
  },
  {
    value: "B1",
    label: "B1 — Середній",
    description:
      "Можу підтримувати розмову на знайомі теми.",
  },
  {
    value: "B2",
    label: "B2 — Вище середнього",
    description:
      "Можу детально висловлювати думки та аргументи.",
  },
  {
    value: "C1",
    label: "C1 — Просунутий",
    description:
      "Вільно спілкуюся на складні професійні теми.",
  },
  {
    value: "C2",
    label: "C2 — Вільне володіння",
    description:
      "Розумію майже все та точно передаю відтінки значення.",
  },
];

function normalizeEnglishLevel(
  value: string,
): EnglishLevel {
  const normalized = value.trim().toUpperCase();

  if (
    normalized === "A1" ||
    normalized === "A2" ||
    normalized === "B1" ||
    normalized === "B2" ||
    normalized === "C1" ||
    normalized === "C2"
  ) {
    return normalized;
  }

  return "A1";
}

export function LearningSettings({
  initialFullName,
  initialEnglishLevel,
  onSaved,
}: LearningSettingsProps) {
  const [fullName, setFullName] = useState(
    initialFullName?.trim() ?? "",
  );

  const [englishLevel, setEnglishLevel] =
    useState<EnglishLevel>(
      normalizeEnglishLevel(initialEnglishLevel),
    );

  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    setFullName(initialFullName?.trim() ?? "");

    setEnglishLevel(
      normalizeEnglishLevel(initialEnglishLevel),
    );
  }, [initialEnglishLevel, initialFullName]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
      setSuccessMessage(null);
      setErrorMessage("Вкажіть ваше ім’я.");

      return;
    }

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: trimmedFullName,
          nativeLanguage: NATIVE_LANGUAGE,
          targetLanguage: TARGET_LANGUAGE,
          englishLevel,
        }),
      });

      const responseData = (await response.json()) as
        | UpdateProfileSuccessResponse
        | ApiErrorResponse;

      if (
        !response.ok ||
        !("profile" in responseData)
      ) {
        throw new Error(
          "error" in responseData &&
            typeof responseData.error === "string"
            ? responseData.error
            : "Не вдалося зберегти налаштування.",
        );
      }

      setFullName(
        responseData.profile.fullName ??
          trimmedFullName,
      );

      setEnglishLevel(
        normalizeEnglishLevel(
          responseData.profile.englishLevel,
        ),
      );

      setSuccessMessage(
        "Налаштування збережено. Емма використовуватиме українську для пояснень і англійську для навчання.",
      );

      onSaved?.(responseData.profile);
    } catch (error) {
      console.error(
        "SAVE LEARNING SETTINGS ERROR:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти налаштування.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <BookOpen className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">
              AI-викладач
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Налаштування навчання
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Emma використовує ці дані, щоб
              адаптувати складність діалогів,
              виправлень і навчальних завдань.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 px-6 py-6 sm:px-8 sm:py-8"
      >
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
          >
            <UserRound className="h-4 w-4 text-indigo-600" />
            Ваше ім’я
          </label>

          <input
            id="fullName"
            name="fullName"
            type="text"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);

              if (errorMessage) {
                setErrorMessage(null);
              }

              if (successMessage) {
                setSuccessMessage(null);
              }
            }}
            maxLength={100}
            autoComplete="name"
            placeholder="Наприклад, Іван"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Рідна мова
            </p>

            <div className="mt-4 flex items-start gap-4">
              <span
                aria-hidden="true"
                className="text-3xl"
              >
                🇺🇦
              </span>

              <div>
                <p className="text-base font-black text-slate-950">
                  Українська
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Граматичні пояснення, підказки та
                  коментарі Emma надає українською
                  мовою.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Мова навчання
            </p>

            <div className="mt-4 flex items-start gap-4">
              <span
                aria-hidden="true"
                className="text-3xl"
              >
                🇬🇧
              </span>

              <div>
                <p className="text-base font-black text-slate-950">
                  Англійська
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Діалоги, вправи, приклади,
                  словниковий запас і speaking-завдання
                  будуть англійською.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

          <p className="text-sm leading-6 text-indigo-800">
            Зараз TalkHero підтримує навчання
            англійської для україномовних
            користувачів. Інші рідні мови та мови
            навчання з’являться після релізу.
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-bold text-slate-800">
            Рівень англійської
          </legend>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Рівень визначає складність відповідей,
            вправ і поточний урок навчальної програми.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {englishLevelOptions.map(
              (levelOption) => {
                const isSelected =
                  englishLevel ===
                  levelOption.value;

                return (
                  <label
                    key={levelOption.value}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="englishLevel"
                      value={levelOption.value}
                      checked={isSelected}
                      onChange={() => {
                        setEnglishLevel(
                          levelOption.value,
                        );

                        if (errorMessage) {
                          setErrorMessage(null);
                        }

                        if (successMessage) {
                          setSuccessMessage(null);
                        }
                      }}
                      className="sr-only"
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-sm font-black ${
                            isSelected
                              ? "text-indigo-700"
                              : "text-slate-900"
                          }`}
                        >
                          {levelOption.label}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {
                            levelOption.description
                          }
                        </p>
                      </div>

                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : null}
                      </span>
                    </div>
                  </label>
                );
              },
            )}
          </div>
        </fieldset>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{successMessage}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Зміни рівня застосовуються до наступних
            повідомлень і нових навчальних завдань.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Збереження...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Зберегти налаштування
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
