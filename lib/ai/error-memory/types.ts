export type ErrorType =
  | "grammar"
  | "vocabulary"
  | "spelling"
  | "word_choice"
  | "pronunciation"
  | "naturalness";

export type UserLanguageError = {
  id: string;
  user_id: string;
  error_type: ErrorType;
  error_key: string;
  original_text: string;
  corrected_text: string;
  explanation: string | null;
  occurrence_count: number;
  successful_uses: number;
  is_mastered: boolean;
  first_seen_at: string;
  last_seen_at: string;
  last_success_at: string | null;
  mastered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ErrorSummary = {
  type: ErrorType;
  key: string;
  correctedText: string;
  count: number;
};

export type DetectedLanguageError = {
  errorType: ErrorType;
  errorKey: string;
  originalText: string;
  correctedText: string;
  explanation: string | null;
};

export type AnalyzeErrorsInput = {
  userId: string;
  userMessage: string;
  assistantMessage: string;
};

export type SaveErrorsInput = {
  userId: string;
  errors: DetectedLanguageError[];
};

export type MasteryCheckInput = {
  userId: string;
  userMessage: string;
};

export type MasteryCheckResult = {
  successfulErrorKeys: string[];
  masteredErrorKeys: string[];
};
