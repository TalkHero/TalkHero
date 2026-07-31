import type {
  QuestJsonObject,
  QuestSceneRecord,
} from "../types";

export type QuestSceneEvaluationMode =
  | "exact"
  | "case_insensitive"
  | "contains"
  | "manual"
  | "ai";

export type EvaluateQuestSceneInput = {
  scene: QuestSceneRecord;
  userInput: unknown;
  attemptNumber: number;
  runState: QuestJsonObject;
};

export type QuestSceneEvaluationResult = {
  mode: QuestSceneEvaluationMode;

  isCorrect: boolean | null;
  scoreAwarded: number;

  feedback: string | null;
  nextSceneCode: string | null;

  normalizedInput: unknown;
  metadata: QuestJsonObject;
};

export type AiQuestSceneEvaluator = (
  input: EvaluateQuestSceneInput,
) => Promise<QuestSceneEvaluationResult>;

export type EvaluateQuestSceneOptions = {
  aiEvaluator?: AiQuestSceneEvaluator;
};
