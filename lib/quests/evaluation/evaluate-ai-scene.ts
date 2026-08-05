import "server-only";

import {
  AI_CONVERSATION_SCHEMA,
  type AIConversationEvaluation,
} from "../ai/conversation-schema";
import {
  buildConversationPrompt,
} from "../ai/build-conversation-prompt";
import { QuestEngineError } from "../errors";

import type {
  EvaluateQuestSceneInput,
  QuestSceneEvaluationResult,
} from "./types";

type ResponsesAPIContent = {
  type?: unknown;
  text?: unknown;
  refusal?: unknown;
};

type ResponsesAPIOutput = {
  type?: unknown;
  content?: unknown;
};

type ResponsesAPIResult = {
  status?: unknown;
  output_text?: unknown;
  output?: unknown;
  incomplete_details?: unknown;
  error?: {
    message?: unknown;
  };
};

const DEFAULT_MODEL = "gpt-4o-mini";

function getAvailablePoints(
  input: EvaluateQuestSceneInput,
): number {
  const points =
    input.scene.evaluation_config?.points;

  return typeof points === "number" &&
    Number.isFinite(points) &&
    points >= 0
    ? points
    : 0;
}

function getMetadataNumber(
  input: EvaluateQuestSceneInput,
  key: string,
  fallback: number,
): number {
  const value =
    input.scene.metadata?.[key];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function getUserTurnCount(
  input: EvaluateQuestSceneInput,
): number {
  const history =
    input.runState.conversationHistory;

  if (!Array.isArray(history)) {
    return 1;
  }

  const previousUserTurns =
    history.filter((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        Array.isArray(entry)
      ) {
        return false;
      }

      return (
        (entry as Record<string, unknown>)
          .role === "user"
      );
    }).length;

  return previousUserTurns + 1;
}

function resolveNextSceneCode({
  input,
  goalReached,
}: {
  input: EvaluateQuestSceneInput;
  goalReached: boolean;
}): string | null {
  const branching =
    input.scene.branching ?? {};

  const outcomeKey =
    goalReached
      ? "correct"
      : "incorrect";

  if (
    typeof branching[outcomeKey] ===
    "string"
  ) {
    return branching[outcomeKey];
  }

  return goalReached
    ? input.scene.next_scene_code
    : input.scene.scene_code;
}

function extractOutputText(
  response: ResponsesAPIResult,
): string {
  if (
    typeof response.output_text === "string"
  ) {
    return response.output_text.trim();
  }

  if (!Array.isArray(response.output)) {
    return "";
  }

  for (const rawOutput of response.output) {
    if (
      !rawOutput ||
      typeof rawOutput !== "object"
    ) {
      continue;
    }

    const output =
      rawOutput as ResponsesAPIOutput;

    if (
      output.type !== "message" ||
      !Array.isArray(output.content)
    ) {
      continue;
    }

    for (const rawContent of output.content) {
      if (
        !rawContent ||
        typeof rawContent !== "object"
      ) {
        continue;
      }

      const content =
        rawContent as ResponsesAPIContent;

      if (
        content.type === "refusal" &&
        typeof content.refusal === "string"
      ) {
        throw new QuestEngineError(
          "SCENE_SUBMIT_FAILED",
          "AI evaluator refused the request",
          {
            refusal: content.refusal,
          },
        );
      }

      if (
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        return content.text.trim();
      }
    }
  }

  return "";
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "string",
    )
  );
}

function parseEvaluation(
  text: string,
): AIConversationEvaluation {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "AI evaluator returned invalid JSON",
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "AI evaluator returned an invalid object",
    );
  }

  const value =
    parsed as Record<string, unknown>;

  const allowedLevels = new Set([
    "below_A1",
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
    "unknown",
  ]);

    const allowedErrorTypes =
    new Set([
      "grammar",
      "vocabulary",
      "word_order",
      "naturalness",
      "politeness",
      "relevance",
      "none",
    ]);

  if (
    typeof value.isCorrect !== "boolean" ||
    typeof value.goalReached !== "boolean" ||
    typeof value.scorePercent !== "number" ||
    !Number.isInteger(value.scorePercent) ||
    value.scorePercent < 0 ||
    value.scorePercent > 100 ||
    typeof value.feedbackUk !== "string" ||
    typeof value.naturalAnswer !== "string" ||
    typeof value.npcReply !== "string" ||
    typeof value.detectedLevel !== "string" ||
    !allowedLevels.has(value.detectedLevel) ||
    !isStringArray(value.strengths) ||
    !isStringArray(value.improvements)
        ||
    typeof value.errorType !== "string" ||
    !allowedErrorTypes.has(
      value.errorType,
    ) ||
    typeof value.originalFragment !==
      "string" ||
    typeof value.correctedFragment !==
      "string" ||
    typeof value.explanationUk !==
      "string" ||
    typeof value.rememberUk !==
      "string"
  ) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "AI evaluator returned invalid fields",
    );
  }

  return {
    isCorrect: value.isCorrect,
    goalReached: value.goalReached,
    scorePercent: value.scorePercent,
    feedbackUk: value.feedbackUk.trim(),
    naturalAnswer: value.naturalAnswer.trim(),
    npcReply: value.npcReply.trim(),
    detectedLevel:
      value.detectedLevel as
        AIConversationEvaluation["detectedLevel"],
    strengths: value.strengths
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
    improvements: value.improvements
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
          errorType:
      value.errorType as
        AIConversationEvaluation["errorType"],

    originalFragment:
      value.originalFragment
        .trim()
        .slice(0, 160),

    correctedFragment:
      value.correctedFragment
        .trim()
        .slice(0, 160),

    explanationUk:
      value.explanationUk
        .trim()
        .slice(0, 500),

    rememberUk:
      value.rememberUk
        .trim()
        .slice(0, 300),
  };
}

