import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { QuestEngineError } from "./errors";

import type {
  QuestJsonObject,
  QuestRunRecord,
} from "./types";

export type UpdateQuestRunInput = {
  runId: string;

  currentSceneId?: string | null;
  currentSceneCode?: string | null;

  completedSceneCount?: number;

  score?: number;

  xpEarned?: number;

  coinsEarned?: number;

  state?: QuestJsonObject;

  status?: QuestRunRecord["status"];

  completedAt?: string | null;
};

export async function updateQuestRun({
  runId,
  currentSceneId,
  currentSceneCode,
  completedSceneCount,
  score,
  xpEarned,
  coinsEarned,
  state,
  status,
  completedAt,
}: UpdateQuestRunInput): Promise<QuestRunRecord> {
  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (currentSceneId !== undefined) {
    updateData.current_scene_id =
      currentSceneId;
  }

  if (currentSceneCode !== undefined) {
    updateData.current_scene_code =
      currentSceneCode;
  }

  if (
    completedSceneCount !== undefined
  ) {
    updateData.completed_scene_count =
      completedSceneCount;
  }

  if (score !== undefined) {
    updateData.score = score;
  }

  if (xpEarned !== undefined) {
    updateData.xp_earned = xpEarned;
  }

  if (coinsEarned !== undefined) {
    updateData.coins_earned =
      coinsEarned;
  }

  if (state !== undefined) {
    updateData.state = state;
  }

  if (status !== undefined) {
    updateData.status = status;
  }

  if (completedAt !== undefined) {
    updateData.completed_at =
      completedAt;
  }

  const { data, error } =
    await admin
      .from("quest_runs")
      .update(updateData)
      .eq("id", runId)
      .select()
      .single();

  if (error || !data) {
    console.error(
      "Failed to update quest run:",
      error,
    );

    throw new QuestEngineError(
      "QUEST_RUN_UPDATE_FAILED",
      "Failed to update quest run",
      {
        runId,
      },
    );
  }

  return data as QuestRunRecord;
}
