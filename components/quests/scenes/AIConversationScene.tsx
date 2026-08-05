"use client";

import { Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicQuestScene, QuestSceneEvaluation } from "@/lib/quests";
import { getNPCBySpeaker, type NPC } from "@/lib/quests/npcs";
import { AIFeedbackCard } from "../AIFeedbackCard";
import { NPCCard } from "../NPCCard";
import { SceneShell } from "./SceneShell";

type Props = { scene: PublicQuestScene; evaluation: QuestSceneEvaluation | null; loading?: boolean; onSubmit: (value: unknown) => Promise<void>; };

function getString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEvalString(evaluation: QuestSceneEvaluation | null, key: string): string | null {
  const value = evaluation?.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEvalNumber(evaluation: QuestSceneEvaluation | null, key: string): number | null {
  const value = evaluation?.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fallbackNPC(scene: PublicQuestScene): NPC {
  const speaker = scene.speaker?.trim() || "Персонаж";
  return { id: speaker.toLowerCase().replace(/\s+/g, "-"), name: speaker, role: getString(scene.metadata, "role") || "Співрозмовник", avatar: getString(scene.metadata, "avatar") || "💬", emotion: "happy", accent: "neutral", voiceId: null, theme: "slate" };
}

export function AIConversationScene({ scene, evaluation, loading = false, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const npc = getNPCBySpeaker(scene.speaker) ?? fallbackNPC(scene);
  const npcReply = getEvalString(evaluation, "npcReply");
  const currentTurn = getEvalNumber(evaluation, "currentTurn");
  const maxTurns = getEvalNumber(evaluation, "maxTurns") ?? (typeof scene.metadata.maxTurns === "number" ? scene.metadata.maxTurns : 4);

  useEffect(() => { setValue(""); }, [scene.id, evaluation?.metadata?.currentTurn]);
  const trimmed = value.trim();
  async function handleSubmit() { if (trimmed && !loading) await onSubmit(trimmed); }

  return (
    <SceneShell
      title={scene.prompt || "Поговоріть із персонажем"}
      description={getString(scene.metadata, "conversationHint")}
      footer={<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Діалог і навчальний відгук створюються за допомогою ШІ.</p><button type="button" disabled={!trimmed || loading} onClick={() => void handleSubmit()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{loading ? `${npc.name} відповідає…` : "Надіслати"}</button></div>}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-violet-800"><Sparkles className="h-4 w-4" />Живий діалог</div><span className="text-xs font-semibold text-violet-700">Репліка {currentTurn ?? 1} із {maxTurns}</span></div>
        <NPCCard npc={npc}><p>{npcReply || scene.content}</p></NPCCard>
        {evaluation?.feedback && (
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
  />
)}
        <div><label htmlFor={`ai-conversation-${scene.id}`} className="mb-2 block text-sm font-semibold text-slate-700">Ваша відповідь англійською</label><textarea id={`ai-conversation-${scene.id}`} value={value} disabled={loading} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSubmit(); } }} rows={3} maxLength={500} placeholder={`Напишіть відповідь для ${npc.name}…`} className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70" /><p className="mt-2 text-xs text-slate-500">Enter — надіслати, Shift + Enter — новий рядок.</p></div>
      </div>
    </SceneShell>
  );
}
