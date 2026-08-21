import { QuestEngineError } from "../errors";

import type { QuestExpectedAnswer, QuestSceneRecord } from "../types";

import type {
  EvaluateQuestSceneInput,
  QuestSceneEvaluationMode,
  QuestSceneEvaluationResult,
} from "./types";

function getEvaluationMode(scene: QuestSceneRecord): QuestSceneEvaluationMode {
  return scene.evaluation_config?.mode ?? "exact";
}

function getPoints(scene: QuestSceneRecord): number {
  const points = scene.evaluation_config?.points;

  if (typeof points !== "number" || !Number.isFinite(points) || points < 0) {
    return 0;
  }

  return points;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim();
}

function normalizeCaseInsensitiveText(value: unknown): string | null {
  const text = normalizeText(value);

  if (text === null) {
    return null;
  }

  return text
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
}

function tokenizeComparableText(value: unknown): string[] | null {
  const normalized = normalizeCaseInsensitiveText(value);

  if (normalized === null) {
    return null;
  }

  return normalized
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function findNearAcceptedAnswer(
  userInput: unknown,
  acceptedAnswers: unknown[],
): string | null {
  const userTokens = tokenizeComparableText(userInput);

  if (!userTokens || userTokens.length === 0) {
    return null;
  }

  const optionalTokens = new Set(["please", "a", "an", "the"]);

  for (const answer of acceptedAnswers) {
    if (typeof answer !== "string") {
      continue;
    }

    const answerTokens = tokenizeComparableText(answer);

    if (!answerTokens || answerTokens.length === 0) {
      continue;
    }

    const userCore = userTokens.filter((token) => !optionalTokens.has(token));

    const answerCore = answerTokens.filter(
      (token) => !optionalTokens.has(token),
    );

    if (userCore.length !== answerCore.length) {
      continue;
    }

    const sameCore = userCore.every(
      (token, index) => token === answerCore[index],
    );

    if (sameCore) {
      return answer.trim();
    }
  }

  return null;
}

function classifyStaticError({
  userInput,
  suggestedAnswer,
  isAlmost,
}: {
  userInput: unknown;
  suggestedAnswer: string | null;
  isAlmost: boolean;
}): "spelling" | "word_choice" | "naturalness" | "none" {
  if (
    typeof userInput !== "string" ||
    !userInput.trim() ||
    !suggestedAnswer?.trim()
  ) {
    return "none";
  }

  const original = userInput.trim().toLocaleLowerCase();
  const corrected = suggestedAnswer.trim().toLocaleLowerCase();

  if (original === corrected) {
    return "none";
  }

  const normalizeWords = (value: string) =>
    value
      .replace(/[^\p{L}\p{N}'’]+/gu, " ")
      .replace(/[’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);

  const originalWords = normalizeWords(original);
  const correctedWords = normalizeWords(corrected);

  /*
   * Same number of words + only a very small character difference
   * usually means spelling rather than word choice.
   *
   * Example:
   * "No thank yo" -> "No, thank you."
   */
  if (originalWords.length === correctedWords.length) {
    let changedWords = 0;

    for (let index = 0; index < originalWords.length; index += 1) {
      if (originalWords[index] !== correctedWords[index]) {
        changedWords += 1;
      }
    }

    if (changedWords === 1) {
      const originalChanged = originalWords.find(
        (word, index) => word !== correctedWords[index],
      );

      const correctedChanged = correctedWords.find(
        (word, index) => word !== originalWords[index],
      );

      if (
        originalChanged &&
        correctedChanged &&
        Math.abs(originalChanged.length - correctedChanged.length) <= 2
      ) {
        return "spelling";
      }
    }
  }

  /*
   * Near accepted answers usually preserve the intended meaning
   * but differ in phrasing/politeness/naturalness.
   */
  if (isAlmost) {
    return "naturalness";
  }

  return "word_choice";
}

function serializeComparableValue(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((item) => JSON.parse(serializeComparableValue(item))),
    );
  }

  const objectValue = value as Record<string, unknown>;

  const sortedObject = Object.keys(objectValue)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = objectValue[key];
      return result;
    }, {});

  return JSON.stringify(sortedObject);
}

function valuesAreEqual(left: unknown, right: unknown): boolean {
  return serializeComparableValue(left) === serializeComparableValue(right);
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

  if (Array.isArray(expectedAnswer.acceptedAnswers)) {
    answers.push(...expectedAnswer.acceptedAnswers);
  }

  return answers;
}

