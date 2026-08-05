"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";

import { AIFeedbackCard } from "@/components/quests/AIFeedbackCard";
import { NPCCard } from "@/components/quests/NPCCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicQuestScene, QuestSceneEvaluation } from "@/lib/quests";
import { getNPCBySpeaker, type NPC } from "@/lib/quests/npcs";
import { cn } from "@/lib/utils";

import { SceneShell } from "./SceneShell";

type Props = {
  scene: PublicQuestScene;
  evaluation: QuestSceneEvaluation | null;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

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

  const npc = getNPCBySpeaker(scene.speaker) ?? fallbackNPC(scene);

  const npcReply = getEvalString(evaluation, "npcReply");

  const currentTurn = getEvalNumber(evaluation, "currentTurn");

  const metadataMaxTurns =
    typeof scene.metadata.maxTurns === "number" ? scene.metadata.maxTurns : 4;

  const maxTurns = getEvalNumber(evaluation, "maxTurns") ?? metadataMaxTurns;

  useEffect(() => {
    setValue("");
  }, [scene.id, evaluation?.metadata?.currentTurn]);

  const trimmed = value.trim();

  async function handleSubmit() {
    if (!trimmed || loading) {
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
            disabled={!trimmed || loading}
            onClick={() => {
              void handleSubmit();
            }}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                {npc.name} відповідає…
              </>
            ) : (
              <>
                Надіслати
                <Send aria-hidden="true" />
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

        <NPCCard npc={npc}>
          <p className="whitespace-pre-line">{npcReply || scene.content}</p>
        </NPCCard>

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
            disabled={loading}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            onKeyDown={(event) => {
              void handleKeyDown(event);
            }}
            rows={3}
            maxLength={500}
            placeholder={`Напишіть відповідь для ${npc.name}…`}
            className={cn(
              "min-h-28 w-full resize-y rounded-xl border border-input bg-card p-4",
              "text-base leading-7 text-foreground",
              "outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "placeholder:text-muted-foreground",
              "focus:border-primary focus:ring-3 focus:ring-ring/20",
              "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
            )}
          />

          <div className="mt-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>Enter — надіслати, Shift + Enter — новий рядок</span>

            <span className="shrink-0 tabular-nums">{value.length}/500</span>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
