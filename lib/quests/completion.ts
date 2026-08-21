import "server-only";

import { buildQuestCompletionSummary } from "./completion-summary";
import { listQuestRunEvents, recordQuestEvent } from "./run-events";

import type { QuestCompletionSummary } from "./completion-summary";
import { updateQuestRun } from "./run-updater";

import type { QuestRunRecord, QuestSceneRecord } from "./types";

export type CompleteQuestInput = {
  run: QuestRunRecord;
  finalScene: QuestSceneRecord;

  score: number;

  xpEarned: number;

  coinsEarned: number;

  completedSceneCount: number;
};

export type CompleteQuestResult = {
  completed: true;

  score: number;

  xpEarned: number;

  coinsEarned: number;

  summary: QuestCompletionSummary;
};

export async function completeQuest({
  run,
  finalScene,
  score,
  xpEarned,
  coinsEarned,
  completedSceneCount,
}: CompleteQuestInput): Promise<CompleteQuestResult> {
  const completedAt = new Date().toISOString();

  await updateQuestRun({
    runId: run.id,

    status: "completed",

    completedAt,

    score,

    xpEarned,

    coinsEarned,

    completedSceneCount,

    currentSceneId: null,

    currentSceneCode: null,
  });

  await recordQuestEvent({
    runId: run.id,

    scene: finalScene,

    eventType: "quest_completed",

    metadata: {
      score,
      xpEarned,
      coinsEarned,
      completedAt,
    },
  });

  const events = await listQuestRunEvents(run.id);

  const summary = buildQuestCompletionSummary(events);

  return {
    completed: true,
    score,
    xpEarned,
    coinsEarned,
    summary,
  };
}