function evaluateExact(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  return acceptedAnswers.some((answer) => valuesAreEqual(userInput, answer));
}

function evaluateCaseInsensitive(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  const normalizedInput = normalizeCaseInsensitiveText(userInput);

  if (normalizedInput === null) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeCaseInsensitiveText(answer);

    return normalizedAnswer === normalizedInput;
  });
}

function evaluateCaseInsensitiveNaturalExtension(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  const userTokens = tokenizeComparableText(userInput);

  if (!userTokens || userTokens.length === 0) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const answerTokens = tokenizeComparableText(answer);

    if (
      !answerTokens ||
      answerTokens.length === 0 ||
      userTokens.length < answerTokens.length
    ) {
      return false;
    }

    return answerTokens.every((token, index) => userTokens[index] === token);
  });
}

function evaluateContains(
  userInput: unknown,
  acceptedAnswers: unknown[],
): boolean {
  const normalizedInput = normalizeCaseInsensitiveText(userInput);

  if (normalizedInput === null) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeCaseInsensitiveText(answer);

    return (
      normalizedAnswer !== null && normalizedInput.includes(normalizedAnswer)
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

  const directInputKey = typeof userInput === "string" ? userInput : null;

  if (directInputKey && typeof branching[directInputKey] === "string") {
    return branching[directInputKey];
  }

  const outcomeKey = isCorrect ? "correct" : "incorrect";

  if (typeof branching[outcomeKey] === "string") {
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

      nextSceneCode: scene.next_scene_code,

      normalizedInput: userInput,

      metadata: {
        attemptNumber,
        requiresManualReview: true,
      },
    };
  }

  const acceptedAnswers = getAcceptedAnswers(scene.expected_answer);

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
      isCorrect = evaluateExact(userInput, acceptedAnswers);
      break;

    case "case_insensitive": {
      const allowNaturalExtension =
        scene.evaluation_config?.allowNaturalExtension === true;

      isCorrect =
        evaluateCaseInsensitive(userInput, acceptedAnswers) ||
        (allowNaturalExtension &&
          evaluateCaseInsensitiveNaturalExtension(userInput, acceptedAnswers));

      break;
    }

    case "contains":
      isCorrect = evaluateContains(userInput, acceptedAnswers);
      break;
  }

  const nearAcceptedAnswer =
    !isCorrect && mode === "case_insensitive"
      ? findNearAcceptedAnswer(userInput, acceptedAnswers)
      : null;

  const isAlmost = nearAcceptedAnswer !== null;

  const points = getPoints(scene);

  const almostFeedback =
    isAlmost && typeof userInput === "string" && nearAcceptedAnswer
      ? [
          "Майже правильно. Основний зміст ви передали.",
          "",
          "Що саме виправити:",
          `❌ ${userInput.trim()}`,
          `✅ ${nearAcceptedAnswer}`,
          "",
          "Чому саме так:",
          "Ваш варіант зрозумілий, але рекомендований варіант точніше передає фразу завдання або звучить природніше в цій ситуації.",
        ].join("\n")
      : null;

  const suggestedAnswer =
    nearAcceptedAnswer ??
    acceptedAnswers.find(
      (answer): answer is string =>
        typeof answer === "string" && answer.trim().length > 0,
    ) ??
    null;

  const staticErrorType = isCorrect
    ? "none"
    : classifyStaticError({
        userInput,
        suggestedAnswer,
        isAlmost,
      });

  return {
    mode,
    isCorrect: isCorrect || isAlmost,
    grade: isCorrect ? "correct" : isAlmost ? "almost" : "incorrect",
    scoreAwarded: isCorrect ? points : isAlmost ? Math.round(points * 0.7) : 0,
    feedback: isCorrect
      ? (scene.evaluation_config?.feedbackCorrect ?? null)
      : isAlmost
        ? almostFeedback
        : (scene.evaluation_config?.feedbackIncorrect ?? null),
    nextSceneCode: resolveNextSceneCode({
      scene,
      userInput,
      isCorrect: isCorrect || isAlmost,
    }),
    normalizedInput:
      typeof userInput === "string" ? userInput.trim() : userInput,
    metadata: {
      attemptNumber,
      acceptedAnswerCount: acceptedAnswers.length,

      errorType: staticErrorType,

      originalFragment:
        !isCorrect && typeof userInput === "string" ? userInput.trim() : "",

      correctedFragment: !isCorrect ? (suggestedAnswer ?? "") : "",

      suggestedAnswer: suggestedAnswer ?? "",
    },
  };
}
