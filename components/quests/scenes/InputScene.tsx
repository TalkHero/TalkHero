"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Mic,
  Send,
  Square,
} from "lucide-react";

import { useVoiceRecorder } from "@/components/quests/hooks/useVoiceRecorder";
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
  const recorder = useVoiceRecorder();
  const sceneIdRef = useRef(scene.id);

  useEffect(() => {
    sceneIdRef.current = scene.id;
    setValue("");
    recorder.cancel();

    // Скидаємо голосовий запис лише при зміні сцени.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  const trimmed = value.trim();

  const voiceBusy =
    recorder.state === "requesting" ||
    recorder.state === "recording" ||
    recorder.state === "processing";

  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= MAX_LENGTH &&
    !loading &&
    !voiceBusy;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit(trimmed);
  }

  async function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSubmit();
    }
  }

  async function handleVoiceClick() {
  if (loading || recorder.state === "processing") {
    return;
  }

  if (recorder.state === "recording") {
    const currentSceneId = sceneIdRef.current;

    const text = await recorder.stopAndTranscribe();

    if (!text || sceneIdRef.current !== currentSceneId) {
      return;
    }

    const voiceAnswer = text.slice(0, MAX_LENGTH).trim();

    if (!voiceAnswer) {
      return;
    }

    // Голос лише заповнює поле.
    // Користувач може відредагувати текст перед надсиланням.
    setValue(voiceAnswer);

    return;
  }

  if (recorder.state === "idle") {
    await recorder.start();
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
                <Loader2
                  className="animate-spin"
                  aria-hidden="true"
                />
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
        disabled={loading || voiceBusy}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        onKeyDown={(event) => {
          void handleKeyDown(event);
        }}
        rows={6}
        placeholder="Введіть або скажіть відповідь англійською…"
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={
            recorder.state === "recording"
              ? "destructive"
              : "outline"
          }
          disabled={
            loading ||
            recorder.state === "requesting" ||
            recorder.state === "processing"
          }
          onClick={() => {
            void handleVoiceClick();
          }}
          className="gap-2"
        >
          {recorder.state === "requesting" ||
          recorder.state === "processing" ? (
            <Loader2
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : recorder.state === "recording" ? (
            <Square
              className="h-4 w-4"
              aria-hidden="true"
            />
          ) : (
            <Mic
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}

          {recorder.state === "requesting"
            ? "Підключення…"
            : recorder.state === "processing"
              ? "Розпізнавання…"
              : recorder.state === "recording"
                ? "Зупинити запис"
                : "Відповісти голосом"}
        </Button>

        <span className="text-xs text-muted-foreground">
          {recorder.state === "recording"
            ? `Запис: ${recorder.durationSeconds} с`
            : recorder.state === "processing"
              ? "Перетворюємо голос на текст…"
              : "Можна писати або говорити"}
        </span>
      </div>

      {recorder.error && (
        <p
          role="alert"
          className="mt-2 text-sm text-destructive"
        >
          {recorder.error}
        </p>
      )}

      {value && (
        <p className="mt-2 text-xs text-muted-foreground">
          Розпізнаний текст можна відредагувати перед
          надсиланням.
        </p>
      )}
    </SceneShell>
  );
}
