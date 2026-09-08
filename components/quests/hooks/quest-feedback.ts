import type {
  PublicQuestScene,
  QuestSceneEvaluation,
  SubmitQuestSceneResult,
} from "@/lib/quests";

export type PendingQuestFeedback = {
  answeredScene: PublicQuestScene;
  evaluation: QuestSceneEvaluation;
  result: SubmitQuestSceneResult;
  userInput: unknown;
};
