import type { QuestJsonObject, QuestRunEventRecord } from "./types";

export type QuestCompletionSummary = {
  strengths: string[];
  improvements: string[];
};

type EvaluationGrade = "correct" | "almost" | "incorrect";

type AIErrorType =
  | "grammar"
  | "vocabulary"
  | "word_order"
  | "naturalness"
  | "politeness"
  | "relevance"
  | "none";

function asObject(value: unknown): QuestJsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as QuestJsonObject)
    : null;
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

function getStringArray(value: QuestJsonObject | null, key: string): string[] {
  if (!value) {
    return [];
  }

  const candidate = value[key];

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();

  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);

    const key = normalized.toLocaleLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function getGrade(evaluation: QuestJsonObject): EvaluationGrade | null {
  const grade = getString(evaluation, "grade");

  if (grade === "correct" || grade === "almost" || grade === "incorrect") {
    return grade;
  }

  return null;
}

function getEvaluationMetadata(
  evaluation: QuestJsonObject,
): QuestJsonObject | null {
  return asObject(evaluation.metadata);
}

function getEvaluationMode(evaluation: QuestJsonObject): string | null {
  return getString(evaluation, "mode");
}

function getErrorType(
  evaluation: QuestJsonObject,
  event: QuestRunEventRecord,
): AIErrorType | null {
  const metadata = getEvaluationMetadata(evaluation);

  const candidate =
    getString(metadata, "errorType") ?? getString(event.metadata, "errorType");

  switch (candidate) {
    case "grammar":
    case "vocabulary":
    case "word_order":
    case "naturalness":
    case "politeness":
    case "relevance":
    case "none":
      return candidate;

    default:
      return null;
  }
}

function extractSuggestedAnswer(feedback: string | null): string | null {
  if (!feedback) {
    return null;
  }

  const normalized = feedback.trim();

  const prefixes = ["Спробуйте:", "Try:", "Correct answer:", "Natural answer:"];

  for (const prefix of prefixes) {
    const index = normalized.indexOf(prefix);

    if (index === -1) {
      continue;
    }

    const value = normalized
      .slice(index + prefix.length)
      .split(/\r?\n|\n\n/)[0]
      ?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function stripWrappingQuotes(value: string): string {
  return value
    .trim()
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")
    .trim();
}

function buildStaticImprovement(
  event: QuestRunEventRecord,
  evaluation: QuestJsonObject,
): string | null {
  const userInput =
    typeof event.user_input === "string" ? event.user_input.trim() : null;

  const feedback = getString(evaluation, "feedback");

  const suggested = extractSuggestedAnswer(feedback);

  if (userInput && suggested) {
    return `${stripWrappingQuotes(userInput)} → ${stripWrappingQuotes(
      suggested,
    )}`;
  }

  if (suggested) {
    return `Повторіть: ${stripWrappingQuotes(suggested)}`;
  }

  if (feedback) {
    return normalizeText(feedback);
  }

  return null;
}

function buildAIImprovement(
  event: QuestRunEventRecord,
  evaluation: QuestJsonObject,
): string | null {
  const metadata = getEvaluationMetadata(evaluation);

  const improvements = getStringArray(metadata, "improvements");

  if (improvements.length > 0) {
    return improvements[0];
  }

  const originalFragment = getString(metadata, "originalFragment");

  const correctedFragment = getString(metadata, "correctedFragment");

  if (
    originalFragment &&
    correctedFragment &&
    normalizeText(originalFragment).toLocaleLowerCase() !==
      normalizeText(correctedFragment).toLocaleLowerCase()
  ) {
    return `${stripWrappingQuotes(originalFragment)} → ${stripWrappingQuotes(
      correctedFragment,
    )}`;
  }

  const errorType = getErrorType(evaluation, event);

  switch (errorType) {
    case "grammar":
      return "Повторіть граматичну конструкцію, у якій була неточність.";

    case "vocabulary":
      return "Повторіть потрібне слово або вираз.";

    case "word_order":
      return "Зверніть увагу на порядок слів в англійському реченні.";

    case "naturalness":
      return "Попрактикуйте природніше формулювання цієї думки.";

    case "politeness":
      return "Повторіть ввічливі фрази для цієї ситуації.";

    case "relevance":
      return "Уважніше відповідайте саме на поточне запитання.";

    default:
      break;
  }

  const feedback = getString(evaluation, "feedback");

  if (feedback) {
    return normalizeText(feedback);
  }

  return null;
}

function buildStaticStrength(evaluation: QuestJsonObject): string | null {
  const feedback = getString(evaluation, "feedback");

  if (!feedback) {
    return "Ви правильно виконали завдання.";
  }

  return normalizeText(feedback);
}

function buildAIStrengths(evaluation: QuestJsonObject): string[] {
  const metadata = getEvaluationMetadata(evaluation);

  const strengths = getStringArray(metadata, "strengths");

  if (strengths.length > 0) {
    return strengths;
  }

  const feedback = getString(evaluation, "feedback");

  if (feedback) {
    return [normalizeText(feedback)];
  }

  return ["Ви успішно виконали комунікативне завдання."];
}

function isRelevantSubmissionEvent(event: QuestRunEventRecord): boolean {
  /*
   * answer_submitted already contains the learner answer
   * and evaluation. scene_completed duplicates the same
   * evaluation, so including both makes completion summaries
   * noisy and potentially repetitive.
   */
  return event.event_type === "answer_submitted";
}

export function buildQuestCompletionSummary(
  events: QuestRunEventRecord[],
): QuestCompletionSummary {
  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const event of events) {
    if (!isRelevantSubmissionEvent(event)) {
      continue;
    }

    const evaluation = event.evaluation;

    if (!evaluation) {
      continue;
    }

    const grade = getGrade(evaluation);

    if (!grade) {
      continue;
    }

    const mode = getEvaluationMode(evaluation);

    const isAI = mode === "ai";

    if (grade === "correct") {
      if (isAI) {
        strengths.push(...buildAIStrengths(evaluation));
      } else {
        const strength = buildStaticStrength(evaluation);

        if (strength) {
          strengths.push(strength);
        }
      }

      continue;
    }

    if (grade === "almost" || grade === "incorrect") {
      const improvement = isAI
        ? buildAIImprovement(event, evaluation)
        : buildStaticImprovement(event, evaluation);

      if (improvement) {
        improvements.push(improvement);
      }
    }
  }

  return {
    strengths: unique(strengths).slice(0, 3),

    improvements: unique(improvements).slice(0, 3),
  };
}
