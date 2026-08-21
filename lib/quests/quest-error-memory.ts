import { saveErrors } from "@/lib/ai/error-memory";

import type { DetectedLanguageError, ErrorType } from "@/lib/ai/error-memory";
import type { QuestSceneEvaluationResult } from "./evaluation";
import type { QuestJsonObject } from "./types";
type SaveQuestLanguageErrorsInput = {
  userId: string;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
};

function asObject(value: unknown): QuestJsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as QuestJsonObject;
}

function getString(value: QuestJsonObject | null, key: string): string | null {
  if (!value) {
    return null;
  }

  const candidate = value[key];

  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string): string {
  return normalizeText(value)
    .toLocaleLowerCase()
    .replace(/[.!?,;:'"“”‘’()[\]{}\-–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPunctuationOnlyCorrection(
  originalText: string,
  correctedText: string,
): boolean {
  return (
    normalizeForComparison(originalText) ===
    normalizeForComparison(correctedText)
  );
}

function mapQuestErrorType(value: string | null): ErrorType | null {
  switch (value) {
    case "grammar":
      return "grammar";

    case "vocabulary":
      return "vocabulary";

    case "word_order":
      return "grammar";

    case "naturalness":
      return "naturalness";

    case "politeness":
      return "naturalness";

    case "spelling":
      return "spelling";

    case "word_choice":
      return "word_choice";

    case "pronunciation":
      return "pronunciation";

    /*
     * Relevance is a task/communication error,
     * not a reusable language-form error.
     */
    case "relevance":
    case "none":
    default:
      return null;
  }
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeExplicitErrorKey(
  value: string | null,
  errorType: ErrorType,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  if (!normalized) {
    return null;
  }

  const separatorIndex = normalized.indexOf(":");

  const keyBody =
    separatorIndex >= 0 ? normalized.slice(separatorIndex + 1) : normalized;

  if (!keyBody) {
    return null;
  }

  return `${errorType}:${keyBody}`.slice(0, 120);
}

function findChangedWordPair(
  originalText: string,
  correctedText: string,
): {
  originalWord: string;
  correctedWord: string;
} | null {
  const tokenize = (value: string) =>
    value
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}'’]+/gu, " ")
      .replace(/[’]/g, "'")
      .trim()
      .split(/\s+/g)
      .filter(Boolean);

  const originalWords = tokenize(originalText);
  const correctedWords = tokenize(correctedText);

  if (
    originalWords.length === 0 ||
    originalWords.length !== correctedWords.length
  ) {
    return null;
  }

  const differences: Array<{
    originalWord: string;
    correctedWord: string;
  }> = [];

  for (let index = 0; index < originalWords.length; index += 1) {
    if (originalWords[index] === correctedWords[index]) {
      continue;
    }

    differences.push({
      originalWord: originalWords[index],
      correctedWord: correctedWords[index],
    });
  }

  return differences.length === 1 ? differences[0] : null;
}

function buildErrorKey({
  errorType,
  originalText,
  correctedText,
}: {
  errorType: ErrorType;
  originalText: string;
  correctedText: string;
}): string | null {
  const original = slugify(originalText);

  const corrected = slugify(correctedText);

  if (!corrected) {
    return null;
  }

  if (errorType === "spelling") {
    const changedWord = findChangedWordPair(originalText, correctedText);

    if (changedWord) {
      const correctedWord = slugify(changedWord.correctedWord);

      if (correctedWord) {
        return `spelling:${correctedWord}`.slice(0, 120);
      }
    }
  }

  /*
   * For quest evaluations we do not want to use a complete
   * arbitrary sentence as the identity of an error.
   *
   * The correction is normally a short target phrase, so we
   * use the corrected form as the stable reusable target.
   */
  const target = corrected.split("-").filter(Boolean).slice(0, 8).join("-");

  if (!target) {
    return null;
  }

  /*
   * Add a small distinction when the original and corrected
   * forms would otherwise collapse to the same slug.
   */
  if (original && original !== corrected) {
    const originalTarget = original
      .split("-")
      .filter(Boolean)
      .slice(0, 4)
      .join("-");

    if (originalTarget && target.length < 20) {
      return `${errorType}:${originalTarget}-to-${target}`.slice(0, 120);
    }
  }

  return `${errorType}:${target}`.slice(0, 120);
}

function buildExplanation(
  metadata: QuestJsonObject,
  errorType: ErrorType,
): string | null {
  const explicit = getString(metadata, "explanationUk");

  if (explicit) {
    return explicit;
  }

  switch (errorType) {
    case "grammar":
      return "Зверніть увагу на граматичну структуру цієї фрази.";

    case "vocabulary":
      return "Повторіть потрібне слово або вираз у цьому контексті.";

    case "spelling":
      return "Зверніть увагу на правильне написання цього слова.";

    case "word_choice":
      return "У цьому контексті природніше використати інше слово або вираз.";

    case "pronunciation":
      return "Зверніть увагу на вимову цієї фрази.";

    case "naturalness":
      return "Цю думку англійською природніше сформулювати саме так.";
  }
}

function buildDetectedLanguageError(
  evaluation: QuestSceneEvaluationResult,
  userInput: unknown,
): DetectedLanguageError | null {
  /*
   * Correct answers must never create a new error-memory entry.
   */
  if (evaluation.grade === "correct") {
    return null;
  }

  const metadata = asObject(evaluation.metadata);

  if (!metadata) {
    return null;
  }

  const questErrorType = getString(metadata, "errorType");

  const errorType = mapQuestErrorType(questErrorType);

  if (!errorType) {
    return null;
  }

  const explicitErrorKey = normalizeExplicitErrorKey(
    getString(metadata, "errorKey"),
    errorType,
  );

  const originalText =
    getString(metadata, "originalFragment") ??
    (typeof userInput === "string" ? userInput.trim() : null);

  const correctedText =
    getString(metadata, "correctedFragment") ??
    getString(metadata, "suggestedAnswer");

  if (!originalText || !correctedText) {
    return null;
  }

  const normalizedOriginal = normalizeText(originalText);

  const normalizedCorrected = normalizeText(correctedText);

  if (!normalizedOriginal || !normalizedCorrected) {
    return null;
  }

  if (
    normalizedOriginal.toLocaleLowerCase() ===
    normalizedCorrected.toLocaleLowerCase()
  ) {
    return null;
  }

  /*
   * Do not turn comma/full-stop/capitalization corrections
   * into long-term language mistakes.
   */
  if (isPunctuationOnlyCorrection(normalizedOriginal, normalizedCorrected)) {
    return null;
  }

  const errorKey =
    explicitErrorKey ??
    buildErrorKey({
      errorType,
      originalText: normalizedOriginal,
      correctedText: normalizedCorrected,
    });

  if (!errorKey) {
    return null;
  }

  const spellingWordPair =
    errorType === "spelling"
      ? findChangedWordPair(normalizedOriginal, normalizedCorrected)
      : null;

  const memoryOriginalText =
    spellingWordPair?.originalWord ?? normalizedOriginal;

  const memoryCorrectedText =
    spellingWordPair?.correctedWord ?? normalizedCorrected;

  return {
    errorType,
    errorKey,
    originalText: memoryOriginalText,
    correctedText: memoryCorrectedText,
    explanation: buildExplanation(metadata, errorType),
  };
}

export function buildQuestLanguageErrors({
  userInput,
  evaluation,
}: Omit<SaveQuestLanguageErrorsInput, "userId">): DetectedLanguageError[] {
  const detected = buildDetectedLanguageError(evaluation, userInput);

  return detected ? [detected] : [];
}

export async function saveQuestLanguageErrors({
  userId,
  userInput,
  evaluation,
}: SaveQuestLanguageErrorsInput): Promise<DetectedLanguageError[]> {
  const errors = buildQuestLanguageErrors({
    userInput,
    evaluation,
  });

  if (errors.length === 0) {
    return [];
  }

  await saveErrors({
    userId,
    errors,
  });

  return errors;
}
