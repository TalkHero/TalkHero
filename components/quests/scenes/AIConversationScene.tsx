"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";

import { AIFeedbackCard } from "@/components/quests/AIFeedbackCard";
import { NPCCard } from "@/components/quests/NPCCard";
import { useVoiceRecorder } from "@/components/quests/hooks/useVoiceRecorder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicQuestScene, QuestSceneEvaluation } from "@/lib/quests";
import {
  getNPCById,
  getNPCBySpeaker,
  type NPC,
} from "@/lib/quests/npcs";
import { cn } from "@/lib/utils";

import { SceneShell } from "./SceneShell";
import { useNPCSpeech } from "@/components/quests/hooks/useNPCSpeech";
import { VoiceInputControls } from "@/components/quests/VoiceInputControls";
type Props = {
  scene: PublicQuestScene;
  evaluation: QuestSceneEvaluation | null;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

const MAX_LENGTH = 500;

const AUTO_SPEECH_STORAGE_KEY =
  "talkhero-adventure-auto-speech";

function buildVoiceInstructions(npc: NPC): string {
  const accentInstruction =
    npc.accent === "british"
      ? "Use a natural British English accent."
      : npc.accent === "american"
        ? "Use a natural American English accent."
        : "Use clear neutral English pronunciation.";

  const emotionInstruction = {
    happy: "Sound friendly, warm, and cheerful.",
    neutral: "Sound calm, professional, and natural.",
    thinking: "Sound thoughtful and slightly slower.",
    surprised: "Sound pleasantly surprised.",
    encouraging:
      "Sound supportive, patient, and encouraging.",
    celebrating: "Sound excited and celebratory.",
  }[npc.emotion];

  return [
    accentInstruction,
    emotionInstruction,
    "Speak clearly and at a comfortable pace for an English learner.",
  ].join(" ");
}

function getString(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEvalString(
  evaluation: QuestSceneEvaluation | null,
  key: string,
): string | null {
  const value = evaluation?.metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEvalNumber(
  evaluation: QuestSceneEvaluation | null,
  key: string,
): number | null {
  const value = evaluation?.metadata?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fallbackNPC(scene: PublicQuestScene): NPC {
  const speaker = scene.speaker?.trim() || "Персонаж";

  return {
    id: speaker.toLowerCase().replace(/\s+/g, "-"),
    name: speaker,
    role: getString(scene.metadata, "role") || "Співрозмовник",
    avatar: getString(scene.metadata, "avatar") || "💬",
    emotion: "happy",
    accent: "neutral",
    voiceId: null,
    theme: "slate",
  };
}

export function AIConversationScene({
  scene,
  evaluation,
  loading = false,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");

  const [autoSpeech, setAutoSpeech] = useState(false);
const [autoSpeechReady, setAutoSpeechReady] =
  useState(false);

const lastAutoPlayedRef =
  useRef<string | null>(null);

  const recorder = useVoiceRecorder();

  const sceneIdRef = useRef(scene.id);
  const turnRef = useRef<number | null>(null);

const metadataNpcId =
  getString(scene.metadata, "npcId");

const npc =
  (metadataNpcId
    ? getNPCById(metadataNpcId)
    : null) ??
  getNPCBySpeaker(scene.speaker) ??
  fallbackNPC(scene);

const npcReply =
  getEvalString(evaluation, "npcReply");

const npcSpeechText =
  npcReply || scene.content;

const speech = useNPCSpeech({
  text: npcSpeechText,
  voice: npc.voiceId,
  instructions: buildVoiceInstructions(npc),
});

  const currentTurn = getEvalNumber(evaluation, "currentTurn");

  const metadataMaxTurns =
    typeof scene.metadata.maxTurns === "number" ? scene.metadata.maxTurns : 4;

  const maxTurns = getEvalNumber(evaluation, "maxTurns") ?? metadataMaxTurns;

  useEffect(() => {
  try {
    setAutoSpeech(
      window.localStorage.getItem(
        AUTO_SPEECH_STORAGE_KEY,
      ) === "true",
    );
  } catch {
    setAutoSpeech(false);
  } finally {
    setAutoSpeechReady(true);
  }
}, []);

useEffect(() => {
  if (
    !autoSpeechReady ||
    !autoSpeech ||
    !npc.voiceId ||
    !npcSpeechText.trim()
  ) {
    return;
  }

  const autoPlayKey = [
    scene.id,
    metadataNpcId || npc.id,
    currentTurn ?? 0,
    npcSpeechText,
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
  currentTurn,
  metadataNpcId,
  npc.id,
  npc.voiceId,
  npcSpeechText,
  scene.id,
  speech.play,
]);

  useEffect(() => {
    sceneIdRef.current = scene.id;
    turnRef.current = currentTurn;

    setValue("");
    recorder.cancel();

    // Скидаємо голосовий запис при зміні сцени або репліки.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id, currentTurn]);

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

  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
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
      const currentConversationTurn = turnRef.current;

      const text = await recorder.stopAndTranscribe();

      if (
  !text ||
  sceneIdRef.current !== currentSceneId ||
  turnRef.current !== currentConversationTurn
) {
  return;
}

const voiceAnswer = text.slice(0, MAX_LENGTH).trim();

if (!voiceAnswer) {
  return;
}

setValue(voiceAnswer);

return;
    }

    if (recorder.state === "idle") {
      await recorder.start();
    }
  }

  return (
    <SceneShell
      title={scene.prompt || "Поговоріть із персонажем"}
      description={getString(scene.metadata, "conversationHint")}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Діалог і навчальний відгук створюються за допомогою штучного
            інтелекту.
          </p>

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
            className="w-full sm:w-auto"
          >
            {loading ? (
  <>
    <Loader2
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    />
    {npc.name} відповідає…
  </>
) : (
  <>
    <Send
      className="h-4 w-4"
      aria-hidden="true"
    />
    Надіслати
  </>
)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-800 dark:text-violet-200">
            <Sparkles className="size-4" aria-hidden="true" />
            Живий діалог
          </div>

          <Badge variant="outline">
            Репліка {currentTurn ?? 1} із {maxTurns}
          </Badge>
        </div>

        <NPCCard
  npc={npc}
  showListenButton={npc.voiceId !== null}
  listening={speech.loading || speech.playing}
  onListen={() => {
    void speech.play();
  }}
>
  <p className="whitespace-pre-line">
    {npcSpeechText}
  </p>
</NPCCard>

{speech.error ? (
  <p
    role="alert"
    className="text-sm text-destructive"
  >
    {speech.error}
  </p>
) : null}

        {evaluation?.feedback ? (
          <AIFeedbackCard
            feedback={evaluation.feedback}
            isCorrect={evaluation.isCorrect}
            grade={evaluation.grade}
          />
        ) : null}

        <div>
          <label
            htmlFor={`ai-conversation-${scene.id}`}
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <MessageCircle className="size-4 text-primary" aria-hidden="true" />
            Ваша відповідь англійською
          </label>

          <textarea
            id={`ai-conversation-${scene.id}`}
            value={value}
            disabled={loading || voiceBusy}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            onKeyDown={(event) => {
              void handleKeyDown(event);
            }}
            rows={3}
            maxLength={MAX_LENGTH}
            placeholder={`Напишіть або скажіть відповідь для ${npc.name}…`}
            className={cn(
              "min-h-28 w-full resize-y rounded-xl border border-input bg-card p-4",
              "text-base leading-7 text-foreground",
              "outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "placeholder:text-muted-foreground",
              "focus:border-primary focus:ring-3 focus:ring-ring/20",
              "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
            )}
          />

          <div className="mt-3">
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

          {recorder.error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {recorder.error}
            </p>
          )}

          {value && (
            <p className="mt-2 text-xs text-muted-foreground">
              Перевірте відповідь перед надсиланням. Розпізнаний текст можна
              відредагувати.
            </p>
          )}

          <div className="mt-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>Enter — надіслати, Shift + Enter — новий рядок</span>

            <span className="shrink-0 tabular-nums">
              {value.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
