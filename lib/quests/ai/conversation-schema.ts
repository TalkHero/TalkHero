export type AIConversationErrorType =
  | "grammar"
  | "vocabulary"
  | "word_order"
  | "naturalness"
  | "politeness"
  | "relevance"
  | "none";

export type AIConversationEvaluation = {
  isCorrect: boolean;
  goalReached: boolean;
  scorePercent: number;

  feedbackUk: string;
  naturalAnswer: string;
  npcReply: string;

  detectedLevel:
    | "below_A1"
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2"
    | "unknown";

  strengths: string[];
  improvements: string[];

  errorType:
    AIConversationErrorType;

  originalFragment: string;
  correctedFragment: string;

  explanationUk: string;
  rememberUk: string;
};

export const AI_CONVERSATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isCorrect: {
      type: "boolean",
      description:
        "Whether the latest learner answer is understandable and suitable in the current conversation.",
    },
    goalReached: {
      type: "boolean",
      description:
        "Whether the complete conversation goal has now been achieved and the quest scene may finish.",
    },
    scorePercent: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "Quality of the latest learner answer from 0 to 100.",
    },
    feedbackUk: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description:
        "Short, supportive feedback in Ukrainian.",
    },
    naturalAnswer: {
      type: "string",
      maxLength: 300,
      description:
        "A natural corrected English version, or an empty string if correction is unnecessary.",
    },
    npcReply: {
      type: "string",
      minLength: 1,
      maxLength: 300,
      description:
        "The next short and natural English reply from the NPC.",
    },
    detectedLevel: {
      type: "string",
      enum: [
        "below_A1",
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2",
        "unknown"
      ]
    },
    strengths: {
      type: "array",
      maxItems: 3,
      items: {
        type: "string",
        maxLength: 160
      }
    },
    improvements: {
      type: "array",
      maxItems: 3,
      items: {
        type: "string",
        maxLength: 160
      },
    },
        errorType: {
      type: "string",
      enum: [
        "grammar",
        "vocabulary",
        "word_order",
        "naturalness",
        "politeness",
        "relevance",
        "none",
      ],
      description:
        "The single most important issue in the learner answer. Use none when no correction is needed.",
    },

    originalFragment: {
      type: "string",
      maxLength: 160,
      description:
        "The exact problematic fragment from the learner answer, or an empty string when there is no specific error.",
    },

    correctedFragment: {
      type: "string",
      maxLength: 160,
      description:
        "A corrected replacement for originalFragment, or an empty string when correction is unnecessary.",
    },

    explanationUk: {
      type: "string",
      maxLength: 500,
      description:
        "A concise and natural Ukrainian explanation of the specific language issue.",
    },

    rememberUk: {
      type: "string",
      maxLength: 300,
      description:
        "One short reusable English pattern or rule explained in Ukrainian.",
    },
  },
   required: [
    "isCorrect",
    "goalReached",
    "scorePercent",
    "feedbackUk",
    "naturalAnswer",
    "npcReply",
    "detectedLevel",
    "strengths",
    "improvements",
    "errorType",
    "originalFragment",
    "correctedFragment",
    "explanationUk",
    "rememberUk",
  ],
} as const;
