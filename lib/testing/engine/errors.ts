export type AssessmentEngineErrorCode =
  | "TEST_NOT_FOUND"
  | "BLUEPRINT_NOT_FOUND"
  | "NOT_ENOUGH_QUESTIONS"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_NOT_IN_PROGRESS"
  | "ATTEMPT_CREATE_FAILED"
  | "ATTEMPT_ITEMS_CREATE_FAILED"
  | "ATTEMPT_LOAD_FAILED"
  | "QUESTION_NOT_FOUND"
  | "QUESTION_OUT_OF_SEQUENCE"
  | "QUESTION_ALREADY_ANSWERED"
  | "INVALID_ANSWER"
  | "ANSWER_SUBMIT_FAILED"
  | "QUESTION_SKIP_FAILED";

export class AssessmentEngineError extends Error {
  readonly code: AssessmentEngineErrorCode;

  readonly details?: Record<string, unknown>;

  constructor(
    code: AssessmentEngineErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);

    this.name = "AssessmentEngineError";
    this.code = code;
    this.details = details;
  }
}
