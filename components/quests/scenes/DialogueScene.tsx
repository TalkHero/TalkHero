"use client";

import type { PublicQuestScene } from "@/lib/quests";
import {
  getNPCBySpeaker,
  type NPC,
  type NPCEmotion,
} from "@/lib/quests/npcs";

import { NPCCard } from "../NPCCard";
import { useNPCSpeech } from "../hooks/useNPCSpeech";
import { SceneShell } from "./SceneShell";

type DialogueSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onContinue: () => void;
};

const SUPPORTED_EMOTIONS: NPCEmotion[] = [
  "happy",
  "neutral",
  "thinking",
  "surprised",
  "encouraging",
  "celebrating",
];

function getMetadataString(
  metadata: PublicQuestScene["metadata"],
  key: string,
): string | null {
  const value = metadata[key];

  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : null;
}

function getMetadataEmotion(
  metadata: PublicQuestScene["metadata"],
): NPCEmotion | null {
  const value = getMetadataString(
    metadata,
    "emotion",
  );

  if (
    value &&
    SUPPORTED_EMOTIONS.includes(
      value as NPCEmotion,
    )
  ) {
    return value as NPCEmotion;
  }

  return null;
}

function createFallbackNPC(
  scene: PublicQuestScene,
): NPC {
  const speaker =
    scene.speaker?.trim() || "Оповідач";

  return {
    id: speaker
      .toLowerCase()
      .replace(/\s+/g, "-"),
    name: speaker,
    role:
      getMetadataString(
        scene.metadata,
        "role",
      ) || "Персонаж",
    avatar:
      getMetadataString(
        scene.metadata,
        "avatar",
      ) || "💬",
    emotion:
      getMetadataEmotion(scene.metadata) ||
      "neutral",
    accent: "neutral",
    voiceId: null,
    theme: "slate",
  };
}

function buildVoiceInstructions(
  npc: NPC,
  emotion: NPCEmotion,
): string {
  const accentInstruction =
    npc.accent === "british"
      ? "Use a natural British English accent."
      : npc.accent === "american"
        ? "Use a natural American English accent."
        : "Use clear neutral English pronunciation.";

  const emotionInstruction: Record<
    NPCEmotion,
    string
  > = {
    happy:
      "Sound friendly, warm, and cheerful.",
    neutral:
      "Sound calm, professional, and natural.",
    thinking:
      "Sound thoughtful and slightly slower.",
    surprised:
      "Sound pleasantly surprised.",
    encouraging:
      "Sound supportive, patient, and encouraging.",
    celebrating:
      "Sound excited and celebratory.",
  };

  return [
    accentInstruction,
    emotionInstruction[emotion],
    "Speak clearly and at a comfortable pace for an English learner.",
  ].join(" ");
}

export function DialogueScene({
  scene,
  loading = false,
  onContinue,
}: DialogueSceneProps) {
  const registeredNPC = getNPCBySpeaker(
    scene.speaker,
  );

  const npc =
    registeredNPC || createFallbackNPC(scene);

  const emotion =
    getMetadataEmotion(scene.metadata) ||
    npc.emotion;

  const speech = useNPCSpeech({
    text: scene.content,
    voice: npc.voiceId,
    instructions: buildVoiceInstructions(
      npc,
      emotion,
    ),
  });

  return (
    <SceneShell
      footer={
        <div className="space-y-3">
          {speech.error && (
            <p
              role="alert"
              className="text-sm text-red-700"
            >
              {speech.error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Голос персонажа згенерований ШІ.
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={onContinue}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Завантаження…"
                : "Продовжити"}
            </button>
          </div>
        </div>
      }
    >
      <NPCCard
        npc={npc}
        emotion={emotion}
        showListenButton={
          npc.voiceId !== null
        }
        listening={
          speech.loading || speech.playing
        }
        onListen={() => {
          void speech.play();
        }}
      >
        <p>{scene.content}</p>
      </NPCCard>
    </SceneShell>
  );
}
