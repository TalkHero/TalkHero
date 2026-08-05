"use client";

import {
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Square,
  Waves,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import type { PublicQuestScene } from "@/lib/quests";

import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { SceneShell } from "./SceneShell";

type VoiceSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

function formatDuration(
  seconds: number,
): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

export function VoiceScene({
  scene,
  loading = false,
  onSubmit,
}: VoiceSceneProps) {
  const recorder = useVoiceRecorder();
  const [transcript, setTranscript] =
    useState("");

  useEffect(() => {
    recorder.reset();
    setTranscript("");
  }, [scene.id]);

  const busy =
    loading ||
    recorder.state === "requesting" ||
    recorder.state === "processing";

  async function handleStop() {
    const text =
      await recorder.stopAndTranscribe();

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

  return (
    <SceneShell
      title={
        scene.prompt ||
        "Дайте відповідь голосом"
      }
      description={scene.content}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Голос перетворюється на текст за допомогою ШІ.
          </p>

          <button
            type="button"
            disabled={!transcript.trim() || busy}
            onClick={() => {
              void handleSubmit();
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading
              ? "Перевірка…"
              : "Надіслати відповідь"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
            {recorder.state === "recording" ? (
              <Waves className="h-8 w-8 animate-pulse" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-950">
            {recorder.state === "recording"
              ? "Говоріть англійською"
              : recorder.state === "processing"
                ? "Розпізнавання голосу…"
                : recorder.state === "requesting"
                  ? "Підключення мікрофона…"
                  : "Запишіть свою відповідь"}
          </h3>

          {recorder.state === "recording" && (
            <p className="mt-2 font-mono text-2xl font-bold text-indigo-700">
              {formatDuration(
                recorder.durationSeconds,
              )}
            </p>
          )}

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {recorder.state === "recording" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void handleStop();
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  <Square className="h-4 w-4 fill-current" />
                  Завершити запис
                </button>

                <button
                  type="button"
                  onClick={recorder.cancel}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <MicOff className="h-4 w-4" />
                  Скасувати
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void recorder.start();
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mic className="h-4 w-4" />
                {transcript
                  ? "Записати ще раз"
                  : "Почати запис"}
              </button>
            )}
          </div>
        </section>

        {recorder.error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {recorder.error}
          </div>
        )}

        {transcript && (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Розпізнана відповідь
                </p>

                <p className="mt-2 text-lg font-medium leading-7 text-slate-950">
                  “{transcript}”
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setTranscript("");
                  recorder.reset();
                }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <RotateCcw className="h-4 w-4" />
                Очистити
              </button>
            </div>
          </section>
        )}
      </div>
    </SceneShell>
  );
}
