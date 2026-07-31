import OpenAI from "openai";
import { saveErrors } from "./save-errors";
import type {
  AnalyzeErrorsInput,
  DetectedLanguageError,
  ErrorType,
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ERROR_TYPES: ErrorType[] = [
  "grammar",
  "vocabulary",
  "spelling",
  "word_choice",
  "pronunciation",
  "naturalness",
];

type ErrorAnalysisResponse = {
  errors: Array<{
    errorType: string;
    errorKey: string;
    originalText: string;
    correctedText: string;
    explanation: string | null;
  }>;
};

function containsVisibleCorrection(
  assistantMessage: string,
): boolean {
  return (
    assistantMessage.includes("❌") &&
    assistantMessage.includes("✅")
  );
}

function isErrorType(value: string): value is ErrorType {
  return ERROR_TYPES.includes(value as ErrorType);
}

function normalizeErrorKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeDetectedErrors(
  response: ErrorAnalysisResponse,
): DetectedLanguageError[] {
  const normalizedErrors: DetectedLanguageError[] = [];

  for (const error of response.errors ?? []) {
    if (!isErrorType(error.errorType)) {
      continue;
    }

    const originalText = error.originalText?.trim();
    const correctedText = error.correctedText?.trim();
    const errorKey = normalizeErrorKey(error.errorKey ?? "");

    if (!originalText || !correctedText || !errorKey) {
      continue;
    }

    if (originalText.toLowerCase() === correctedText.toLowerCase()) {
      continue;
    }

    normalizedErrors.push({
      errorType: error.errorType,
      errorKey,
      originalText,
      correctedText,
      explanation: error.explanation?.trim() || null,
    });
  }

  return normalizedErrors.slice(0, 2);
}

export async function analyzeAndSaveErrors({
  userId,
  userMessage,
  assistantMessage,
}: AnalyzeErrorsInput): Promise<DetectedLanguageError[]> {
  if (!containsVisibleCorrection(assistantMessage)) {
    return [];
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    max_tokens: 500,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "student_language_error_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            errors: {
              type: "array",
              maxItems: 2,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  errorType: {
                    type: "string",
                    enum: ERROR_TYPES,
                  },
                  errorKey: {
                    type: "string",
                  },
                  originalText: {
                    type: "string",
                  },
                  correctedText: {
                    type: "string",
                  },
                  explanation: {
                    type: ["string", "null"],
                  },
                },
                required: [
                  "errorType",
                  "errorKey",
                  "originalText",
                  "correctedText",
                  "explanation",
                ],
              },
            },
          },
          required: ["errors"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `
You analyze corrections made by an English tutor.

Your task is to identify only genuine student language mistakes
that the tutor visibly corrected.

Important rules:

- Analyze only mistakes found in the student's message.
- Use the tutor response as evidence of the correction.
- Do not invent mistakes.
- Return at most two errors.
- Return an empty errors array when no genuine correction exists.
- Do not record stylistic alternatives unless the original wording
  was clearly incorrect or noticeably unnatural.
- Do not treat punctuation-only changes as learning errors.
- Do not record mistakes made by the tutor.

Allowed error types:

- grammar
- vocabulary
- spelling
- word_choice
- pronunciation
- naturalness

Create a stable errorKey that describes the reusable rule,
not the complete sentence.

Good errorKey examples:

- grammar:agree-without-be
- grammar:third-person-singular-s
- grammar:present-simple-without-be
- vocabulary:band-not-banda
- spelling:metallica
- word_choice:depend-on-not-of

Bad errorKey examples:

- sentence-1
- user-mistake
- incorrect-English
- the complete original sentence

The explanation must be short and written in Ukrainian.
`,
      },
      {
        role: "user",
        content: `
STUDENT MESSAGE:

${userMessage}

TUTOR RESPONSE:

${assistantMessage}
`,
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content?.trim();

  if (!content) {
    return [];
  }

  let parsedResponse: ErrorAnalysisResponse;

  try {
    parsedResponse = JSON.parse(
      content,
    ) as ErrorAnalysisResponse;
  } catch (error) {
    console.error(
      "PARSE LANGUAGE ERROR ANALYSIS:",
      error,
    );

    return [];
  }

  const detectedErrors =
    normalizeDetectedErrors(parsedResponse);

  if (detectedErrors.length === 0) {
    return [];
  }

  await saveErrors({
    userId,
    errors: detectedErrors,
  });

  return detectedErrors;
}
