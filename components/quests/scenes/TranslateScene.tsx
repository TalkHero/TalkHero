"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Languages,
  Loader2,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/components/quests/hooks/useVoiceRecorder";
import type { PublicQuestScene } from "@/lib/quests";
import { cn } from "@/lib/utils";
import { SceneShell } from "./SceneShell";
import { VoiceInputControls } from "@/components/quests/VoiceInputControls";

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
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
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

  const voiceButtonLabel =
    recorder.state === "requesting"
      ? "Підключення…"
      : recorder.state === "processing"
        ? "Розпізнавання…"
        : recorder.state === "recording"
          ? "Зупинити запис"
          : "Відповісти голосом";

  return (
    <SceneShell
      title={scene.prompt || "Перекладіть фразу англійською"}
      description={scene.content}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {value.length}/{MAX_LENGTH} символів
            <span className="ml-3 hidden sm:inline">
              Enter — перевірити переклад
            </span>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? (
  <>
    <Loader2
      className="mr-2 h-4 w-4 animate-spin"
      aria-hidden="true"
    />
    Перевіряємо…
  </>
) : (
  <>
    <Send
      className="mr-2 h-4 w-4"
      aria-hidden="true"
    />
    Перевірити переклад
  </>
)}

            Перевірити переклад
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              <Languages className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Завдання на переклад
              </p>

              <p className="text-sm text-muted-foreground">
                Введіть або скажіть природний англійський переклад
                наведеної фрази.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`translate-answer-${scene.id}`}
            className="text-sm font-medium"
          >
            Ваш переклад
          </label>

          <input
            id={`translate-answer-${scene.id}`}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_LENGTH}
            disabled={loading || voiceBusy}
            placeholder="Введіть або скажіть відповідь англійською…"
            autoComplete="off"
            className={cn(
              "flex h-12 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </div>

        <VoiceInputControls
  state={recorder.state}
  durationSeconds={recorder.durationSeconds}
  error={recorder.error}
  disabled={loading}
  hasValue={Boolean(value)}
  onClick={() => {
    void handleVoiceClick();
  }}
/>
      </div>
    </SceneShell>
  );
}
