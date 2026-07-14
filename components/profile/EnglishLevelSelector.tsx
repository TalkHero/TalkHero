"use client";

import { useState } from "react";

type EnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type EnglishLevelSelectorProps = {
  initialLevel: EnglishLevel;
};

const LEVELS: {
  value: EnglishLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "A1",
    title: "Beginner",
    description: "Basic words and simple sentences.",
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
    description: "Complex topics, idioms, and advanced vocabulary.",
  },
  {
    value: "C2",
    title: "Proficient",
    description: "Near-native precision, nuance, and style.",
  },
];

export function EnglishLevelSelector({
  initialLevel,
}: EnglishLevelSelectorProps) {
  const [selectedLevel, setSelectedLevel] =
    useState<EnglishLevel>(initialLevel);

  const [savedLevel, setSavedLevel] =
    useState<EnglishLevel>(initialLevel);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveLevel() {
    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/english-level", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          englishLevel: selectedLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update English level",
        );
      }

      setSavedLevel(selectedLevel);
      setMessage("English level saved successfully.");
    } catch (error) {
      console.error("SAVE ENGLISH LEVEL ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save English level.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = selectedLevel !== savedLevel;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          English level
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Emma will automatically adapt vocabulary, grammar,
          corrections, and explanations to your level.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((level) => {
          const isSelected = selectedLevel === level.value;

          return (
            <button
              key={level.value}
              type="button"
              onClick={() => {
                setSelectedLevel(level.value);
                setMessage("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {level.value}
                </div>

                <div>
                  <p className="font-medium text-slate-900">
                    {level.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {level.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveLevel}
          disabled={saving || !hasChanges}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save level"}
        </button>

        {message && (
          <p className="text-sm text-slate-600">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
