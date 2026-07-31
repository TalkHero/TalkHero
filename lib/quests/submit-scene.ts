import "server-only";

import { completeQuest } from "./completion";
import { QuestEngineError } from "./errors";
import { evaluateQuestScene } from "./evaluation";
import { resolveNextScene } from "./progression";
import {
  findCurrentScene,
  loadQuestById,
  loadQuestRun,
  loadQuestStructure,
  mapPublicScene,
} from "./repository";
import { recordQuestEvent } from "./run-events";
import { updateQuestRun } from "./run-updater";

import type {
  AiQuestSceneEvaluator,
  QuestSceneEvaluationResult,
} from "./evaluation";
import type {
  QuestJsonObject,
  QuestProgress,
  QuestRunRecord,
  QuestSceneRecord,
  SubmitQuestSceneResult,
} from "./types";

export type SubmitQuestSceneInput = {
  userId: string;
  runId: string;
  userInput: unknown;
  responseTimeMs?: number | null;
  aiEvaluator?: AiQuestSceneEvaluator;
};

type AttemptMap = Record<string, number>;

function asJsonObject(value: unknown): QuestJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as QuestJsonObject;
  }

  return {};
}

function getAttemptMap(state: QuestJsonObject): AttemptMap {
  const raw = state.sceneAttempts;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const attempts: AttemptMap = {};

  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0
    ) {
      attempts[key] = value;
    }
  }

  return attempts;
}

function createUpdatedState({
  run,
  scene,
  attemptNumber,
  nextScene,
}: {
  run: QuestRunRecord;
  scene: QuestSceneRecord;
  attemptNumber: number;
  nextScene: QuestSceneRecord | null;
}): QuestJsonObject {
  const currentState = asJsonObject(run.state);
  const attempts = getAttemptMap(currentState);

  return {
    ...currentState,
    sceneAttempts: {
      ...attempts,
      [scene.id]: attemptNumber,
    },
    currentActId: nextScene?.act_id ?? scene.act_id,
    lastCompletedSceneId: scene.id,
    lastCompletedSceneCode: scene.scene_code,
  };
}

function sanitizeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function buildProgress({
  completedSceneCount,
  totalScenes,
  completed,
}: {
  completedSceneCount: number;
  totalScenes: number;
  completed: boolean;
}): QuestProgress {
  if (completed) {
    return {
      current: totalScenes,
      total: totalScenes,
      completed: totalScenes,
    };
  }

  return {
    current: Math.min(completedSceneCount + 1, totalScenes),
    total: totalScenes,
    completed: Math.min(completedSceneCount, totalScenes),
  };
}

function shouldRetryScene({
  scene,
  evaluation,
  attemptNumber,
}: {
  scene: QuestSceneRecord;
  evaluation: QuestSceneEvaluationResult;
  attemptNumber: number;
}): boolean {
  if (evaluation.isCorrect !== false) {
    return false;
  }

  const allowRetry = scene.evaluation_config?.allowRetry ?? false;

  if (!allowRetry) {
    return false;
  }

  const maxAttempts = scene.evaluation_config?.maxAttempts;

  if (
    typeof maxAttempts !== "number" ||
    !Number.isFinite(maxAttempts) ||
    maxAttempts <= 0
  ) {
    return true;
  }

  return attemptNumber < maxAttempts;
}

function toPublicEvaluation(evaluation: QuestSceneEvaluationResult) {
  return {
    isCorrect: evaluation.isCorrect,
    scoreAwarded: evaluation.scoreAwarded,
    feedback: evaluation.feedback,
    nextSceneCode: evaluation.nextSceneCode,
  };
}

async function recordSubmissionEvent({
  run,
  scene,
  userInput,
  evaluation,
  responseTimeMs,
  attemptNumber,
}: {
  run: QuestRunRecord;
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
  responseTimeMs: number | null;
  attemptNumber: number;
}): Promise<void> {
  const evaluationJson: QuestJsonObject = {
    mode: evaluation.mode,
    isCorrect: evaluation.isCorrect,
    scoreAwarded: evaluation.scoreAwarded,
    feedback: evaluation.feedback,
    nextSceneCode: evaluation.nextSceneCode,
    normalizedInput: evaluation.normalizedInput,
    metadata: evaluation.metadata,
  };

  await recordQuestEvent({
    runId: run.id,
    scene,
    eventType:
      scene.scene_type === "choice"
        ? "choice_selected"
        : "answer_submitted",
    userInput,
    evaluation: evaluationJson,
    isCorrect: evaluation.isCorrect,
    scoreAwarded: evaluation.scoreAwarded,
    responseTimeMs,
    metadata: {
      attemptNumber,
      evaluationMode: evaluation.mode,
    },
  });
}

