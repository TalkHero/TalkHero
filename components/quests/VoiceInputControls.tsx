"use client";

import {
  Loader2,
  Mic,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

  const recording = state === "recording";

  const label =
    state === "requesting"
      ? "Підключення…"
      : state === "processing"
        ? "Розпізнавання…"
        : recording
          ? "Зупинити запис"
          : "Відповісти голосом";

  const status =
    recording
      ? `Запис: ${durationSeconds} с`
      : state === "processing"
        ? "Перетворюємо голос на текст…"
        : "Можна писати або говорити";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={recording ? "destructive" : "outline"}
          disabled={disabled || busy}
          onClick={onClick}
          className="gap-2"
        >
          {busy ? (
            <Loader2
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : recording ? (
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

          {label}
        </Button>

        <span className="text-xs text-muted-foreground">
          {status}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {hasValue ? (
        <p className="text-xs text-muted-foreground">
          Розпізнаний текст можна відредагувати перед надсиланням.
        </p>
      ) : null}
    </div>
  );
}
