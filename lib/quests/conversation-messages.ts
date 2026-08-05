import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { QuestEngineError } from "./errors";

import type {
  QuestJsonObject,
} from "./types";

export type QuestConversationRole =
  | "user"
  | "npc"
  | "system";

export type QuestConversationMessage = {
  id: string;
  runId: string;
  sceneId: string | null;
  messageKey: string | null;
  role: QuestConversationRole;
  speaker: string | null;
  content: string;
  metadata: QuestJsonObject;
  createdAt: string;
};

type QuestConversationMessageRow = {
  id: string;
  run_id: string;
  scene_id: string | null;
  message_key: string | null;
  role: QuestConversationRole;
  speaker: string | null;
  content: string;
  metadata: QuestJsonObject | null;
  created_at: string;
};

export type RecordConversationMessageInput = {
  runId: string;
  sceneId?: string | null;
  messageKey?: string | null;
  role: QuestConversationRole;
  speaker?: string | null;
  content: string;
  metadata?: QuestJsonObject;
};

function mapMessage(
  row: QuestConversationMessageRow,
): QuestConversationMessage {
  return {
    id: row.id,
    runId: row.run_id,
    sceneId: row.scene_id,
    messageKey: row.message_key,
    role: row.role,
    speaker: row.speaker,
    content: row.content,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function normalizeContent(
  content: string,
): string {
  return content.trim().slice(0, 4000);
}

export async function recordConversationMessage({
  runId,
  sceneId = null,
  messageKey = null,
  role,
  speaker = null,
  content,
  metadata = {},
}: RecordConversationMessageInput): Promise<QuestConversationMessage> {
  const normalizedContent =
    normalizeContent(content);

  if (!runId.trim()) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Conversation run ID is required",
    );
  }

  if (!normalizedContent) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Conversation message content is required",
      {
        runId,
        sceneId,
        role,
      },
    );
  }

  const admin = createAdminClient();

  const row = {
    run_id: runId,
    scene_id: sceneId,
    message_key: messageKey,
    role,
    speaker:
      speaker?.trim() || null,
    content: normalizedContent,
    metadata,
  };

  const query = messageKey
    ? admin
        .from("quest_conversation_messages")
        .upsert(row, {
          onConflict:
            "run_id,message_key",
          ignoreDuplicates: false,
        })
    : admin
        .from("quest_conversation_messages")
        .insert(row);

  const { data, error } =
    await query
      .select()
      .single();

  if (error || !data) {
    console.error(
      "Failed to record quest conversation message:",
      error,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to save conversation message",
      {
        runId,
        sceneId,
        role,
        messageKey,
      },
    );
  }

  return mapMessage(
    data as QuestConversationMessageRow,
  );
}

export async function listRecentConversationMessages(
  runId: string,
  limit = 16,
): Promise<QuestConversationMessage[]> {
  const safeLimit = Math.min(
    30,
    Math.max(1, Math.trunc(limit)),
  );

  const admin = createAdminClient();

  const { data, error } =
    await admin
      .from("quest_conversation_messages")
      .select(
        [
          "id",
          "run_id",
          "scene_id",
          "message_key",
          "role",
          "speaker",
          "content",
          "metadata",
          "created_at",
        ].join(","),
      )
      .eq("run_id", runId)
      .order("created_at", {
        ascending: false,
      })
      .limit(safeLimit);

  if (error) {
    console.error(
      "Failed to load quest conversation messages:",
      error,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to load conversation history",
      {
        runId,
      },
    );
  }

  const rows =
    (data ?? []) as unknown as
      QuestConversationMessageRow[];

  return rows
    .reverse()
    .map(mapMessage);
}

export function toConversationHistoryJson(
  messages: QuestConversationMessage[],
): QuestJsonObject[] {
  return messages.map((message) => ({
    role: message.role,
    speaker: message.speaker,
    content: message.content,
    sceneId: message.sceneId,
    createdAt: message.createdAt,
  }));
}
