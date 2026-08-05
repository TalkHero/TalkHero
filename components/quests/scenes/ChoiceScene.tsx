"use client";

import { useEffect, useState } from "react";

import type { PublicQuestScene } from "@/lib/quests";

import { SceneShell } from "./SceneShell";

type ChoiceOption = {
  id?: string;
  value?: unknown;
  label?: string;
  text?: string;
};

type ChoiceSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

export function ChoiceScene({
  scene,
  loading = false,
  onSubmit,
}: ChoiceSceneProps) {
  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const options =
    (scene.options as ChoiceOption[]) ?? [];

  useEffect(() => {
    setSelectedIndex(null);
  }, [scene.id]);

  async function handleSubmit() {
    if (
      selectedIndex === null ||
      loading
    ) {
      return;
    }

    const option = options[selectedIndex];

    if (!option) {
      return;
    }

    await onSubmit(
  option.id ??
    option.value ??
    String(selectedIndex + 1),
);
  }

  return (
    <SceneShell
      title={scene.prompt}
      description={scene.content}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            disabled={
              selectedIndex === null || loading
            }
            onClick={() => {
              void handleSubmit();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Перевірка…"
              : "Далі"}
          </button>
        </div>
      }
    >
      <div
        role="radiogroup"
        aria-label="Варіанти відповіді"
        className="space-y-3"
      >
        {options.map((option, index) => {
          const label =
            option.label ??
            option.text ??
            String(
              option.value ??
                option.id ??
                index + 1,
            );

          const active =
            selectedIndex === index;

          return (
            <button
              key={
                option.id ??
                `${scene.id}-${index}`
              }
              type="button"
              role="radio"
              aria-checked={active}
              disabled={loading}
              onClick={() =>
                setSelectedIndex(index)
              }
              className={[
                "w-full rounded-2xl border p-4 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                active
                  ? "border-indigo-600 bg-indigo-50 text-indigo-950 shadow-sm"
                  : "border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40",
                loading
                  ? "cursor-not-allowed opacity-60"
                  : "",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    active
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-slate-300 bg-white",
                  ].join(" ")}
                >
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>

                <span className="font-medium">
                  {label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </SceneShell>
  );
}
