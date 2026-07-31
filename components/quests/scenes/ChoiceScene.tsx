"use client";

import { useState } from "react";

import type { PublicQuestScene } from "@/lib/quests";

type ChoiceOption = {
  id?: string;
  value?: string;
  label?: string;
  text?: string;
};

type Props = {
  scene: PublicQuestScene;
  loading?: boolean;

  onSubmit: (
    value: unknown,
  ) => Promise<void>;
};

export function ChoiceScene({
  scene,
  loading = false,
  onSubmit,
}: Props) {
  const [selected, setSelected] =
    useState<string | null>(null);

  const options = (
    scene.options as ChoiceOption[]
  ) ?? [];

  async function handleSubmit() {
    if (!selected || loading) {
      return;
    }

    await onSubmit(selected);
  }

  return (
    <div className="space-y-6">

      <div>

        <h2 className="text-xl font-semibold">
          {scene.prompt}
        </h2>

        {scene.content && (
          <p className="mt-2 text-gray-600">
            {scene.content}
          </p>
        )}

      </div>

      <div className="space-y-3">

        {options.map((option, index) => {
          const value =
            option.value ??
            option.id ??
            String(index);

          const label =
            option.label ??
            option.text ??
            value;

          const active =
            selected === value;

          return (
            <button
              key={value}
              type="button"
              disabled={loading}
              onClick={() =>
                setSelected(value)
              }
              className={[
                "w-full rounded-xl border p-4 text-left transition",
                active
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}

      </div>

      <button
        type="button"
        disabled={
          !selected || loading
        }
        onClick={handleSubmit}
        className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
      >
        {loading
          ? "Checking..."
          : "Continue"}
      </button>

    </div>
  );
}
