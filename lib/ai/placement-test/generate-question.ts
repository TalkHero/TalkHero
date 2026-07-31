import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { normalizeQuestion } from "./normalize-question";
import { buildQuestionGeneratorPrompt } from "./prompts/question-generator";
import type {
  AnswerLength,
  CEFRLevel,
  PlacementQuestion,
  PlacementSkill,
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_GENERATION_ATTEMPTS = 4;
const MAX_HISTORY_IN_PROMPT = 100;
const DEFAULT_MODEL =
  process.env.OPENAI_PLACEMENT_MODEL ?? "gpt-5.6";

const CEFR_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;

const PLACEMENT_SKILLS = [
  "personal_information",
  "daily_life",
  "present_simple",
  "past_simple",
  "future_forms",
  "description",
  "experience",
  "opinion",
  "comparison",
  "argumentation",
  "hypothetical_reasoning",
  "abstract_discussion",
] as const;

const ANSWER_LENGTHS = [
  "short",
  "medium",
  "long",
] as const;

const PlacementQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(8)
    .max(500),

  questionKey: z
    .string()
    .trim()
    .min(5)
    .max(160)
    .regex(
      /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
      "questionKey must use snake_case",
    ),

  level: z.enum(CEFR_LEVELS),

  skill: z.enum(PLACEMENT_SKILLS),

  expectedAnswerLength: z.enum(ANSWER_LENGTHS),
});

export interface GeneratePlacementQuestionParams {
  level: CEFRLevel;
  skill: PlacementSkill;
  expectedAnswerLength: AnswerLength;

  /**
   * All questions previously asked to this user.
   * Include questions from the current and previous sessions.
   */
  previousQuestions?: string[];

  /**
   * All semantic keys previously used for this user.
   */
  previousQuestionKeys?: string[];
}

function normalizeQuestionKey(questionKey: string): string {
  return questionKey
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function tokenizeQuestion(question: string): Set<string> {
  const ignoredWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "about",
    "do",
    "does",
    "did",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "me",
    "of",
    "on",
    "or",
    "the",
    "to",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "would",
    "you",
    "your",
  ]);

  return new Set(
    normalizeQuestion(question)
      .split(" ")
      .filter(
        (word) =>
          word.length > 2 &&
          !ignoredWords.has(word),
      ),
  );
}

function calculateJaccardSimilarity(
  firstQuestion: string,
  secondQuestion: string,
): number {
  const firstTokens = tokenizeQuestion(firstQuestion);
  const secondTokens = tokenizeQuestion(secondQuestion);

  if (
    firstTokens.size === 0 ||
    secondTokens.size === 0
  ) {
    return 0;
  }

  let intersectionSize = 0;

  for (const token of firstTokens) {
    if (secondTokens.has(token)) {
      intersectionSize += 1;
    }
  }

  const unionSize =
    firstTokens.size +
    secondTokens.size -
    intersectionSize;

  return unionSize === 0
    ? 0
    : intersectionSize / unionSize;
}

function isQuestionTooSimilar(
  candidate: string,
  previousQuestions: string[],
): boolean {
  const normalizedCandidate =
    normalizeQuestion(candidate);

  return previousQuestions.some((previousQuestion) => {
    const normalizedPrevious =
      normalizeQuestion(previousQuestion);

    if (normalizedCandidate === normalizedPrevious) {
      return true;
    }

    if (
      normalizedCandidate.includes(normalizedPrevious) ||
      normalizedPrevious.includes(normalizedCandidate)
    ) {
      return true;
    }

    return (
      calculateJaccardSimilarity(
        normalizedCandidate,
        normalizedPrevious,
      ) >= 0.72
    );
  });
}

function validateGeneratedQuestion(
  candidate: PlacementQuestion,
  params: GeneratePlacementQuestionParams,
  previousQuestions: string[],
  previousQuestionKeys: Set<string>,
): string | null {
  if (candidate.level !== params.level) {
    return `Wrong level: ${candidate.level}`;
  }

  if (candidate.skill !== params.skill) {
    return `Wrong skill: ${candidate.skill}`;
  }

  if (
    candidate.expectedAnswerLength !==
    params.expectedAnswerLength
  ) {
    return (
      "Wrong expected answer length: " +
      candidate.expectedAnswerLength
    );
  }

  const normalizedKey = normalizeQuestionKey(
    candidate.questionKey,
  );

  if (!normalizedKey) {
    return "The question key is empty after normalization.";
  }

  if (previousQuestionKeys.has(normalizedKey)) {
    return `Duplicate question key: ${normalizedKey}`;
  }

  if (
    isQuestionTooSimilar(
      candidate.question,
      previousQuestions,
    )
  ) {
    return `Question is too similar: ${candidate.question}`;
  }

  return null;
}

export async function generatePlacementQuestion({
  level,
  skill,
  expectedAnswerLength,
  previousQuestions = [],
  previousQuestionKeys = [],
}: GeneratePlacementQuestionParams): Promise<PlacementQuestion> {
  const trimmedPreviousQuestions = previousQuestions
    .map((question) => question.trim())
    .filter(Boolean);

  const promptHistory = trimmedPreviousQuestions.slice(
    -MAX_HISTORY_IN_PROMPT,
  );

  const normalizedPreviousKeys = new Set(
    previousQuestionKeys
      .map(normalizeQuestionKey)
      .filter(Boolean),
  );

  let rejectedQuestion: string | undefined;
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      const response = await openai.responses.parse({
        model: DEFAULT_MODEL,

        input: [
          {
            role: "system",
            content:
              "You are a precise English CEFR placement-test question generator.",
          },
          {
            role: "user",
            content: buildQuestionGeneratorPrompt({
              level,
              skill,
              expectedAnswerLength,
              previousQuestions: promptHistory,
              rejectedQuestion,
            }),
          },
        ],

        text: {
          format: zodTextFormat(
            PlacementQuestionSchema,
            "placement_question",
          ),
        },
      });

      const parsedQuestion = response.output_parsed;

      if (!parsedQuestion) {
        throw new Error(
          "OpenAI returned no parsed placement question.",
        );
      }

      const candidate: PlacementQuestion = {
        question: parsedQuestion.question.trim(),
        questionKey: normalizeQuestionKey(
          parsedQuestion.questionKey,
        ),
        level: parsedQuestion.level,
        skill: parsedQuestion.skill,
        expectedAnswerLength:
          parsedQuestion.expectedAnswerLength,
      };

      const rejectionReason =
        validateGeneratedQuestion(
          candidate,
          {
            level,
            skill,
            expectedAnswerLength,
          },
          trimmedPreviousQuestions,
          normalizedPreviousKeys,
        );

      if (rejectionReason) {
        rejectedQuestion = [
          candidate.question,
          `Reason: ${rejectionReason}`,
        ].join("\n");

        console.warn(
          `Placement question rejected on attempt ${attempt}: ${rejectionReason}`,
        );

        continue;
      }

      return candidate;
    } catch (error) {
      lastError = error;

      console.error(
        `Placement question generation failed on attempt ${attempt}:`,
        error,
      );
    }
  }

  throw new Error(
    "Failed to generate a unique placement question " +
      `after ${MAX_GENERATION_ATTEMPTS} attempts.`,
    {
      cause: lastError,
    },
  );
}
