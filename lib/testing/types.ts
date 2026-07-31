export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const ASSESSMENT_TEST_TYPES = [
  "placement",
  "level",
  "practice",
] as const;

export type AssessmentTestType = (typeof ASSESSMENT_TEST_TYPES)[number];

export const ASSESSMENT_QUESTION_CATEGORIES = [
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "writing",
  "speaking",
] as const;

export type AssessmentQuestionCategory =
  (typeof ASSESSMENT_QUESTION_CATEGORIES)[number];

export const ASSESSMENT_QUESTION_TYPES = [
  "multiple_choice",
  "fill_gap",
  "reading_choice",
  "true_false",
  "matching",
  "open_response",
] as const;

export const ASSESSMENT_ANSWER_STATUSES = [
  "pending",
  "correct",
  "incorrect",
  "skipped",
] as const;

export type AssessmentAnswerStatus =
  (typeof ASSESSMENT_ANSWER_STATUSES)[number];

export type AssessmentQuestionType =
  (typeof ASSESSMENT_QUESTION_TYPES)[number];

export type AssessmentQuestionOption = {
  id: string;
  text: string;
};

export type MultipleChoiceCorrectAnswer = {
  optionId: string;
};

export type FillGapCorrectAnswer = {
  acceptedAnswers: string[];
  caseSensitive?: boolean;
};

export type TrueFalseCorrectAnswer = {
  value: boolean;
};

export type MatchingCorrectAnswer = {
  pairs: Array<{
    leftId: string;
    rightId: string;
  }>;
};

export type AssessmentCorrectAnswer =
  | MultipleChoiceCorrectAnswer
  | FillGapCorrectAnswer
  | TrueFalseCorrectAnswer
  | MatchingCorrectAnswer;

export type AssessmentQuestionRecord = {
  id: string;
  cefr_level: CefrLevel;
  category: AssessmentQuestionCategory;
  question_type: AssessmentQuestionType;
  question_code: string;
  prompt: string;
  passage: string | null;
  options: AssessmentQuestionOption[] | null;
  correct_answer: AssessmentCorrectAnswer | null;
  explanation_uk: string | null;
  difficulty: number;
  discrimination: number;
  estimated_time_seconds: number | null;
  topic: string | null;
  tags: string[];
  source: "manual" | "ai_assisted" | "imported";
  status: "draft" | "review" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

export type PublicAssessmentQuestion = {
  id: string;
  cefrLevel: CefrLevel;
  category: AssessmentQuestionCategory;
  questionType: AssessmentQuestionType;
  prompt: string;
  passage: string | null;
  options: AssessmentQuestionOption[] | null;
  difficulty: number;
  estimatedTimeSeconds: number | null;
  topic: string | null;
};

export type AssessmentTestRecord = {
  id: string;
  slug: string;
  name_uk: string;
  description_uk: string | null;
  test_type: AssessmentTestType;
  cefr_level: CefrLevel | null;
  question_count: number;
  passing_score: number | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PublicAssessmentTest = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  testType: AssessmentTestType;
  cefrLevel: CefrLevel | null;
  questionCount: number;
  passingScore: number | null;
};

export type AssessmentAttemptStatus =
  | "in_progress"
  | "completed"
  | "abandoned";

export type AssessmentAttemptRecord = {
  id: string;
  user_id: string;
  test_id: string;
  status: AssessmentAttemptStatus;
  current_question_index: number;
  answered_question_count: number;
  correct_answer_count: number;
  raw_score: number;
  max_score: number;
  percentage: number | null;
  passed: boolean | null;
  final_level: CefrLevel | null;
  confidence: number | null;
  current_ability: number | null;
  skipped_question_count: number;
  skill_scores: Record<string, number>;
  metadata: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type AssessmentAttemptItemRecord = {
  id: string;
  attempt_id: string;
  question_id: string;
  question_code: string;
  order_index: number;
  weight: number;
  question_snapshot: PublicAssessmentQuestion;
  user_answer: unknown;
  answer_status: AssessmentAnswerStatus;
  is_correct: boolean | null;
  raw_score: number | null;
  max_score: number;
  ai_evaluation: unknown;
  presented_at: string | null;
  response_time_ms: number | null;
  answered_at: string | null;
  created_at: string;
};

export type AssessmentAttemptDomainResultRecord = {
  id: string;
  attempt_id: string;
  category: AssessmentQuestionCategory;
  answered_count: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  raw_score: number;
  max_score: number;
  percentage: number | null;
  estimated_level: CefrLevel | null;
  ability: number | null;
  confidence: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
