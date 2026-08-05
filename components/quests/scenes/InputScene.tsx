"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuestScene } from "@/lib/quests";
import { cn } from "@/lib/utils";

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
    trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !loading;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit(trimmed);
  }

  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
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
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {value.length} із {MAX_LENGTH} символів
            </span>

            <span className="text-xs text-muted-foreground">
              Enter — надіслати, Shift + Enter — новий рядок
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
                Надсилання…
              </>
            ) : (
              <>
                Надіслати відповідь
                <Send aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <label
        htmlFor={`quest-answer-${scene.id}`}
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        Ваша відповідь
      </label>

      <textarea
        id={`quest-answer-${scene.id}`}
        value={value}
        disabled={loading}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        onKeyDown={(event) => {
          void handleKeyDown(event);
        }}
        rows={6}
        placeholder="Введіть відповідь англійською…"
        maxLength={MAX_LENGTH}
        className={cn(
          "min-h-40 w-full resize-y rounded-xl border border-input bg-card p-4",
          "text-base leading-7 text-foreground",
          "outline-none transition-[border-color,box-shadow,background-color] duration-150",
          "placeholder:text-muted-foreground",
          "focus:border-primary focus:ring-3 focus:ring-ring/20",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
        )}
      />
    </SceneShell>
  );
}
