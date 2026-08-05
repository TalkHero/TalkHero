"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { Languages, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuestScene } from "@/lib/quests";
import { cn } from "@/lib/utils";

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
    trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !loading;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit(trimmed);
  }

  async function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleSubmit();
    }
  }

  return (
    <SceneShell
      title={scene.prompt || "Перекладіть фразу англійською"}
      description={scene.content}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {value.length} із {MAX_LENGTH} символів
            </span>

            <span className="text-xs text-muted-foreground">
              Натисніть Enter або кнопку перевірки
            </span>
          </div>

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Перевіряємо…
              </>
            ) : (
              <>
                Перевірити переклад
                <Send aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200">
              <Languages className="size-5" aria-hidden="true" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-violet-800 dark:text-violet-200">
                Завдання
              </h3>

              <p className="mt-1 text-sm leading-6 text-foreground/80">
                Введіть природний англійський переклад наведеної фрази.
              </p>
            </div>
          </div>
        </section>

        <div>
          <label
            htmlFor={`translation-${scene.id}`}
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Ваш переклад
          </label>

          <input
            id={`translation-${scene.id}`}
            type="text"
            value={value}
            disabled={loading}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            onKeyDown={(event) => {
              void handleKeyDown(event);
            }}
            placeholder="Введіть відповідь англійською…"
            maxLength={MAX_LENGTH}
            autoComplete="off"
            autoCapitalize="sentences"
            spellCheck
            className={cn(
              "min-h-14 w-full rounded-xl border border-input bg-card px-4 py-3",
              "text-base text-foreground",
              "outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "placeholder:text-muted-foreground",
              "focus:border-primary focus:ring-3 focus:ring-ring/20",
              "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
            )}
          />
        </div>
      </div>
    </SceneShell>
  );
}
