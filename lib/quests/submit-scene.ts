import "server-only";

import { checkAndUpdateMastery, loadErrors } from "@/lib/ai/error-memory";

import {
  commitAtomicQuestSubmission,
} from "./atomic-quest-commit";
import type {
  AtomicConversationMessage,
  AtomicQuestEvent,
} from "./atomic-quest-commit";
import { buildQuestCompletionSummary } from "./completion-summary";
import {
  listRecentConversationMessages,
  toConversationHistoryJson,
} from "./conversation-messages";
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
import { listQuestRunEvents } from "./run-events";
import { saveCorrectAnswerVocabulary } from "./save-correct-answer-vocabulary";
import { saveQuestLanguageErrors } from "./quest-error-memory";
import { loadCompletedQuestSubmission } from "./submission-idempotency";

import type {
  AiQuestSceneEvaluator,
  QuestSceneEvaluationResult,
} from "./evaluation";
import type {
  QuestJsonObject,
  QuestProgress,
  QuestRunEventRecord,
  QuestRunRecord,
  QuestSceneRecord,
  SubmitQuestSceneResult,
} from "./types";

export type SubmitQuestSceneInput = {
  userId: string;
  runId: string;
  sceneId: string;
  submissionId: string;
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
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
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

  const persistentState = {
    ...currentState,
  };

  delete persistentState.conversationHistory;

  return {
    ...persistentState,
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
  const aiConversation = scene.metadata?.aiConversation === true;

  if (aiConversation) {
    return evaluation.metadata?.goalReached !== true;
  }

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
    grade: evaluation.grade,
    scoreAwarded: evaluation.scoreAwarded,
    feedback: evaluation.feedback,
    nextSceneCode: evaluation.nextSceneCode,
    metadata: evaluation.metadata,
  };
}