function buildFeedback(
  evaluation: AIConversationEvaluation,
): string {
  const parts: string[] = [];

  if (evaluation.feedbackUk) {
    parts.push(
      evaluation.feedbackUk,
    );
  }

  if (evaluation.naturalAnswer) {
    parts.push(
      `Природніше англійською: ${evaluation.naturalAnswer}`,
    );
  }

  if (
    evaluation.originalFragment &&
    evaluation.correctedFragment &&
    evaluation.originalFragment !==
      evaluation.correctedFragment
  ) {
    parts.push(
      [
        "Що саме виправити:",
        `❌ ${evaluation.originalFragment}`,
        `✅ ${evaluation.correctedFragment}`,
      ].join("\n"),
    );
  }

  if (evaluation.explanationUk) {
    parts.push(
      `Чому саме так: ${evaluation.explanationUk}`,
    );
  }

  if (evaluation.rememberUk) {
    parts.push(
      `Запам'ятайте: ${evaluation.rememberUk}`,
    );
  }

  if (evaluation.npcReply) {
    parts.push(
      `Відповідь персонажа: ${evaluation.npcReply}`,
    );
  }

  return parts
    .filter(Boolean)
    .join("\n\n");
}

export async function evaluateAIScene(
  input: EvaluateQuestSceneInput,
): Promise<QuestSceneEvaluationResult> {
  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "OPENAI_API_KEY is not configured",
      {
        sceneId: input.scene.id,
        sceneCode:
          input.scene.scene_code,
      },
    );
  }

  if (
    typeof input.userInput !== "string" ||
    !input.userInput.trim()
  ) {
    throw new QuestEngineError(
      "INVALID_SCENE_INPUT",
      "AI scene requires a non-empty text answer",
      {
        sceneId: input.scene.id,
        sceneCode:
          input.scene.scene_code,
      },
    );
  }

  const prompt =
    buildConversationPrompt(input);

  const model =
    process.env
      .OPENAI_EVALUATION_MODEL
      ?.trim() ||
    DEFAULT_MODEL;

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${apiKey}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: prompt.user,
          },
        ],
        max_output_tokens: 700,
        text: {
          format: {
            type: "json_schema",
            name:
              "talkhero_scene_evaluation",
            strict: true,
            schema:
              AI_CONVERSATION_SCHEMA,
          },
        },
      }),
      cache: "no-store",
    },
  );

  const body =
    (await response.json()) as
      ResponsesAPIResult;

  if (!response.ok) {
    const apiMessage =
      typeof body.error?.message ===
      "string"
        ? body.error.message
        : "Unknown OpenAI error";

    console.error(
      "ПОМИЛКА OPENAI AI EVALUATOR:",
      response.status,
      apiMessage,
    );

    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "Failed to evaluate AI scene",
      {
        sceneId: input.scene.id,
        sceneCode:
          input.scene.scene_code,
        status: response.status,
      },
    );
  }

  if (body.status === "incomplete") {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "AI evaluation response was incomplete",
      {
        sceneId: input.scene.id,
        sceneCode:
          input.scene.scene_code,
        incompleteDetails:
          body.incomplete_details ?? null,
      },
    );
  }

  const outputText =
    extractOutputText(body);

  if (!outputText) {
    throw new QuestEngineError(
      "SCENE_SUBMIT_FAILED",
      "AI evaluator returned no output",
      {
        sceneId: input.scene.id,
        sceneCode:
          input.scene.scene_code,
      },
    );
  }

  const ai =
    parseEvaluation(outputText);

  const aiConversation =
    input.scene.metadata
      ?.aiConversation === true;

  const currentTurn =
    getUserTurnCount(input);

  const maxTurns = Math.max(
    1,
    Math.trunc(
      getMetadataNumber(
        input,
        "maxTurns",
        4,
      ),
    ),
  );

  const goalReached =
    aiConversation
      ? ai.goalReached ||
        currentTurn >= maxTurns
      : ai.isCorrect;

    const isCorrect =
  goalReached &&
  ai.isCorrect &&
  ai.scorePercent >= 90;

let grade:
  | "correct"
  | "almost"
  | "incorrect";

if (
  goalReached &&
  ai.isCorrect &&
  ai.scorePercent >= 90
) {
  grade = "correct";
} else if (
  goalReached &&
  ai.scorePercent >= 60
) {
  grade = "almost";
} else {
  grade = "incorrect";
}

  const availablePoints =
    getAvailablePoints(input);

  const scoreAwarded =
    goalReached && isCorrect
      ? Math.min(
          availablePoints,
          Math.max(
            0,
            Math.round(
              availablePoints *
                (ai.scorePercent / 100),
            ),
          ),
        )
      : 0;

 return {
  mode: "ai",
  isCorrect,
  grade,
    scoreAwarded,
    feedback:
      buildFeedback(ai),
    nextSceneCode:
      resolveNextSceneCode({
        input,
        goalReached,
      }),
    normalizedInput:
      input.userInput.trim(),
    metadata: {
      attemptNumber:
        input.attemptNumber,
      model,
      aiConversation,
      goalReached,
      currentTurn,
      maxTurns,
      scorePercent:
        ai.scorePercent,
      detectedLevel:
        ai.detectedLevel,
      naturalAnswer:
        ai.naturalAnswer,
      npcReply:
        ai.npcReply,
      strengths:
        ai.strengths,
      improvements:
        ai.improvements,
    },
  };
}
