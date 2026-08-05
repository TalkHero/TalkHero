"use client";

import {
  useEffect,
  useState,
} from "react";

import type { KeyboardEvent } from "react";
import type { PublicQuestScene } from "@/lib/quests";

import { SceneShell } from "./SceneShell";

type TranslateSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

const MAX_LENGTH = 500;

export function TranslateScene({
  scene,
  loading = false,
  onSubmit,
}: TranslateSceneProps) {
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
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleSubmit();
    }
  }

  return (
    <SceneShell
      title={
        scene.prompt ||
        "Перекладіть фразу англійською"
      }
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
              ? "Перевірка…"
              : "Перевірити переклад"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            Завдання
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            Введіть природний англійський переклад наведеної фрази.
          </p>
        </div>

        <div>
          <label
            htmlFor={`translation-${scene.id}`}
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Ваш переклад
          </label>

          <input
            id={`translation-${scene.id}`}
            type="text"
            value={value}
            disabled={loading}
            onChange={(event) =>
              setValue(event.target.value)
            }
            onKeyDown={(event) => {
              void handleKeyDown(event);
            }}
            placeholder="Введіть відповідь англійською…"
            maxLength={MAX_LENGTH}
            autoComplete="off"
            className="min-h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />
        </div>

        <p className="text-sm text-slate-500">
          Натисніть Enter або кнопку перевірки.
        </p>
      </div>
    </SceneShell>
  );
}
