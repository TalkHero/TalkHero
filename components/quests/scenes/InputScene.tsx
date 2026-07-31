"use client";

import { useState } from "react";

import type { PublicQuestScene } from "@/lib/quests";

type Props = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

const MAX_LENGTH = 1000;

export function InputScene({
  scene,
  loading = false,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");

  const trimmed = value.trim();

  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= MAX_LENGTH &&
    !loading;

  async function handleSubmit() {
    if (!canSubmit) return;

    await onSubmit(trimmed);

    setValue("");
  }

  async function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      await handleSubmit();
    }
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

      <textarea
        value={value}
        disabled={loading}
        onChange={(event) =>
          setValue(event.target.value)
        }
        onKeyDown={handleKeyDown}
        rows={6}
        placeholder="Type your answer..."
        maxLength={MAX_LENGTH}
        className="w-full rounded-xl border border-gray-300 p-4 outline-none transition focus:border-blue-500"
      />

      <div className="flex items-center justify-between">

        <span className="text-sm text-gray-500">
          {trimmed.length}/{MAX_LENGTH}
        </span>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Sending..."
            : "Send"}
        </button>

      </div>

    </div>
  );
}
