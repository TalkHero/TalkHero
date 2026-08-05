import { QuestEngineError } from "../errors";

import type {
  QuestExpectedAnswer,
  QuestSceneRecord,
} from "../types";

import type {
  EvaluateQuestSceneInput,
  QuestSceneEvaluationMode,
  QuestSceneEvaluationResult,
} from "./types";

function getEvaluationMode(
  scene: QuestSceneRecord,
): QuestSceneEvaluationMode {
  return scene.evaluation_config?.mode ?? "exact";
}

function getPoints(
  scene: QuestSceneRecord,
): number {
  const points = scene.evaluation_config?.points;

  if (
    typeof points !== "number" ||
    !Number.isFinite(points) ||
    points < 0
  ) {
    return 0;
  }

  return points;
}

function normalizeText(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim();
}

function normalizeCaseInsensitiveText(
  value: unknown,
): string | null {
  const text = normalizeText(value);

  return text === null
    ? null
    : text.toLocaleLowerCase();
}

function serializeComparableValue(
  value: unknown,
): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((item) =>
        JSON.parse(
          serializeComparableValue(item),
        ),
      ),
    );
  }

  const objectValue =
    value as Record<string, unknown>;

  const sortedObject = Object.keys(objectValue)
    .sort()
    .reduce<Record<string, unknown>>(
      (result, key) => {
        result[key] = objectValue[key];
        return result;
      },
      {},
    );

  return JSON.stringify(sortedObject);
}

function valuesAreEqual(
  left: unknown,
  right: unknown,
): boolean {
  return (
    serializeComparableValue(left) ===
    serializeComparableValue(right)
  );
}

function getAcceptedAnswers(
  expectedAnswer: QuestExpectedAnswer | null,
): unknown[] {
  if (!expectedAnswer) {
    return [];
  }

  const answers: unknown[] = [];

  if (expectedAnswer.optionId !== undefined) {
    answers.push(expectedAnswer.optionId);
  }

  if (expectedAnswer.value !== undefined) {
    answers.push(expectedAnswer.value);
  }

  if (
    Array.isArray(
      expectedAnswer.acceptedAnswers,
    )
  ) {
    answers.push(
      ...expectedAnswer.acceptedAnswers,
    );
  }

  return answers;
}

function evaluateExact(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  return acceptedAnswers.some(
    (answer) =>
      valuesAreEqual(userInput, answer),
  );
}

function evaluateCaseInsensitive(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  const normalizedInput =
    normalizeCaseInsensitiveText(userInput);

  if (normalizedInput === null) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer =
      normalizeCaseInsensitiveText(answer);

    return normalizedAnswer === normalizedInput;
  });
}

function evaluateContains(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  const normalizedInput =
    normalizeCaseInsensitiveText(userInput);

  if (normalizedInput === null) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer =
      normalizeCaseInsensitiveText(answer);

    return (
      normalizedAnswer !== null &&
      normalizedInput.includes(
        normalizedAnswer,
      )
    );
  });
}

function resolveNextSceneCode({
  scene,
  userInput,
  isCorrect,
}: {
  scene: QuestSceneRecord;
  userInput: unknown;
  isCorrect: boolean;
}): string | null {
  const branching = scene.branching ?? {};

  const directInputKey =
    typeof userInput === "string"
      ? userInput
      : null;

  if (
    directInputKey &&
    typeof branching[directInputKey] ===
      "string"
  ) {
    return branching[directInputKey];
  }

  const outcomeKey = isCorrect
    ? "correct"
    : "incorrect";

  if (
    typeof branching[outcomeKey] ===
    "string"
  ) {
    return branching[outcomeKey];
  }

  return scene.next_scene_code;
}

export function evaluateStaticScene({
  scene,
  userInput,
  attemptNumber,
}: EvaluateQuestSceneInput): QuestSceneEvaluationResult {
  const mode = getEvaluationMode(scene);

  if (mode === "ai") {
    throw new QuestEngineError(
      "INVALID_SCENE_INPUT",
      "AI scenes must use the AI evaluator",
      {
        sceneId: scene.id,
        sceneCode: scene.scene_code,
      },
    );
  }

  if (mode === "manual") {
  return {
    mode,

    isCorrect: null,

    grade: null,

    scoreAwarded: 0,

    feedback: null,

    nextSceneCode:
      scene.next_scene_code,

    normalizedInput:
      userInput,

    metadata: {
      attemptNumber,
      requiresManualReview: true,
    },
  };
}

  const acceptedAnswers =
    getAcceptedAnswers(
      scene.expected_answer,
    );

  if (acceptedAnswers.length === 0) {
    throw new QuestEngineError(
      "INVALID_SCENE_INPUT",
      "Scene has no expected answer",
      {
        sceneId: scene.id,
        sceneCode: scene.scene_code,
        mode,
      },
    );
  }

  let isCorrect = false;

  switch (mode) {
    case "exact":
      isCorrect = evaluateExact(
        userInput,
        acceptedAnswers,
      );
      break;

    case "case_insensitive":
      isCorrect =
        evaluateCaseInsensitive(
          userInput,
          acceptedAnswers,
        );
      break;

    case "contains":
      isCorrect = evaluateContains(
        userInput,
        acceptedAnswers,
      );
      break;
  }

  const points = getPoints(scene);

  return {
    mode,
    isCorrect,
    grade: isCorrect
      ? "correct"
      : "incorrect",
    scoreAwarded: isCorrect ? points : 0,
    feedback: isCorrect
      ? scene.evaluation_config
          ?.feedbackCorrect ?? null
      : scene.evaluation_config
          ?.feedbackIncorrect ?? null,
    nextSceneCode: resolveNextSceneCode({
      scene,
      userInput,
      isCorrect,
    }),
    normalizedInput:
      typeof userInput === "string"
        ? userInput.trim()
        : userInput,
    metadata: {
      attemptNumber,
      acceptedAnswerCount:
        acceptedAnswers.length,
    },
  };
}
