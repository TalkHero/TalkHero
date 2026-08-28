"use client";

import {
  ArrowRight,
  Loader2,
  Volume2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import type { PublicQuestScene } from "@/lib/quests";
import {
  getNPCById,
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

const AUTO_SPEECH_STORAGE_KEY =
  "talkhero-adventure-auto-speech";

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
  const [autoSpeech, setAutoSpeech] =
    useState(false);

  const [autoSpeechReady, setAutoSpeechReady] =
    useState(false);

  const lastAutoPlayedRef =
    useRef<string | null>(null);

  const metadataNpcId = getMetadataString(
    scene.metadata,
    "npcId",
  );

  const registeredNPC = metadataNpcId
    ? getNPCById(metadataNpcId)
    : getNPCBySpeaker(scene.speaker);

  const npc =
    registeredNPC ||
    createFallbackNPC(scene);

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

  /*
   * Load the saved preference only on the client.
   * Default is OFF.
   */
  useEffect(() => {
    try {
      const storedValue =
        window.localStorage.getItem(
          AUTO_SPEECH_STORAGE_KEY,
        );

      setAutoSpeech(storedValue === "true");
    } catch {
      setAutoSpeech(false);
    } finally {
      setAutoSpeechReady(true);
    }
  }, []);

  /*
   * Automatically play each new dialogue scene once.
   */
  useEffect(() => {
    if (!autoSpeechReady) {
      return;
    }

    if (!autoSpeech) {
      return;
    }

    if (!npc.voiceId) {
      return;
    }

    const autoPlayKey = [
      metadataNpcId || npc.id,
      scene.content,
    ].join("::");

    if (
      lastAutoPlayedRef.current ===
      autoPlayKey
    ) {
      return;
    }

    lastAutoPlayedRef.current =
      autoPlayKey;

    void speech.play();
  }, [
    autoSpeech,
    autoSpeechReady,
    metadataNpcId,
    npc.id,
    npc.voiceId,
    scene.content,
    speech,
  ]);

  function handleAutoSpeechChange(
    checked: boolean,
  ) {
    setAutoSpeech(checked);

    try {
      window.localStorage.setItem(
        AUTO_SPEECH_STORAGE_KEY,
        String(checked),
      );
    } catch {
      // localStorage can be unavailable in
      // restricted/private environments.
    }

    /*
     * If auto speech is enabled while the
     * current scene is already visible,
     * allow this scene to play immediately.
     */
    if (checked) {
      lastAutoPlayedRef.current = null;
    }
  }

  return (
    <SceneShell
      footer={
        <div className="space-y-3">
          {speech.error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive-soft px-3 py-2 text-sm text-red-700 dark:text-red-300"
            >
              {speech.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2
                  className="size-4"
                  aria-hidden="true"
                />

                <span>
                  Репліка персонажа озвучена
                  штучним інтелектом.
                </span>
              </div>

              {autoSpeechReady ? (
  <button
    type="button"
    onClick={() => {
      handleAutoSpeechChange(!autoSpeech);
    }}
    className="flex w-fit items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
    title="Автоматично озвучувати нові репліки персонажів"
    aria-pressed={autoSpeech}
  >
    <Volume2
      className={`h-4 w-4 ${
        autoSpeech
          ? "text-indigo-600"
          : "text-slate-400"
      }`}
      aria-hidden="true"
    />

    <span>
      Автоозвучення
    </span>

    <span
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
        autoSpeech
          ? "bg-indigo-600"
          : "bg-slate-300"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          autoSpeech
            ? "translate-x-[22px]"
            : "translate-x-0.5"
        }`}
      />
    </span>
  </button>
) : null}
            </div>

            <Button
              type="button"
              disabled={loading}
              onClick={onContinue}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Завантаження…
                </>
              ) : (
                <>
                  Продовжити
                  <ArrowRight
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>
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
          speech.loading ||
          speech.playing
        }
        onListen={() => {
          void speech.play();
        }}
      >
        <p className="whitespace-pre-line">
          {scene.content}
        </p>
      </NPCCard>
    </SceneShell>
  );
}
