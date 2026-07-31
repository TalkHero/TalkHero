import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { QuestEngineError } from "./errors";

import type {
  QuestJsonObject,
  QuestRunEventRecord,
  QuestRunEventType,
  QuestSceneRecord,
} from "./types";

export type RecordQuestEventInput = {
  runId: string;
  scene: QuestSceneRecord | null;

  eventType: QuestRunEventType;

  userInput?: unknown;
  evaluation?: QuestJsonObject | null;

  isCorrect?: boolean | null;
  scoreAwarded?: number | null;

  responseTimeMs?: number | null;

  metadata?: QuestJsonObject;
};

export async function recordQuestEvent({
  runId,
  scene,
  eventType,
  userInput = null,
  evaluation = null,
  isCorrect = null,
  scoreAwarded = null,
  responseTimeMs = null,
  metadata = {},
}: RecordQuestEventInput): Promise<QuestRunEventRecord> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_run_events")
    .insert({
      run_id: runId,

      scene_id: scene?.id ?? null,
      scene_code: scene?.scene_code ?? "",

      event_type: eventType,

      user_input: userInput,
      evaluation,

      is_correct: isCorrect,
      score_awarded: scoreAwarded,

      response_time_ms: responseTimeMs,

      metadata,
    })
    .select()
    .single();

  if (error || !data) {
    console.error(
      "Failed to record quest event:",
      error,
    );

    throw new QuestEngineError(
      "QUEST_EVENT_CREATE_FAILED",
      "Failed to record quest event",
      {
        runId,
        eventType,
      },
    );
  }

  return data as QuestRunEventRecord;
}
