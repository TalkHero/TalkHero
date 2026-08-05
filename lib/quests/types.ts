export type QuestCefrLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

export type QuestContentStatus =
  | "draft"
  | "published"
  | "archived";

export type QuestType =
  | "conversation"
  | "story"
  | "grammar"
  | "vocabulary"
  | "speaking";

export type QuestSceneType =
  | "narration"
  | "dialogue"
  | "choice"
  | "input"
  | "translate"
  | "voice"
  | "completion";

export type QuestRunStatus =
  | "in_progress"
  | "completed"
  | "abandoned"
  | "failed";

export type QuestRunEventType =
  | "scene_presented"
  | "answer_submitted"
  | "choice_selected"
  | "scene_completed"
  | "quest_completed";

export type QuestJsonObject =
  Record<string, unknown>;

export type LearningFeedbackCategory =
  | "grammar"
  | "vocabulary"
  | "politeness"
  | "pronunciation"
  | "natural"
  | "culture";

export type LearningFeedback = {
  encouragement: string;

  naturalAnswer?: string;

  explanation: string;

  remember?: string;

  npcReply?: string;

  category?: LearningFeedbackCategory;

  errorType?:
    | "grammar"
    | "vocabulary"
    | "word_order"
    | "naturalness"
    | "politeness"
    | "relevance"
    | "none";

  originalFragment?: string;

  correctedFragment?: string;
};

export type QuestSceneOption = {
  id: string;
  text: string;
  value?: unknown;
  nextSceneCode?: string;
  metadata?: QuestJsonObject;
};

export type QuestExpectedAnswer = {
  optionId?: string;
  value?: unknown;
  acceptedAnswers?: unknown[];
  caseSensitive?: boolean;
};

export type QuestBranchingConfig =
  Record<string, string>;

export type QuestEvaluationConfig = {
  mode?:
    | "exact"
    | "case_insensitive"
    | "contains"
    | "manual"
    | "ai";
  points?: number;
  allowRetry?: boolean;
  maxAttempts?: number;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
  metadata?: QuestJsonObject;
};

export type QuestCampaignRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cefr_level: QuestCefrLevel | null;
  status: QuestContentStatus;
  order_index: number;
  metadata: QuestJsonObject;
  created_at: string;
  updated_at: string;
};

export type QuestEpisodeRecord = {
  id: string;
  campaign_id: string;
  slug: string;
  title: string;
  description: string | null;
  order_index: number;
  status: QuestContentStatus;
  metadata: QuestJsonObject;
  created_at: string;
  updated_at: string;
};

export type QuestActRecord = {
  id: string;
  quest_id: string;
  act_code: string;
  title: string;
  description: string | null;
  order_index: number;
  status: QuestContentStatus;
  checkpoint: boolean;
  metadata: QuestJsonObject;
  created_at: string;
  updated_at: string;
};

export type QuestRecord = {
  id: string;
  episode_id: string;
  slug: string;
  title: string;
  description: string | null;
  quest_type: QuestType;
  cefr_level: QuestCefrLevel | null;
  order_index: number;
  estimated_minutes: number | null;
  xp_reward: number;
  coin_reward: number;
  status: QuestContentStatus;
  config: QuestJsonObject;
  metadata: QuestJsonObject;
  created_at: string;
  updated_at: string;
};

export type QuestSceneRecord = {
  id: string;
  quest_id: string;
  scene_code: string;
  order_index: number;
  scene_type: QuestSceneType;
  speaker: string | null;
  content: string;
  prompt: string | null;
  options: QuestSceneOption[];
  expected_answer:
    QuestExpectedAnswer | null;
  next_scene_code: string | null;
  branching: QuestBranchingConfig;
  evaluation_config:
    QuestEvaluationConfig;
  metadata: QuestJsonObject;
  created_at: string;
  updated_at: string;
  act_id: string;
};

export type QuestRunRecord = {
  id: string;
  user_id: string;
  quest_id: string;
  status: QuestRunStatus;
  current_scene_id: string | null;
  current_scene_code: string | null;
  completed_scene_count: number;
  score: number;
  max_score: number;
  xp_earned: number;
  coins_earned: number;
  state: QuestJsonObject;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type QuestRunEventRecord = {
  id: string;
  run_id: string;
  scene_id: string | null;
  scene_code: string;
  event_type: QuestRunEventType;
  user_input: unknown;
  evaluation:
    QuestJsonObject | null;
  is_correct: boolean | null;
  score_awarded: number | null;
  response_time_ms: number | null;
  metadata: QuestJsonObject;
  created_at: string;
};

export type PublicQuestCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  cefrLevel: QuestCefrLevel | null;
  orderIndex: number;
};

export type PublicQuestEpisode = {
  id: string;
  campaignId: string;
  slug: string;
  title: string;
  description: string | null;
  orderIndex: number;
};

export type PublicQuest = {
  id: string;
  episodeId: string;
  slug: string;
  title: string;
  description: string | null;
  questType: QuestType;
  cefrLevel: QuestCefrLevel | null;
  orderIndex: number;
  estimatedMinutes: number | null;
  xpReward: number;
  coinReward: number;
};

export type PublicQuestAct = {
  id: string;
  questId: string;
  actCode: string;
  title: string;
  description: string | null;
  orderIndex: number;
  checkpoint: boolean;
};

export type PublicQuestScene = {
  id: string;
  sceneCode: string;
  orderIndex: number;
  sceneType: QuestSceneType;
  speaker: string | null;
  content: string;
  prompt: string | null;
  options: QuestSceneOption[];
  metadata: QuestJsonObject;
  actId: string;
};

export type QuestProgress = {
  current: number;
  total: number;
  completed: number;
};

export type StartedQuest = {
  runId: string;
  resumed: boolean;
  quest: PublicQuest;
  progress: QuestProgress;
  scene: PublicQuestScene;
};

export type QuestEvaluationGrade =
  | "correct"
  | "almost"
  | "incorrect";

export type QuestSceneEvaluation = {
  isCorrect: boolean | null;

  grade:
    | QuestEvaluationGrade
    | null;

  scoreAwarded: number;

  feedback:
    | string
    | LearningFeedback
    | null;

  nextSceneCode: string | null;

  metadata: QuestJsonObject;
};

export type SubmitQuestSceneResult = {
  runId: string;
  completed: boolean;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  progress: QuestProgress;
  evaluation: QuestSceneEvaluation;
  scene: PublicQuestScene | null;
};

