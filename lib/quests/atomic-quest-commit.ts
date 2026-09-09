import "server-only";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { QuestEngineError } from "./errors";

import type {
  QuestJsonObject,
  SubmitQuestSceneResult,
} from "./types";

const COMMIT_TOKEN_KEY = "__talkheroCommitToken";

export type AtomicQuestEvent = {
  sceneId: string | null;
  sceneCode: string;
  eventType: string;
  userInput?: unknown;
  evaluation?: QuestJsonObject | null;
  isCorrect?: boolean | null;
  scoreAwarded?: number | null;
  responseTimeMs?: number | null;
  metadata?: QuestJsonObject;
};

export type AtomicConversationMessage = {
  sceneId: string | null;
  messageKey: string;
  role: "user" | "npc" | "system";
  speaker?: string | null;
  content: string;
  metadata?: QuestJsonObject;
};

export type CommitAtomicQuestSubmissionInput = {
  runId: string;
  sceneId: string;
  submissionId: string;
  attemptNumber: number;
  newStatus: string;
  newCurrentSceneId: string | null;
  newCurrentSceneCode: string | null;
  newCompletedSceneCount: number;
  newScore: number;
  newXpEarned: number;
  newCoinsEarned: number;
  newState: QuestJsonObject | null;
  completedAt: string | null;
  result: SubmitQuestSceneResult;
  events: AtomicQuestEvent[];
  conversationMessages: AtomicConversationMessage[];
};

export type CommitAtomicQuestSubmissionResult = {
  result: SubmitQuestSceneResult;
  committed: boolean;
};

function getDatabaseErrorCode(message: string): string | null {
  const codes = [
    "QUEST_RUN_NOT_FOUND",
    "QUEST_SUBMISSION_ALREADY_EXISTS",
    "QUEST_ATTEMPT_ALREADY_SUBMITTED",
    "QUEST_RUN_NOT_IN_PROGRESS",
    "QUEST_SCENE_ALREADY_CHANGED",
    "QUEST_SUBMISSION_COMPLETE_FAILED",
  ];

  for (const code of codes) {
    if (message.includes(code)) {
      return code;
    }
  }

  return null;
}

function stripCommitToken(
  value: Record<string, unknown>,
): SubmitQuestSceneResult {
  const {
    [COMMIT_TOKEN_KEY]: _commitToken,
    ...publicResult
  } = value;

  return publicResult as unknown as SubmitQuestSceneResult;
}

export async function commitAtomicQuestSubmission({
  runId,
  sceneId,
  submissionId,
  attemptNumber,
  newStatus,
  newCurrentSceneId,
  newCurrentSceneCode,
  newCompletedSceneCount,
  newScore,
  newXpEarned,
  newCoinsEarned,
  newState,
  completedAt,
  result,
  events,
  conversationMessages,
}: CommitAtomicQuestSubmissionInput): Promise<CommitAtomicQuestSubmissionResult> {
  const admin = createAdminClient();
  const commitToken = randomUUID();

  const resultWithCommitToken = {
    ...(result as unknown as Record<string, unknown>),
    [COMMIT_TOKEN_KEY]: commitToken,
  };

  const { data, error } = await admin.rpc(
    "commit_quest_scene_submission",
    {
      p_run_id: runId,
      p_scene_id: sceneId,
      p_submission_id: submissionId,
      p_attempt_number: attemptNumber,
      p_new_status: newStatus,
      p_new_current_scene_id: newCurrentSceneId,
      p_new_current_scene_code: newCurrentSceneCode,
      p_new_completed_scene_count: newCompletedSceneCount,
      p_new_score: newScore,
      p_new_xp_earned: newXpEarned,
      p_new_coins_earned: newCoinsEarned,
      p_new_state: newState,
      p_completed_at: completedAt,
      p_result: resultWithCommitToken,
      p_events: events,
      p_conversation_messages: conversationMessages,
    },
  );

  if (error) {
    console.error(
      "Failed to atomically commit quest submission:",
      error,
    );

    const databaseCode = getDatabaseErrorCode(error.message ?? "");

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      databaseCode ?? "Failed to commit quest submission",
      {
        runId,
        sceneId,
        submissionId,
        attemptNumber,
        databaseCode,
      },
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    console.error(
      "Atomic quest submission returned invalid result:",
      data,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Quest submission returned invalid result",
      {
        runId,
        sceneId,
        submissionId,
        attemptNumber,
      },
    );
  }

  const rawResult = data as Record<string, unknown>;

  const returnedCommitToken =
    typeof rawResult[COMMIT_TOKEN_KEY] === "string"
      ? rawResult[COMMIT_TOKEN_KEY]
      : null;

  return {
    result: stripCommitToken(rawResult),
    committed: returnedCommitToken === commitToken,
  };
}
