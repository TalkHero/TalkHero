"use client";

import {
  ArrowRight,
  Loader2,
  Mic,
  RotateCcw,
  Square,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Button,
} from "@/components/ui/button";

import type {
  PublicQuestScene,
} from "@/lib/quests";

import {
  cn,
} from "@/lib/utils";

import {
  useVoiceRecorder,
} from "../hooks/useVoiceRecorder";

import {
  SceneShell,
} from "./SceneShell";

type VoiceSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;

  onSubmit: (
    value: unknown,
  ) => Promise<void>;
};

function formatDuration(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remaining =
    seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(
      2,
      "0",
    )}`;
}

export function VoiceScene({
  scene,
  loading = false,
  onSubmit,
}: VoiceSceneProps) {
  const recorder =
    useVoiceRecorder();

  const [
    transcript,
    setTranscript,
  ] = useState("");

  useEffect(() => {
    recorder.reset();

    setTranscript("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scene.id,
  ]);

  const busy =
    loading ||
    recorder.state ===
      "requesting" ||
    recorder.state ===
      "processing";

  async function handleStop() {
    const text =
      await recorder.stopAndTranscribe();

    if (text) {
      setTranscript(text);
    }
  }

  async function handleSubmit() {
    const value =
      transcript.trim();

    if (
      !value ||
      busy
    ) {
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
      taskLabel="Твоє завдання"
      title={
        scene.prompt ||
        "Скажи відповідь англійською:"
      }
      description={
        scene.content ||
        null
      }
      footer={
        <Button
          type="button"
          disabled={
            !transcript.trim() ||
            busy
          }
          onClick={() => {
            void handleSubmit();
          }}
          className="
            min-h-[52px] w-full
            rounded-full
            text-sm font-bold
          "
        >
          {loading ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                aria-hidden="true"
              />

              Перевіряємо…
            </>
          ) : (
            <>
              Перевірити

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-4">
        <section
          className={cn(
            "rounded-[20px]",
            "border",
            "px-4 py-5",
            "text-center",

            recorder.state ===
              "recording"
              ? [
                  "border-red-200",
                  "bg-red-50",
                ]
              : [
                  "border-indigo-100",
                  "bg-indigo-50/60",
                ],
          )}
        >
          <div
            className={cn(
              "mx-auto flex size-12 items-center justify-center",
              "rounded-full",

              recorder.state ===
                "recording"
                ? "bg-red-100 text-red-600"
                : "bg-white text-indigo-600 shadow-sm",
            )}
          >
            {recorder.state ===
              "requesting" ||
            recorder.state ===
              "processing" ? (
              <Loader2
                className="size-5 animate-spin"
                aria-hidden="true"
              />
            ) : recorder.state ===
              "recording" ? (
              <Square
                className="size-4 fill-current"
                aria-hidden="true"
              />
            ) : (
              <Mic
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            {recorder.state ===
            "recording"
              ? "Говори англійською"
              : recorder.state ===
                  "processing"
                ? "Розпізнаємо голос…"
                : recorder.state ===
                    "requesting"
                  ? "Підключаємо мікрофон…"
                  : transcript
                    ? "Можеш записати ще раз"
                    : "Натисни та говори"}
          </p>

          {recorder.state ===
          "recording" ? (
            <p className="mt-1.5 font-mono text-lg font-black tabular-nums text-red-500">
              {formatDuration(
                recorder.durationSeconds,
              )}
            </p>
          ) : null}

          <div className="mt-4">
            {recorder.state ===
            "recording" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  void handleStop();
                }}
                className="rounded-full"
              >
                <Square
                  className="size-4 fill-current"
                  aria-hidden="true"
                />

                Зупинити запис
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={
                  busy
                }
                onClick={() => {
                  void recorder.start();
                }}
                className="
                  rounded-full
                  border-indigo-300
                  bg-white
                  text-indigo-600
                  hover:bg-indigo-50
                "
              >
                <Mic
                  className="size-4"
                  aria-hidden="true"
                />

                {transcript
                  ? "Записати ще раз"
                  : "Сказати голосом"}
              </Button>
            )}
          </div>
        </section>

        {recorder.error ? (
          <p
            role="alert"
            className="
              rounded-xl
              bg-red-50
              px-3 py-2
              text-sm text-red-600
              dark:bg-red-950/30
              dark:text-red-300
            "
          >
            {recorder.error}
          </p>
        ) : null}

        {transcript ? (
          <section
            className="
              rounded-[18px]
              border border-slate-200
              bg-white
              p-4
              dark:border-slate-700
              dark:bg-slate-950
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-bold uppercase
                    tracking-[0.08em]
                    text-slate-400
                  "
                >
                  Твоя відповідь
                </p>

                <p
                  className="
                    mt-2
                    whitespace-pre-line
                    text-[15px]
                    font-medium
                    leading-6
                    text-slate-800
                    dark:text-slate-100
                  "
                >
                  {transcript}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={
                  handleClear
                }
                className="
                  flex size-9 shrink-0
                  items-center justify-center
                  rounded-full
                  bg-slate-50
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  disabled:opacity-50
                  dark:bg-slate-900
                "
                aria-label="Очистити запис"
              >
                <RotateCcw
                  className="size-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </SceneShell>
  );
}