export async function submitQuestScene({
  userId,
  runId,
  userInput,
  responseTimeMs = null,
  aiEvaluator,
}: SubmitQuestSceneInput): Promise<SubmitQuestSceneResult> {
  if (!userId.trim()) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "User ID is required",
    );
  }

  if (!runId.trim()) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Quest run ID is required",
    );
  }

  const run = await loadQuestRun(runId, userId);

  if (run.status !== "in_progress") {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Quest run is not in progress",
      {
        runId: run.id,
        status: run.status,
      },
    );
  }

  const quest = await loadQuestById(run.quest_id);
  const { acts, scenes } = await loadQuestStructure(run.quest_id);
  const currentScene = findCurrentScene(run, scenes);

  const runState = asJsonObject(run.state);
  const attemptMap = getAttemptMap(runState);
  const attemptNumber = (attemptMap[currentScene.id] ?? 0) + 1;

  const evaluation = await evaluateQuestScene(
    {
      scene: currentScene,
      userInput,
      attemptNumber,
      runState,
    },
    {
      aiEvaluator,
    },
  );

  const normalizedEvaluation: QuestSceneEvaluationResult = {
    ...evaluation,
    scoreAwarded: sanitizeScore(evaluation.scoreAwarded),
  };

  await recordSubmissionEvent({
    run,
    scene: currentScene,
    userInput,
    evaluation: normalizedEvaluation,
    responseTimeMs,
    attemptNumber,
  });

  if (
    shouldRetryScene({
      scene: currentScene,
      evaluation: normalizedEvaluation,
      attemptNumber,
    })
  ) {
    const retryState = createUpdatedState({
      run,
      scene: currentScene,
      attemptNumber,
      nextScene: currentScene,
    });

    const updatedRun = await updateQuestRun({
      runId: run.id,
      state: retryState,
    });

    await recordQuestEvent({
      runId: run.id,
      scene: currentScene,
      eventType: "scene_presented",
      metadata: {
        resumed: false,
        retry: true,
        attemptNumber: attemptNumber + 1,
        actId: currentScene.act_id,
        orderIndex: currentScene.order_index,
      },
    });

    return {
      runId: run.id,
      completed: false,
      score: updatedRun.score,
      xpEarned: updatedRun.xp_earned,
      coinsEarned: updatedRun.coins_earned,
      progress: buildProgress({
        completedSceneCount: updatedRun.completed_scene_count,
        totalScenes: scenes.length,
        completed: false,
      }),
      evaluation: toPublicEvaluation(normalizedEvaluation),
      scene: mapPublicScene(currentScene),
    };
  }

  const nextSceneCode =
    normalizedEvaluation.nextSceneCode ??
    currentScene.next_scene_code;

  const progression = resolveNextScene({
    currentScene,
    acts,
    scenes,
    nextSceneCode,
  });

  const nextScore =
    run.score + normalizedEvaluation.scoreAwarded;

  const completedSceneCount = Math.min(
    run.completed_scene_count + 1,
    scenes.length,
  );

  const nextState = createUpdatedState({
    run,
    scene: currentScene,
    attemptNumber,
    nextScene: progression.nextScene,
  });

  await recordQuestEvent({
    runId: run.id,
    scene: currentScene,
    eventType: "scene_completed",
    userInput,
    evaluation: {
      mode: normalizedEvaluation.mode,
      feedback: normalizedEvaluation.feedback,
      nextSceneCode,
      metadata: normalizedEvaluation.metadata,
    },
    isCorrect: normalizedEvaluation.isCorrect,
    scoreAwarded: normalizedEvaluation.scoreAwarded,
    responseTimeMs,
    metadata: {
      attemptNumber,
      completedSceneCount,
    },
  });

  if (progression.completed || !progression.nextScene) {
    const completion = await completeQuest({
      run,
      finalScene: currentScene,
      score: nextScore,
      xpEarned: quest.xp_reward,
      coinsEarned: quest.coin_reward,
      completedSceneCount,
    });

    return {
      runId: run.id,
      completed: true,
      score: completion.score,
      xpEarned: completion.xpEarned,
      coinsEarned: completion.coinsEarned,
      progress: buildProgress({
        completedSceneCount,
        totalScenes: scenes.length,
        completed: true,
      }),
      evaluation: toPublicEvaluation(normalizedEvaluation),
      scene: null,
    };
  }

  const nextScene = progression.nextScene;

  const updatedRun = await updateQuestRun({
    runId: run.id,
    currentSceneId: nextScene.id,
    currentSceneCode: nextScene.scene_code,
    completedSceneCount,
    score: nextScore,
    state: nextState,
  });

  await recordQuestEvent({
    runId: run.id,
    scene: nextScene,
    eventType: "scene_presented",
    metadata: {
      resumed: false,
      retry: false,
      actId: nextScene.act_id,
      orderIndex: nextScene.order_index,
      previousSceneId: currentScene.id,
      previousSceneCode: currentScene.scene_code,
    },
  });

  return {
    runId: run.id,
    completed: false,
    score: updatedRun.score,
    xpEarned: updatedRun.xp_earned,
    coinsEarned: updatedRun.coins_earned,
    progress: buildProgress({
      completedSceneCount: updatedRun.completed_scene_count,
      totalScenes: scenes.length,
      completed: false,
    }),
    evaluation: toPublicEvaluation(normalizedEvaluation),
    scene: mapPublicScene(nextScene),
  };
}