function getMetadataString(
  metadata: QuestJsonObject,
  key: string,
): string | null {
  const value = metadata[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getAiNpcReply(
  evaluation: QuestSceneEvaluationResult,
): string | null {
  const value = evaluation.metadata?.npcReply;

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildConversationMessages({
  scene,
  userInput,
  evaluation,
  attemptNumber,
}: {
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
  attemptNumber: number;
}): AtomicConversationMessage[] {
  const messages: AtomicConversationMessage[] = [];

  const passive =
    scene.scene_type === "dialogue" ||
    scene.scene_type === "narration" ||
    scene.scene_type === "completion";

  if (passive) {
    messages.push({
      sceneId: scene.id,
      messageKey: `scene:${scene.id}:npc`,
      role: "npc",
      speaker: scene.speaker ?? "Оповідач",
      content: scene.content,
      metadata: {
        sceneCode: scene.scene_code,
        passive: true,
      },
    });

    return messages;
  }

  if (typeof userInput === "string" && userInput.trim()) {
    messages.push({
      sceneId: scene.id,
      messageKey: `scene:${scene.id}:attempt:${attemptNumber}:user`,
      role: "user",
      speaker: "Користувач",
      content: userInput,
      metadata: {
        sceneCode: scene.scene_code,
        attemptNumber,
        evaluationMode: evaluation.mode,
      },
    });
  }

  const aiConversation =
    scene.metadata?.aiConversation === true;

  if (
    evaluation.mode === "ai" &&
    aiConversation
  ) {
    const npcReply = getAiNpcReply(evaluation);

    if (npcReply) {
      messages.push({
        sceneId: scene.id,
        messageKey: `scene:${scene.id}:attempt:${attemptNumber}:npc-ai`,
        role: "npc",
        speaker:
          scene.speaker ??
          getMetadataString(
            scene.metadata,
            "role",
          ) ??
          "Персонаж",
        content: npcReply,
        metadata: {
          sceneCode: scene.scene_code,
          attemptNumber,
          generatedByAI: true,
          scorePercent:
            evaluation.metadata?.scorePercent ?? null,
        },
      });
    }
  }

  return messages;
}

function buildSubmissionEvent({
  scene,
  userInput,
  evaluation,
  responseTimeMs,
  attemptNumber,
}: {
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
  responseTimeMs: number | null;
  attemptNumber: number;
}): AtomicQuestEvent {
  const evaluationJson: QuestJsonObject = {
    mode: evaluation.mode,
    isCorrect: evaluation.isCorrect,
    grade: evaluation.grade,
    scoreAwarded: evaluation.scoreAwarded,
    feedback: evaluation.feedback,
    nextSceneCode: evaluation.nextSceneCode,
    normalizedInput: evaluation.normalizedInput,
    metadata: evaluation.metadata,
  };

  return {
    sceneId: scene.id,
    sceneCode: scene.scene_code,
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
      grade: evaluation.grade,
    },
  };
}

function buildSceneCompletedEvent({
  scene,
  userInput,
  evaluation,
  responseTimeMs,
  attemptNumber,
  completedSceneCount,
  nextSceneCode,
}: {
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
  responseTimeMs: number | null;
  attemptNumber: number;
  completedSceneCount: number;
  nextSceneCode: string | null;
}): AtomicQuestEvent {
  return {
    sceneId: scene.id,
    sceneCode: scene.scene_code,
    eventType: "scene_completed",
    userInput,
    evaluation: {
      mode: evaluation.mode,
      grade: evaluation.grade,
      feedback: evaluation.feedback,
      nextSceneCode,
      metadata: evaluation.metadata,
    },
    isCorrect: evaluation.isCorrect,
    scoreAwarded: evaluation.scoreAwarded,
    responseTimeMs,
    metadata: {
      attemptNumber,
      completedSceneCount,
    },
  };
}

function buildScenePresentedEvent({
  scene,
  retry,
  attemptNumber,
  previousScene,
}: {
  scene: QuestSceneRecord;
  retry: boolean;
  attemptNumber?: number;
  previousScene?: QuestSceneRecord;
}): AtomicQuestEvent {
  return {
    sceneId: scene.id,
    sceneCode: scene.scene_code,
    eventType: "scene_presented",
    metadata: {
      resumed: false,
      retry,
      ...(attemptNumber !== undefined
        ? { attemptNumber }
        : {}),
      actId: scene.act_id,
      orderIndex: scene.order_index,
      ...(previousScene
        ? {
            previousSceneId: previousScene.id,
            previousSceneCode: previousScene.scene_code,
          }
        : {}),
    },
  };
}

async function saveLearningSideEffects({
  userId,
  scene,
  userInput,
  evaluation,
}: {
  userId: string;
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
}): Promise<void> {
  try {
    await saveQuestLanguageErrors({
      userId,
      userInput,
      evaluation,
    });
  } catch (error) {
    console.error(
      "FAILED TO SAVE QUEST LANGUAGE ERROR:",
      error,
    );
  }

  if (
    typeof userInput === "string" &&
    userInput.trim().length > 0
  ) {
    try {
      await checkAndUpdateMastery({
        userId,
        userMessage: userInput,
      });
    } catch (error) {
      console.error(
        "FAILED TO UPDATE QUEST LANGUAGE MASTERY:",
        error,
      );
    }
  }

  if (evaluation.isCorrect === true) {
    try {
      await saveCorrectAnswerVocabulary({
        userId,
        scene,
        userInput,
        evaluation,
      });
    } catch (error) {
      console.error(
        "FAILED TO SAVE CORRECT ANSWER TO VOCABULARY:",
        error,
      );
    }
  }
}

function toCompletionSummaryEvent(
  event: AtomicQuestEvent,
): QuestRunEventRecord {
  return {
    event_type: event.eventType,
    user_input: event.userInput ?? null,
    evaluation: event.evaluation ?? null,
    metadata: event.metadata ?? {},
  } as QuestRunEventRecord;
}

export async function submitQuestScene({
  userId,
  runId,
  sceneId,
  submissionId,
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

  if (!sceneId.trim()) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Quest scene ID is required",
    );
  }

  if (!submissionId.trim()) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Submission ID is required",
    );
  }

  const run = await loadQuestRun(runId, userId);

  const completedSubmission =
    await loadCompletedQuestSubmission({
      runId: run.id,
      submissionId,
    });

  if (completedSubmission) {
    return completedSubmission;
  }

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

  if (currentScene.id !== sceneId) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Quest scene has already changed",
      {
        runId: run.id,
        expectedSceneId: sceneId,
        currentSceneId: currentScene.id,
      },
    );
  }

  const persistentRunState = asJsonObject(run.state);

  const conversationHistory =
    await listRecentConversationMessages(run.id, 16);

  const runState: QuestJsonObject = {
    ...persistentRunState,
    conversationHistory:
      toConversationHistoryJson(conversationHistory),
  };

  const attemptMap = getAttemptMap(persistentRunState);

  const attemptNumber =
    (attemptMap[currentScene.id] ?? 0) + 1;

  const isPassiveScene =
    currentScene.scene_type === "dialogue" ||
    currentScene.scene_type === "narration" ||
    currentScene.scene_type === "completion";

  const languageErrors = isPassiveScene
    ? []
    : (await loadErrors(userId)).slice(0, 5).map((error) => ({
        errorKey: error.error_key,
        errorType: error.error_type,
        originalText: error.original_text,
        correctedText: error.corrected_text,
        explanation: error.explanation,
        occurrenceCount: error.occurrence_count,
        successfulUses: error.successful_uses,
      }));

  const supportsReinforcement =
    currentScene.evaluation_config?.mode === "ai" &&
    currentScene.metadata?.aiConversation === true;

  const reinforcementTarget = supportsReinforcement
    ? ([...languageErrors].sort((a, b) => {
        if (a.successfulUses !== b.successfulUses) {
          return b.successfulUses - a.successfulUses;
        }

        return b.occurrenceCount - a.occurrenceCount;
      })[0] ?? null)
    : null;

  const evaluation: QuestSceneEvaluationResult = isPassiveScene
    ? {
        mode: "manual",
        isCorrect: null,
        grade: null,
        scoreAwarded: 0,
        feedback: null,
        nextSceneCode: currentScene.next_scene_code,
        normalizedInput: null,
        metadata: {
          attemptNumber,
          passiveScene: true,
        },
      }
    : await evaluateQuestScene(
        {
          scene: currentScene,
          userInput,
          attemptNumber,
          runState,
          languageErrors,
          reinforcementTarget,
        },
        {
          aiEvaluator,
        },
      );

  const normalizedEvaluation: QuestSceneEvaluationResult = {
    ...evaluation,
    scoreAwarded: sanitizeScore(evaluation.scoreAwarded),
  };

  const conversationMessages =
    buildConversationMessages({
      scene: currentScene,
      userInput,
      evaluation: normalizedEvaluation,
      attemptNumber,
    });

  const submissionEvent =
    buildSubmissionEvent({
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

    const result: SubmitQuestSceneResult = {
      runId: run.id,
      completed: false,
      score: run.score,
      xpEarned: run.xp_earned,
      coinsEarned: run.coins_earned,
      progress: buildProgress({
        completedSceneCount: run.completed_scene_count,
        totalScenes: scenes.length,
        completed: false,
      }),
      evaluation: toPublicEvaluation(normalizedEvaluation),
      scene: mapPublicScene(currentScene),
    };

    const committed =
      await commitAtomicQuestSubmission({
        runId: run.id,
        sceneId: currentScene.id,
        submissionId,
        attemptNumber,
        newStatus: run.status,
        newCurrentSceneId: currentScene.id,
        newCurrentSceneCode: currentScene.scene_code,
        newCompletedSceneCount: run.completed_scene_count,
        newScore: run.score,
        newXpEarned: run.xp_earned,
        newCoinsEarned: run.coins_earned,
        newState: retryState,
        completedAt: run.completed_at ?? null,
        result,
        events: [
          submissionEvent,
          buildScenePresentedEvent({
            scene: currentScene,
            retry: true,
            attemptNumber: attemptNumber + 1,
          }),
        ],
        conversationMessages,
      });

    if (committed.committed) {
      await saveLearningSideEffects({
        userId,
        scene: currentScene,
        userInput,
        evaluation: normalizedEvaluation,
      });
    }

    return committed.result;
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

  const sceneCompletedEvent =
    buildSceneCompletedEvent({
      scene: currentScene,
      userInput,
      evaluation: normalizedEvaluation,
      responseTimeMs,
      attemptNumber,
      completedSceneCount,
      nextSceneCode,
    });

  if (progression.completed || !progression.nextScene) {
    const maxScore =
      typeof run.max_score === "number" &&
      Number.isFinite(run.max_score) &&
      run.max_score > 0
        ? run.max_score
        : nextScore;

    const scoreRatio =
      maxScore > 0
        ? Math.min(1, Math.max(0, nextScore / maxScore))
        : 1;

    const rewardRatio = Math.max(0.5, scoreRatio);

    const scaledXpReward = Math.round(
      quest.xp_reward * rewardRatio,
    );

    const scaledCoinReward = Math.round(
      quest.coin_reward * rewardRatio,
    );

    const existingEvents =
      await listQuestRunEvents(run.id);

    const completionSummary =
      buildQuestCompletionSummary([
        ...existingEvents,
        toCompletionSummaryEvent(submissionEvent),
      ]);

    const completedAt = new Date().toISOString();

    const result: SubmitQuestSceneResult = {
      runId: run.id,
      completed: true,
      score: nextScore,
      xpEarned: scaledXpReward,
      coinsEarned: scaledCoinReward,
      progress: buildProgress({
        completedSceneCount,
        totalScenes: scenes.length,
        completed: true,
      }),
      evaluation: toPublicEvaluation(normalizedEvaluation),
      scene: null,
      completionSummary,
    };

    const questCompletedEvent: AtomicQuestEvent = {
      sceneId: currentScene.id,
      sceneCode: currentScene.scene_code,
      eventType: "quest_completed",
      metadata: {
        score: nextScore,
        xpEarned: scaledXpReward,
        coinsEarned: scaledCoinReward,
        completedAt,
      },
    };

    const committed =
      await commitAtomicQuestSubmission({
        runId: run.id,
        sceneId: currentScene.id,
        submissionId,
        attemptNumber,
        newStatus: "completed",
        newCurrentSceneId: null,
        newCurrentSceneCode: null,
        newCompletedSceneCount: completedSceneCount,
        newScore: nextScore,
        newXpEarned: scaledXpReward,
        newCoinsEarned: scaledCoinReward,

        /*
         * completeQuest() previously did not persist nextState
         * on the final scene. null preserves that behavior.
         */
        newState: null,

        completedAt,
        result,
        events: [
          submissionEvent,
          sceneCompletedEvent,
          questCompletedEvent,
        ],
        conversationMessages,
      });

    if (committed.committed) {
      await saveLearningSideEffects({
        userId,
        scene: currentScene,
        userInput,
        evaluation: normalizedEvaluation,
      });
    }

    return committed.result;
  }

  const nextScene = progression.nextScene;

  const result: SubmitQuestSceneResult = {
    runId: run.id,
    completed: false,
    score: nextScore,
    xpEarned: run.xp_earned,
    coinsEarned: run.coins_earned,
    progress: buildProgress({
      completedSceneCount,
      totalScenes: scenes.length,
      completed: false,
    }),
    evaluation: toPublicEvaluation(normalizedEvaluation),
    scene: mapPublicScene(nextScene),
  };

  const committed =
    await commitAtomicQuestSubmission({
      runId: run.id,
      sceneId: currentScene.id,
      submissionId,
      attemptNumber,
      newStatus: run.status,
      newCurrentSceneId: nextScene.id,
      newCurrentSceneCode: nextScene.scene_code,
      newCompletedSceneCount: completedSceneCount,
      newScore: nextScore,
      newXpEarned: run.xp_earned,
      newCoinsEarned: run.coins_earned,
      newState: nextState,
      completedAt: run.completed_at ?? null,
      result,
      events: [
        submissionEvent,
        sceneCompletedEvent,
        buildScenePresentedEvent({
          scene: nextScene,
          retry: false,
          previousScene: currentScene,
        }),
      ],
      conversationMessages,
    });

  if (committed.committed) {
    await saveLearningSideEffects({
      userId,
      scene: currentScene,
      userInput,
      evaluation: normalizedEvaluation,
    });
  }

  return committed.result;
}
