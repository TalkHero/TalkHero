import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { buildAnswerEvaluatorPrompt } from "./prompts/answer-evaluator";
import type {
  AnswerLength,
  CEFRLevel,
  PlacementEvaluation,
  PlacementSkill,
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL =
  process.env.OPENAI_PLACEMENT_MODEL ?? "gpt-5.6";

const MAX_EVALUATION_ATTEMPTS = 3;
const MAX_QUESTION_LENGTH = 1_000;
const MAX_ANSWER_LENGTH = 10_000;

const CEFR_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;

const PlacementEvaluationSchema = z.object({
  grammar: z
    .number()
    .int()
    .min(0)
    .max(100),

  vocabulary: z
    .number()
    .int()
    .min(0)
    .max(100),

  comprehension: z
    .number()
    .int()
    .min(0)
    .max(100),

  complexity: z
    .number()
    .int()
    .min(0)
    .max(100),

  taskCompletion: z
    .number()
    .int()
    .min(0)
    .max(100),

  estimatedLevel: z.enum(CEFR_LEVELS),

  feedback: z
    .string()
    .trim()
    .min(10)
    .max(1_500),
});

export interface EvaluatePlacementAnswerParams {
  question: string;
  answer: string;
  targetLevel: CEFRLevel;
  skill: PlacementSkill;
  expectedAnswerLength: AnswerLength;
}

function normalizeInput(
  value: string,
  maximumLength: number,
): string {
  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maximumLength);
}

function validateParams({
  question,
  answer,
}: {
  question: string;
  answer: string;
}): void {
  if (!question) {
    throw new Error(
      "Placement question is required for evaluation.",
    );
  }

  if (!answer) {
    throw new Error(
      "Placement answer is required for evaluation.",
    );
  }
}

function createFallbackEmptyAnswerEvaluation():
  PlacementEvaluation {
  return {
    grammar: 0,
    vocabulary: 0,
    comprehension: 0,
    complexity: 0,
    taskCompletion: 0,
    estimatedLevel: "A1",
    feedback:
      "Відповідь не містить достатньо англійського тексту для оцінювання. Спробуйте дати повну відповідь англійською мовою та безпосередньо відповісти на поставлене запитання.",
  };
}

function containsMeaningfulContent(
  answer: string,
): boolean {
  const letters = answer.match(/[a-z]/gi) ?? [];

  return letters.length >= 2;
}

export async function evaluatePlacementAnswer({
  question,
  answer,
  targetLevel,
  skill,
  expectedAnswerLength,
}: EvaluatePlacementAnswerParams): Promise<PlacementEvaluation> {
  const normalizedQuestion = normalizeInput(
    question,
    MAX_QUESTION_LENGTH,
  );

  const normalizedAnswer = normalizeInput(
    answer,
    MAX_ANSWER_LENGTH,
  );

  validateParams({
    question: normalizedQuestion,
    answer: normalizedAnswer,
  });

  /*
   * Avoid spending an API request on punctuation,
   * numbers, or otherwise meaningless input.
   */
  if (!containsMeaningfulContent(normalizedAnswer)) {
    return createFallbackEmptyAnswerEvaluation();
  }

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_EVALUATION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      const response = await openai.responses.parse({
        model: DEFAULT_MODEL,

        input: [
          {
            role: "system",
            content:
              "You are a strict and fair English CEFR placement-test evaluator.",
          },
          {
            role: "user",
            content: buildAnswerEvaluatorPrompt({
              question: normalizedQuestion,
              answer: normalizedAnswer,
              targetLevel,
              skill,
              expectedAnswerLength,
            }),
          },
        ],

        text: {
          format: zodTextFormat(
            PlacementEvaluationSchema,
            "placement_evaluation",
          ),
        },
      });

      const parsedEvaluation =
        response.output_parsed;

      if (!parsedEvaluation) {
        throw new Error(
          "OpenAI returned no parsed placement evaluation.",
        );
      }

      const evaluation: PlacementEvaluation = {
        grammar: parsedEvaluation.grammar,
        vocabulary: parsedEvaluation.vocabulary,
        comprehension:
          parsedEvaluation.comprehension,
        complexity: parsedEvaluation.complexity,
        taskCompletion:
          parsedEvaluation.taskCompletion,
        estimatedLevel:
          parsedEvaluation.estimatedLevel,
        feedback: parsedEvaluation.feedback.trim(),
      };

      return evaluation;
    } catch (error) {
      lastError = error;

      console.error(
        `Placement answer evaluation failed on attempt ${attempt}:`,
        error,
      );
    }
  }

  throw new Error(
    "Failed to evaluate the placement answer " +
      `after ${MAX_EVALUATION_ATTEMPTS} attempts.`,
    {
      cause: lastError,
    },
  );
}
