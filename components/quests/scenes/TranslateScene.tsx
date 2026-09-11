"use client";

import {
  ArrowRight,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  useVoiceRecorder,
} from "@/components/quests/hooks/useVoiceRecorder";

import {
  VoiceInputControls,
} from "@/components/quests/VoiceInputControls";

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
  SceneShell,
} from "./SceneShell";

type TranslateSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;

  onSubmit: (
    value: unknown,
  ) => Promise<void>;
};

const MAX_LENGTH = 500;

function getHint(
  scene: PublicQuestScene,
): string | null {
  const metadata =
    scene.metadata as Record<
      string,
      unknown
    >;

  const value =
    metadata.translationHint ??
    metadata.hint;

  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

export function TranslateScene({
  scene,
  loading = false,
  onSubmit,
}: TranslateSceneProps) {
  const [
    value,
    setValue,
  ] = useState("");

  const recorder =
    useVoiceRecorder();

  const sceneIdRef =
    useRef(scene.id);

  useEffect(() => {
    sceneIdRef.current =
      scene.id;

    setValue("");

    recorder.cancel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scene.id,
  ]);

  const trimmed =
    value.trim();

  const hint =
    getHint(scene);

  const voiceBusy =
    recorder.state ===
      "requesting" ||
    recorder.state ===
      "recording" ||
    recorder.state ===
      "processing";

  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <=
      MAX_LENGTH &&
    !loading &&
    !voiceBusy;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit(
      trimmed,
    );
  }

  async function handleKeyDown(
    event:
      KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();

      await handleSubmit();
    }
  }

  async function handleVoiceClick() {
    if (
      loading ||
      recorder.state ===
        "processing"
    ) {
      return;
    }

    if (
      recorder.state ===
      "recording"
    ) {
      const currentSceneId =
        sceneIdRef.current;

      const text =
        await recorder.stopAndTranscribe();

      if (
        !text ||
        sceneIdRef.current !==
          currentSceneId
      ) {
        return;
      }

      const voiceAnswer =
        text
          .slice(
            0,
            MAX_LENGTH,
          )
          .trim();

      if (!voiceAnswer) {
        return;
      }

      setValue(
        voiceAnswer,
      );

      return;
    }

    if (
      recorder.state ===
      "idle"
    ) {
      await recorder.start();
    }
  }

  return (
    <SceneShell
      taskLabel="Твоє завдання"
      title={
        scene.prompt ||
        "Переклади англійською:"
      }
      description={
        scene.content ||
        null
      }
      footer={
        <Button
          type="button"
          disabled={!canSubmit}
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
      <div className="space-y-3.5">
        {hint ? (
          <div
            className="
              rounded-[15px]
              bg-amber-50
              px-3.5 py-2.5
              text-sm leading-5
              text-amber-800
              dark:bg-amber-950/30
              dark:text-amber-200
            "
          >
            <span
              aria-hidden="true"
            >
              💡
            </span>{" "}
            {hint}
          </div>
        ) : null}

        <div className="relative">
          <label
            htmlFor={`translate-answer-${scene.id}`}
            className="sr-only"
          >
            Твоя відповідь
          </label>

          <input
            id={`translate-answer-${scene.id}`}
            type="text"
            value={value}
            disabled={
              loading ||
              voiceBusy
            }
            onChange={(
              event,
            ) => {
              setValue(
                event.target.value,
              );
            }}
            onKeyDown={(
              event,
            ) => {
              void handleKeyDown(
                event,
              );
            }}
            maxLength={
              MAX_LENGTH
            }
            placeholder="Напиши свою відповідь..."
            autoComplete="off"
            spellCheck
            className={cn(
              "min-h-[58px] w-full",
              "rounded-[18px]",
              "border border-slate-200",
              "bg-white",
              "px-4 pr-16",
              "text-[15px] text-slate-900",
              "outline-none transition",
              "placeholder:text-slate-400",

              "focus:border-indigo-400",
              "focus:ring-4",
              "focus:ring-indigo-100",

              "disabled:cursor-not-allowed",
              "disabled:bg-slate-50",
              "disabled:opacity-70",

              "dark:border-slate-700",
              "dark:bg-slate-950",
              "dark:text-white",
            )}
          />

          <span
            className="
              pointer-events-none
              absolute bottom-2 right-3.5
              text-[10px]
              tabular-nums
              text-slate-400
            "
          >
            {value.length}/
            {MAX_LENGTH}
          </span>
        </div>

        <VoiceInputControls
          state={
            recorder.state
          }
          durationSeconds={
            recorder.durationSeconds
          }
          error={
            recorder.error
          }
          disabled={
            loading
          }
          hasValue={Boolean(
            value,
          )}
          onClick={() => {
            void handleVoiceClick();
          }}
        />
      </div>
    </SceneShell>
  );
}
