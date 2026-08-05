"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Square,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuestScene } from "@/lib/quests";

import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { SceneShell } from "./SceneShell";

type VoiceSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function VoiceScene({
  scene,
  loading = false,
  onSubmit,
}: VoiceSceneProps) {
  const recorder = useVoiceRecorder();

  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    recorder.reset();
    setTranscript("");
  }, [scene.id]);

  const busy =
    loading ||
    recorder.state === "requesting" ||
    recorder.state === "processing";

  async function handleStop() {
    const text = await recorder.stopAndTranscribe();

    if (text) {
      setTranscript(text);
    }
  }

  async function handleSubmit() {
    const value = transcript.trim();

    if (!value || busy) {
      return;
    }

    await onSubmit(value);
  }

  function handleClear() {
    setTranscript("");
    recorder.reset();
  }

  return (
    <SceneShell
      title={scene.prompt || "Дайте відповідь голосом"}
      description={scene.content}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Голос перетворюється на текст за допомогою штучного інтелекту.
          </p>

          <Button
            type="button"
            disabled={!transcript.trim() || busy}
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
                Надіслати відповідь
                <Send aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-primary/15 bg-primary-soft/60 p-5 text-center sm:p-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-card text-primary shadow-sm">
            {recorder.state === "recording" ? (
              <Waves className="size-8 animate-pulse" aria-hidden="true" />
            ) : recorder.state === "processing" ||
              recorder.state === "requesting" ? (
              <Loader2 className="size-8 animate-spin" aria-hidden="true" />
            ) : (
              <Mic className="size-8" aria-hidden="true" />
            )}
          </div>

          <h3 className="mt-4 text-lg font-bold text-foreground">
            {recorder.state === "recording"
              ? "Говоріть англійською"
              : recorder.state === "processing"
                ? "Розпізнаємо голос…"
                : recorder.state === "requesting"
                  ? "Підключаємо мікрофон…"
                  : "Запишіть свою відповідь"}
          </h3>

          {recorder.state === "recording" ? (
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-primary">
              {formatDuration(recorder.durationSeconds)}
            </p>
          ) : (
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Говоріть чітко й природно. Після завершення запису ми покажемо
              розпізнаний текст.
            </p>
          )}

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {recorder.state === "recording" ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    void handleStop();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Square className="fill-current" aria-hidden="true" />
                  Завершити запис
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={recorder.cancel}
                  className="w-full sm:w-auto"
                >
                  <MicOff aria-hidden="true" />
                  Скасувати
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  void recorder.start();
                }}
                className="w-full sm:w-auto"
              >
                {busy ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Mic aria-hidden="true" />
                )}

                {transcript ? "Записати ще раз" : "Почати запис"}
              </Button>
            )}
          </div>
        </section>

        {recorder.error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive-soft p-4 text-sm text-red-700 dark:text-red-300"
          >
            {recorder.error}
          </div>
        ) : null}

        {transcript ? (
          <section className="rounded-xl border border-success/20 bg-success-soft p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
                  Розпізнана відповідь
                </p>

                <p className="mt-2 whitespace-pre-line text-lg font-medium leading-7 text-foreground">
                  “{transcript}”
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={handleClear}
                className="shrink-0"
              >
                <RotateCcw aria-hidden="true" />
                Очистити
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </SceneShell>
  );
}
