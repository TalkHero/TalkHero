"use client";

import {
  useEffect,
  useState,
} from "react";

import type { KeyboardEvent } from "react";
import type { PublicQuestScene } from "@/lib/quests";

import { SceneShell } from "./SceneShell";

type InputSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

const MAX_LENGTH = 1000;

export function InputScene({
  scene,
  loading = false,
  onSubmit,
}: InputSceneProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("");
  }, [scene.id]);

  const trimmed = value.trim();

  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= MAX_LENGTH &&
    !loading;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit(trimmed);
  }

  async function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
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
    <SceneShell
      title={scene.prompt}
      description={scene.content}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500">
            {value.length} із {MAX_LENGTH} символів
          </span>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Надсилання…"
              : "Надіслати"}
          </button>
        </div>
      }
    >
      <label
        htmlFor={`quest-answer-${scene.id}`}
        className="sr-only"
      >
        Ваша відповідь
      </label>

      <textarea
        id={`quest-answer-${scene.id}`}
        value={value}
        disabled={loading}
        onChange={(event) =>
          setValue(event.target.value)
        }
        onKeyDown={(event) => {
          void handleKeyDown(event);
        }}
        rows={6}
        placeholder="Введіть відповідь…"
        maxLength={MAX_LENGTH}
        className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
      />
    </SceneShell>
  );
}
