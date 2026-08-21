export type QuestEngineErrorCode =
  | "CAMPAIGN_NOT_FOUND"
  | "EPISODE_NOT_FOUND"
  | "QUEST_NOT_FOUND"
  | "QUEST_NOT_PUBLISHED"
  | "QUEST_HAS_NO_SCENES"
  | "QUEST_RUN_NOT_FOUND"
  | "QUEST_RUN_CREATE_FAILED"
  | "QUEST_RUN_LOAD_FAILED"
  | "QUEST_RUN_NOT_IN_PROGRESS"
  | "QUEST_RUN_UPDATE_FAILED"
  | "SCENE_NOT_FOUND"
  | "SCENE_OUT_OF_SEQUENCE"
  | "SCENE_ALREADY_COMPLETED"
  | "INVALID_SCENE_INPUT"
  | "SCENE_SUBMIT_FAILED"
  | "QUEST_EVENT_CREATE_FAILED"
  | "QUEST_EVENT_LOAD_FAILED";

export class QuestEngineError extends Error {
  readonly code: QuestEngineErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: QuestEngineErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);

    this.name = "QuestEngineError";
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, QuestEngineError.prototype);
  }
}

export function isQuestEngineError(error: unknown): error is QuestEngineError {
  return error instanceof QuestEngineError;
}
