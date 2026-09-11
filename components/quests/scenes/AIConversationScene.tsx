"use client";

import type {
  KeyboardEvent,
} from "react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  Loader2,
} from "lucide-react";

import {
  AIFeedbackCard,
} from "@/components/quests/AIFeedbackCard";

import {
  NPCCard,
} from "@/components/quests/NPCCard";

import {
  useNPCSpeech,
} from "@/components/quests/hooks/useNPCSpeech";

import {
  useVoiceRecorder,
} from "@/components/quests/hooks/useVoiceRecorder";

import {
  VoiceInputControls,
} from "@/components/quests/VoiceInputControls";

import { Button } from "@/components/ui/button";

import type {
  PublicQuestScene,
  QuestSceneEvaluation,
} from "@/lib/quests";

import {
  getNPCById,
  getNPCBySpeaker,
  type NPC,
  type NPCEmotion,
} from "@/lib/quests/npcs";

import { cn } from "@/lib/utils";

import { SceneShell } from "./SceneShell";

type Props = {
  scene: PublicQuestScene;

  evaluation:
    | QuestSceneEvaluation
    | null;

  loading?: boolean;

  onSubmit: (
    value: unknown,
  ) => Promise<void>;
};

const MAX_LENGTH = 500;

function getString(
  metadata: Record<
    string,
    unknown
  >,
  key: string,
): string | null {
  const value =
    metadata[key];

  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function getNumber(
  metadata:
    | Record<
        string,
        unknown
      >
    | undefined,
  key: string,
): number | null {
  const value =
    metadata?.[key];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}

function createFallbackNPC(
  scene: PublicQuestScene,
): NPC {
  const speaker =
    scene.speaker?.trim() ||
    "Персонаж";

  return {
    id: speaker
      .toLowerCase()
      .replace(/\s+/g, "-"),

    name: speaker,

    role:
      getString(
        scene.metadata,
        "role",
      ) ||
      "Співрозмовник",

    avatar:
      getString(
        scene.metadata,
        "avatar",
      ) || "💬",

    emotion: "happy",
    accent: "neutral",
    voiceId: null,
    theme: "slate",
  };
}

function buildVoiceInstructions(
  npc: NPC,
): string {
  return [
    npc.accent === "british"
      ? "Use a natural British English accent."
      : npc.accent ===
          "american"
        ? "Use a natural American English accent."
        : "Use clear neutral English pronunciation.",

    "Sound friendly, natural and conversational.",

    "Speak clearly and at a comfortable pace for an English learner.",
  ].join(" ");
}

export function AIConversationScene({
  scene,
  evaluation,
  loading = false,
  onSubmit,
}: Props) {
  const [value, setValue] =
    useState("");

  const recorder =
    useVoiceRecorder();

  const sceneIdRef =
    useRef(scene.id);

  const currentTurn =
    getNumber(
      evaluation?.metadata,
      "currentTurn",
    );

  const maxTurns =
    getNumber(
      evaluation?.metadata,
      "maxTurns",
    ) ??
    (typeof scene.metadata
      .maxTurns === "number"
      ? scene.metadata
          .maxTurns
      : 4);

  const metadataNpcId =
    getString(
      scene.metadata,
      "npcId",
    );

  const npc =
    (metadataNpcId
      ? getNPCById(
          metadataNpcId,
        )
      : getNPCBySpeaker(
          scene.speaker,
        )) ||
    createFallbackNPC(scene);

  const npcReply =
    getString(
      evaluation?.metadata ??
        {},
      "npcReply",
    );

  const displayedReply =
    npcReply ||
    scene.content;

  const speech =
    useNPCSpeech({
      text: displayedReply,
      voice: npc.voiceId,
      instructions:
        buildVoiceInstructions(
          npc,
        ),
    });

  useEffect(() => {
    sceneIdRef.current =
      scene.id;

    setValue("");
    recorder.cancel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scene.id,
    currentTurn,
  ]);

  const trimmed =
    value.trim();

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

    await onSubmit(trimmed);
  }

  async function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
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
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-400">
        <span>
          Живий діалог
        </span>

        <span>
          Репліка{" "}
          {currentTurn ?? 1} з{" "}
          {maxTurns}
        </span>
      </div>

      <NPCCard
        npc={npc}
        emotion={
          npc.emotion as NPCEmotion
        }
        showListenButton={
          npc.voiceId !== null
        }
        listening={
          speech.loading ||
          speech.playing
        }
        onListen={() => {
          void speech.play();
        }}
      >
        {displayedReply}
      </NPCCard>

      {evaluation?.feedback ? (
        <AIFeedbackCard
          feedback={
            evaluation.feedback
          }
          isCorrect={
            evaluation.isCorrect
          }
          grade={
            evaluation.grade
          }
          userAnswer={
            null
          }
          scene={scene}
          suggestedAnswer={
            getString(
              evaluation.metadata,
              "suggestedAnswer",
            )
          }
        />
      ) : null}

      <SceneShell
        taskLabel="Твоя черга"
        title={
          scene.prompt ||
          `Відповідай ${npc.name} англійською`
        }
        showTaskHeader
        footer={
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
            className="min-h-[52px] w-full rounded-full text-sm font-bold"
          >
            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  aria-hidden="true"
                />

                Надсилаємо…
              </>
            ) : (
              <>
                Відповісти

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
          <div className="relative">
            <textarea
              id={`ai-conversation-${scene.id}`}
              value={value}
              disabled={
                loading ||
                voiceBusy
              }
              onChange={(
                event,
              ) => {
                setValue(
                  event.target
                    .value,
                );
              }}
              onKeyDown={(
                event,
              ) => {
                void handleKeyDown(
                  event,
                );
              }}
              rows={3}
              maxLength={
                MAX_LENGTH
              }
              placeholder={`Напиши відповідь для ${npc.name}...`}
              className={cn(
                "min-h-[108px] w-full resize-none",
                "rounded-[18px]",
                "border border-slate-200",
                "bg-white",
                "px-4 pb-8 pt-3.5",
                "text-[15px] leading-6 text-slate-900",
                "outline-none transition",
                "placeholder:text-slate-400",
                "focus:border-indigo-400",
                "focus:ring-4 focus:ring-indigo-100",
                "disabled:bg-slate-50 disabled:opacity-70",
                "dark:border-slate-700 dark:bg-slate-950 dark:text-white",
              )}
            />

            <span className="absolute bottom-2.5 right-3.5 text-[10px] text-slate-400">
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
            disabled={loading}
            hasValue={Boolean(
              value,
            )}
            onClick={() => {
              void handleVoiceClick();
            }}
          />
        </div>
      </SceneShell>
    </div>
  );
}
