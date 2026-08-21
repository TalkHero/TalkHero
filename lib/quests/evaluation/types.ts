import type { QuestJsonObject, QuestSceneRecord } from "../types";

export type QuestLanguageErrorContext = {
  errorKey: string;
  errorType: string;
  originalText: string;
  correctedText: string;
  explanation: string | null;
  occurrenceCount: number;
  successfulUses: number;
};

export type QuestReinforcementTarget = QuestLanguageErrorContext;

export type QuestSceneEvaluationMode =
  "exact" | "case_insensitive" | "contains" | "manual" | "ai";

export type EvaluateQuestSceneInput = {
  scene: QuestSceneRecord;
  userInput: unknown;
  attemptNumber: number;
  runState: QuestJsonObject;
  languageErrors?: QuestLanguageErrorContext[];
  reinforcementTarget?: QuestReinforcementTarget | null;
};

export type QuestSceneEvaluationResult = {
  mode: QuestSceneEvaluationMode;

  isCorrect: boolean | null;
  scoreAwarded: number;

  feedback: string | null;
  nextSceneCode: string | null;

  normalizedInput: unknown;
  metadata: QuestJsonObject;

  grade: "correct" | "almost" | "incorrect" | null;
};

export type AiQuestSceneEvaluator = (
  input: EvaluateQuestSceneInput,
) => Promise<QuestSceneEvaluationResult>;

export type EvaluateQuestSceneOptions = {
  aiEvaluator?: AiQuestSceneEvaluator;
};
