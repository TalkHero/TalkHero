"use client";

import { useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { UI_ERRORS } from "@/lib/i18n/errors";

type EnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type ProfileFormProps = {
  initialProfile: {
    fullName: string;
    nativeLanguage: string;
    targetLanguage: string;
    englishLevel: EnglishLevel;
  };
};

const LANGUAGES = [
  { value: "uk", label: "Ukrainian" },
  { value: "en", label: "English" },
  { value: "pl", label: "Polish" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
];

const LEVELS: {
  value: EnglishLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "A1",
    title: "Beginner",
    description: "Basic words and short sentences.",
  },
  {
    value: "A2",
    title: "Elementary",
    description: "Simple everyday conversations.",
  },
  {
    value: "B1",
    title: "Intermediate",
    description: "Natural conversations about familiar topics.",
  },
  {
    value: "B2",
    title: "Upper Intermediate",
    description: "Detailed conversations and varied vocabulary.",
  },
  {
    value: "C1",
    title: "Advanced",
    description: "Complex topics, idioms, and advanced grammar.",
  },
  {
    value: "C2",
    title: "Proficient",
    description: "Near-native precision, nuance, and style.",
  },
];

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfile.fullName);

  const [nativeLanguage, setNativeLanguage] = useState(
    initialProfile.nativeLanguage,
  );

  const [targetLanguage, setTargetLanguage] = useState(
    initialProfile.targetLanguage,
  );

  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>(
    initialProfile.englishLevel,
  );

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function saveProfile() {
    if (saving) {
      return;
    }

    if (!fullName.trim()) {
     setErrorMessage(UI_ERRORS.fullNameRequired);
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          nativeLanguage,
          targetLanguage,
          englishLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не вдалося оновити профіль.");
      }

      setSuccessMessage("Профіль успішно збережено.");
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Не вдалося оновити профіль.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Personal information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Emma uses this information to personalize your lessons.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>

            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              placeholder="Your full name"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="nativeLanguage"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Native language
            </label>

            <select
              id="nativeLanguage"
              value={nativeLanguage}
              onChange={(event) => {
                setNativeLanguage(event.target.value);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="targetLanguage"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Target language
            </label>

            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={(event) => {
                setTargetLanguage(event.target.value);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Рівень англійської
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Емма адаптуватиме лексику, граматику, виправлення та пояснення
до цього рівня.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((level) => {
            const isSelected = englishLevel === level.value;

            return (
              <button
                key={level.value}
                type="button"
                onClick={() => {
                  setEnglishLevel(level.value);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                className={`relative rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {level.value}
                </div>

                <p className="mt-3 font-semibold text-slate-900">
                  {level.title}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {level.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving ? "Saving..." : "Save profile"}
        </button>

        {successMessage && (
          <p className="text-sm font-medium text-emerald-600">
            {successMessage}
          </p>
        )}

        {errorMessage && (
          <p className="text-sm font-medium text-red-600">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
