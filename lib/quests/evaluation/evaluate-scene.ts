import { QuestEngineError } from "../errors";

import { evaluateAIScene } from "./evaluate-ai-scene";
import { evaluateStaticScene } from "./evaluate-static-scene";

import type {
  EvaluateQuestSceneInput,
  EvaluateQuestSceneOptions,
  QuestSceneEvaluationMode,
  QuestSceneEvaluationResult,
} from "./types";

function resolveMode(
  input: EvaluateQuestSceneInput,
): QuestSceneEvaluationMode {
  return (
    input.scene.evaluation_config
      ?.mode ??
    "exact"
  );
}

function validateAiResult(
  result:
    QuestSceneEvaluationResult,
): QuestSceneEvaluationResult {
  if (
    typeof result.scoreAwarded !==
      "number" ||
    !Number.isFinite(
      result.scoreAwarded,
    ) ||
    result.scoreAwarded < 0
  ) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "AI evaluator returned an invalid score",
    );
  }

  return {
    ...result,
    mode: "ai",
  };
}

export async function evaluateQuestScene(
  input: EvaluateQuestSceneInput,
  options:
    EvaluateQuestSceneOptions = {},
): Promise<QuestSceneEvaluationResult> {
  const mode = resolveMode(input);

  if (mode !== "ai") {
    return evaluateStaticScene(input);
  }

  const evaluator =
    options.aiEvaluator ??
    evaluateAIScene;

  try {
    const result =
      await evaluator(input);

    return validateAiResult(
      result,
    );
  } catch (error) {
    if (
      error instanceof
      QuestEngineError
    ) {
      throw error;
    }

    console.error(
      "AI scene evaluation failed:",
      error,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to evaluate AI scene",
      {
        sceneId:
          input.scene.id,
        sceneCode:
          input.scene.scene_code,
      },
    );
  }
}
