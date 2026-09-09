import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { QuestEngineError } from "./errors";

import type { SubmitQuestSceneResult } from "./types";

const COMMIT_TOKEN_KEY = "__talkheroCommitToken";

type QuestSceneSubmissionStatus =
  | "processing"
  | "completed"
  | "failed";

type QuestSceneSubmissionRecord = {
  id: string;
  run_id: string;
  scene_id: string;
  submission_id: string;
  attempt_number: number;
  status: QuestSceneSubmissionStatus;
  result: SubmitQuestSceneResult | null;
  created_at: string;
  completed_at: string | null;
};

export type ClaimQuestSubmissionInput = {
  runId: string;
  sceneId: string;
  submissionId: string;
  attemptNumber: number;
};

export type ClaimQuestSubmissionResult =
  | {
      status: "claimed";
      submission: QuestSceneSubmissionRecord;
    }
  | {
      status: "completed";
      submission: QuestSceneSubmissionRecord;
      result: SubmitQuestSceneResult;
    }
  | {
      status: "processing";
      submission: QuestSceneSubmissionRecord;
    }
  | {
      status: "failed";
      submission: QuestSceneSubmissionRecord;
    };

async function findExistingSubmission({
  runId,
  sceneId,
  submissionId,
  attemptNumber,
}: ClaimQuestSubmissionInput): Promise<QuestSceneSubmissionRecord | null> {
  const admin = createAdminClient();

  const {
    data: bySubmissionId,
    error: submissionError,
  } = await admin
    .from("quest_scene_submissions")
    .select("*")
    .eq("run_id", runId)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (submissionError) {
    console.error(
      "Failed to load quest submission by submission ID:",
      submissionError,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to load quest submission",
      {
        runId,
        submissionId,
      },
    );
  }

  if (bySubmissionId) {
    return bySubmissionId as QuestSceneSubmissionRecord;
  }

  const {
    data: byAttempt,
    error: attemptError,
  } = await admin
    .from("quest_scene_submissions")
    .select("*")
    .eq("run_id", runId)
    .eq("scene_id", sceneId)
    .eq("attempt_number", attemptNumber)
    .maybeSingle();

  if (attemptError) {
    console.error(
      "Failed to load quest submission by scene attempt:",
      attemptError,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to load quest submission",
      {
        runId,
        sceneId,
        attemptNumber,
      },
    );
  }

  return byAttempt
    ? (byAttempt as QuestSceneSubmissionRecord)
    : null;
}

function resolveExistingSubmission(
  submission: QuestSceneSubmissionRecord,
): ClaimQuestSubmissionResult {
  if (
    submission.status === "completed" &&
    submission.result
  ) {
    return {
      status: "completed",
      submission,
      result: submission.result,
    };
  }

  if (submission.status === "failed") {
    return {
      status: "failed",
      submission,
    };
  }

  return {
    status: "processing",
    submission,
  };
}

export async function claimQuestSubmission({
  runId,
  sceneId,
  submissionId,
  attemptNumber,
}: ClaimQuestSubmissionInput): Promise<ClaimQuestSubmissionResult> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_scene_submissions")
    .insert({
      run_id: runId,
      scene_id: sceneId,
      submission_id: submissionId,
      attempt_number: attemptNumber,
      status: "processing",
    })
    .select()
    .single();

  if (!error && data) {
    return {
      status: "claimed",
      submission: data as QuestSceneSubmissionRecord,
    };
  }

  if (error?.code === "23505") {
    const existing = await findExistingSubmission({
      runId,
      sceneId,
      submissionId,
      attemptNumber,
    });

    if (!existing) {
      console.error(
        "Quest submission conflict occurred but existing submission was not found:",
        error,
      );

      throw new QuestEngineError(
        "SCENE_SUBMIT_FAILED",
        "Failed to resolve duplicate quest submission",
        {
          runId,
          sceneId,
          submissionId,
          attemptNumber,
        },
      );
    }

    return resolveExistingSubmission(existing);
  }

  console.error(
    "Failed to claim quest submission:",
    error,
  );

  throw new QuestEngineError(
    "SCENE_SUBMIT_FAILED",
    "Failed to claim quest submission",
    {
      runId,
      sceneId,
      submissionId,
      attemptNumber,
    },
  );
}

export async function completeQuestSubmission({
  runId,
  submissionId,
  result,
}: {
  runId: string;
  submissionId: string;
  result: SubmitQuestSceneResult;
}): Promise<void> {
  const admin = createAdminClient();

  const completedAt = new Date().toISOString();

  const { data, error } = await admin
    .from("quest_scene_submissions")
    .update({
      status: "completed",
      result,
      completed_at: completedAt,
    })
    .eq("run_id", runId)
    .eq("submission_id", submissionId)
    .eq("status", "processing")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(
      "Failed to complete quest submission:",
      error ?? {
        runId,
        submissionId,
        reason: "No processing submission was updated",
      },
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to complete quest submission",
      {
        runId,
        submissionId,
      },
    );
  }
}

export async function failQuestSubmission({
  runId,
  submissionId,
}: {
  runId: string;
  submissionId: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("quest_scene_submissions")
    .update({
      status: "failed",
    })
    .eq("run_id", runId)
    .eq("submission_id", submissionId)
    .eq("status", "processing");

  if (error) {
    console.error(
      "Failed to mark quest submission as failed:",
      error,
    );
  }
}

export async function releaseQuestSubmission({
  runId,
  submissionId,
}: {
  runId: string;
  submissionId: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("quest_scene_submissions")
    .delete()
    .eq("run_id", runId)
    .eq("submission_id", submissionId)
    .eq("status", "processing");

  if (error) {
    console.error(
      "Failed to release quest submission:",
      error,
    );
  }
}

export async function loadCompletedQuestSubmission({
  runId,
  submissionId,
}: {
  runId: string;
  submissionId: string;
}): Promise<SubmitQuestSceneResult | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_scene_submissions")
    .select("status, result")
    .eq("run_id", runId)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load completed quest submission:",
      error,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to load quest submission",
      {
        runId,
        submissionId,
      },
    );
  }

  if (
    data?.status === "completed" &&
    data.result &&
    typeof data.result === "object" &&
    !Array.isArray(data.result)
  ) {
    const {
      [COMMIT_TOKEN_KEY]: _commitToken,
      ...publicResult
    } = data.result as Record<string, unknown>;

    return publicResult as unknown as SubmitQuestSceneResult;
  }

  return null;
}
