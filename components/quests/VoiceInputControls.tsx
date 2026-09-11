"use client";

import {
  Loader2,
  Mic,
  Square,
} from "lucide-react";

import { cn } from "@/lib/utils";

type VoiceRecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "processing";

type VoiceInputControlsProps = {
  state: VoiceRecorderState;
  durationSeconds: number;
  error?: string | null;
  disabled?: boolean;
  hasValue?: boolean;
  onClick: () => void;
};

function formatDuration(
  seconds: number,
): string {
  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

export function VoiceInputControls({
  state,
  durationSeconds,
  error,
  disabled = false,
  hasValue = false,
  onClick,
}: VoiceInputControlsProps) {
  const busy =
    state === "requesting" ||
    state === "processing";

  const recording =
    state === "recording";

  const label =
    state === "requesting"
      ? "Підключаємо мікрофон…"
      : state === "processing"
        ? "Розпізнаємо голос…"
        : recording
          ? "Зупинити запис"
          : hasValue
            ? "Сказати ще раз"
            : "Сказати голосом";

  return (
    <div>
      <button
        type="button"
        disabled={
          disabled || busy
        }
        onClick={onClick}
        className={cn(
          "flex min-h-[52px] w-full items-center justify-center gap-2.5",
          "rounded-full border-[1.5px]",
          "text-sm font-bold",
          "transition-all duration-150",
          recording
            ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-indigo-300 bg-white text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/70",
          "focus-visible:outline-none",
          "focus-visible:ring-4 focus-visible:ring-indigo-100",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "dark:bg-slate-950",
        )}
      >
        {busy ? (
          <Loader2
            className="size-4.5 animate-spin"
            aria-hidden="true"
          />
        ) : recording ? (
          <Square
            className="size-4 fill-current"
            aria-hidden="true"
          />
        ) : (
          <Mic
            className="size-4.5"
            aria-hidden="true"
          />
        )}

        <span>{label}</span>

        {recording ? (
          <span className="font-mono tabular-nums">
            {formatDuration(
              durationSeconds,
            )}
          </span>
        ) : null}
      </button>

      {state === "processing" ? (
        <p className="mt-2 text-center text-xs text-slate-400">
          Перетворюємо голос на текст…
        </p>
      ) : null}

      {recording ? (
        <p className="mt-2 text-center text-xs font-medium text-red-500">
          Говори англійською
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
