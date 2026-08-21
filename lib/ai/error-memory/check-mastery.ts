import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";

import { loadErrors } from "./load-errors";

import type {
  MasteryCheckInput,
  MasteryCheckResult,
  UserLanguageError,
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_ERRORS_TO_CHECK = 8;
const MAX_SUCCESSES_PER_MESSAGE = 3;
const REQUIRED_SUCCESSFUL_USES = 3;

type MasteryAnalysisResponse = {
  successfulErrorKeys: string[];
};

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildErrorsForAnalysis(errors: UserLanguageError[]): string {
  return errors
    .map(
      (error) => `
ERROR KEY: ${error.error_key}
EXPECTED CORRECT FORM: ${error.corrected_text}
ERROR TYPE: ${error.error_type}
EXPLANATION: ${error.explanation ?? "No explanation available"}
`,
    )
    .join("\n");
}

function normalizeSuccessfulKeys(
  response: MasteryAnalysisResponse,
  activeErrors: UserLanguageError[],
): string[] {
  const activeKeys = new Set(activeErrors.map((error) => error.error_key));

  return [
    ...new Set(
      (response.successfulErrorKeys ?? [])
        .map((key) => key.trim())
        .filter((key) => activeKeys.has(key)),
    ),
  ].slice(0, MAX_SUCCESSES_PER_MESSAGE);
}

function isStandaloneWordTarget(value: string): boolean {
  return /^[a-z]+(?:'[a-z]+)?$/i.test(value.trim());
}

function containsExactWord(message: string, word: string): boolean {
  const pattern = new RegExp(
    `(^|[^a-z'])${escapeRegExp(word.toLocaleLowerCase())}(?=$|[^a-z'])`,
    "i",
  );

  return pattern.test(message);
}

function looksLikeMetaLanguageUse({
  message,
  target,
}: {
  message: string;
  target: string;
}): boolean {
  const normalizedMessage = normalizeText(message);

  const normalizedTarget = normalizeText(target);

  /*
   * A standalone target is not enough evidence
   * of natural language use.
   */
  if (normalizedMessage === normalizedTarget) {
    return true;
  }

  const escapedTarget = escapeRegExp(normalizedTarget);

  const metaPatterns = [
    new RegExp(
      `\\b(?:is|was)\\s+["'\`]?${escapedTarget}["'\`]?\\s+(?:correct|right|okay|ok)\\b`,
      "i",
    ),

    new RegExp(`\\bhow\\s+do\\s+(?:i|you|we)\\s+spell\\b`, "i"),

    new RegExp(
      `\\bhow\\s+is\\s+["'\`]?${escapedTarget}["'\`]?\\s+spelled\\b`,
      "i",
    ),

    new RegExp(
      `\\bwhat\\s+does\\s+["'\`]?${escapedTarget}["'\`]?\\s+mean\\b`,
      "i",
    ),

    new RegExp(`\\b(?:the\\s+)?word\\s+["'\`]?${escapedTarget}["'\`]?\\b`, "i"),

    new RegExp(
      `\\b(?:say|write|type|repeat)\\s+["'\`]?${escapedTarget}["'\`]?\\b`,
      "i",
    ),
  ];

  return metaPatterns.some((pattern) => pattern.test(normalizedMessage));
}

function isDeterministicSpellingSuccess({
  error,
  userMessage,
}: {
  error: UserLanguageError;
  userMessage: string;
}): boolean {
  if (error.error_type !== "spelling") {
    return false;
  }

  const correctedText = normalizeText(error.corrected_text);

  const originalText = normalizeText(error.original_text);

  /*
   * Deterministic spelling mastery is intentionally
   * conservative: only single-word targets are checked
   * here. More complex cases stay with AI analysis.
   */
  if (!correctedText || !isStandaloneWordTarget(correctedText)) {
    return false;
  }

  const normalizedMessage = normalizeText(userMessage);

  if (!containsExactWord(normalizedMessage, correctedText)) {
    return false;
  }

  /*
   * Do not reward the message when it still contains
   * the previously incorrect spelling as a standalone
   * token.
   */
  if (
    originalText &&
    originalText !== correctedText &&
    isStandaloneWordTarget(originalText) &&
    containsExactWord(normalizedMessage, originalText)
  ) {
    return false;
  }

  /*
   * Do not count examples such as:
   * "Is 'you' correct?"
   * "How do you spell you?"
   */
  if (
    looksLikeMetaLanguageUse({
      message: userMessage,
      target: correctedText,
    })
  ) {
    return false;
  }

  return true;
}

function findDeterministicSuccesses({
  errors,
  userMessage,
}: {
  errors: UserLanguageError[];
  userMessage: string;
}): string[] {
  const successfulKeys: string[] = [];

  for (const error of errors) {
    if (
      !isDeterministicSpellingSuccess({
        error,
        userMessage,
      })
    ) {
      continue;
    }

    successfulKeys.push(error.error_key);

    if (successfulKeys.length >= MAX_SUCCESSES_PER_MESSAGE) {
      break;
    }
  }

  return successfulKeys;
}

async function analyzeMasteryWithAI({
  errors,
  userMessage,
}: {
  errors: UserLanguageError[];
  userMessage: string;
}): Promise<string[]> {
  if (errors.length === 0) {
    return [];
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    max_tokens: 300,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "language_error_mastery_check",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            successfulErrorKeys: {
              type: "array",
              maxItems: MAX_SUCCESSES_PER_MESSAGE,
              items: {
                type: "string",
              },
            },
          },
          required: ["successfulErrorKeys"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `
You evaluate whether an English learner correctly used previously
problematic language structures.

Return an error key only when the student's current message contains
a clear, natural, and correct use of that exact structure.

Strict rules:

- Evaluate only the student's current message.
- Do not reward a structure merely because a related word appears.
- The correct form must be produced by the student.
- The use must be grammatically correct and natural in context.
- Do not count text that the student is quoting, copying, translating,
  discussing as an example, or asking whether it is correct.
- Do not count an error key when the student repeats the same mistake.
- Do not count an error key when the target structure is absent.
- Return only keys from the supplied active error list.
- Return at most three keys.
- When uncertain, do not count the structure.
- Return an empty array when there is no clear successful use.

Examples:

Target:
grammar:agree-without-be
Expected form:
I agree with you.

Student:
I agree with my teacher.
Result:
Count it.

Student:
Is "I agree" correct?
Result:
Do not count it.

Student:
I am agree with you.
Result:
Do not count it.
`,
      },
      {
        role: "user",
        content: `
ACTIVE LANGUAGE ERRORS:

${buildErrorsForAnalysis(errors)}

CURRENT STUDENT MESSAGE:

${userMessage}
`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();

  if (!content) {
    return [];
  }

  let parsedResponse: MasteryAnalysisResponse;

  try {
    parsedResponse = JSON.parse(content) as MasteryAnalysisResponse;
  } catch (error) {
    console.error("PARSE MASTERY ANALYSIS ERROR:", error);

    return [];
  }

  return normalizeSuccessfulKeys(parsedResponse, errors);
}

async function recordSuccessfulUse(error: UserLanguageError): Promise<boolean> {
  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc(
    "record_language_error_success",
    {
      p_error_id: error.id,
    },
  );

  if (rpcError) {
    throw rpcError;
  }

  return error.successful_uses + 1 >= REQUIRED_SUCCESSFUL_USES;
}

export async function checkAndUpdateMastery({
  userId,
  userMessage,
}: MasteryCheckInput): Promise<MasteryCheckResult> {
  const loadedErrors = (await loadErrors(userId)).filter(
    (error) => !error.is_mastered,
  );

  const prioritySpellingErrors = loadedErrors.filter(
    (error) =>
      error.error_type === "spelling" &&
      isStandaloneWordTarget(normalizeText(error.corrected_text)),
  );

  const otherErrors = loadedErrors.filter(
    (error) =>
      !prioritySpellingErrors.some((priority) => priority.id === error.id),
  );

  const activeErrors = [...prioritySpellingErrors, ...otherErrors].slice(
    0,
    MAX_ERRORS_TO_CHECK,
  );
  console.log(
    activeErrors.map((error) => ({
      id: error.id,
      errorKey: error.error_key,
      errorType: error.error_type,
      originalText: error.original_text,
      correctedText: error.corrected_text,
      successfulUses: error.successful_uses,
    })),
  );

  if (activeErrors.length === 0) {
    return {
      successfulErrorKeys: [],
      masteredErrorKeys: [],
    };
  }

  /*
   * Single-word spelling targets are much more reliable
   * to evaluate deterministically than through an LLM.
   *
   * Example:
   * spelling:you
   * yu -> you
   *
   * "Do you like coffee?" is clear evidence of success.
   */
  const deterministicKeys = findDeterministicSuccesses({
    errors: activeErrors,
    userMessage,
  });

  const deterministicKeySet = new Set(deterministicKeys);

  /*
   * Do not send already-resolved deterministic targets
   * to the model in the same turn. This prevents one
   * student message from counting the same error twice.
   *
   * Single-word spelling targets that did NOT pass the
   * deterministic check are also omitted from AI analysis:
   * the deterministic rules are the source of truth for
   * those targets.
   */
  const errorsForAI = activeErrors.filter((error) => {
    if (deterministicKeySet.has(error.error_key)) {
      return false;
    }

    if (
      error.error_type === "spelling" &&
      isStandaloneWordTarget(normalizeText(error.corrected_text))
    ) {
      return false;
    }

    return true;
  });

  const remainingSlots = Math.max(
    0,
    MAX_SUCCESSES_PER_MESSAGE - deterministicKeys.length,
  );

  const aiKeys =
    remainingSlots > 0
      ? (
          await analyzeMasteryWithAI({
            errors: errorsForAI,
            userMessage,
          })
        ).slice(0, remainingSlots)
      : [];

  const successfulErrorKeys = [
    ...new Set([...deterministicKeys, ...aiKeys]),
  ].slice(0, MAX_SUCCESSES_PER_MESSAGE);

  if (successfulErrorKeys.length === 0) {
    return {
      successfulErrorKeys: [],
      masteredErrorKeys: [],
    };
  }

  const errorsByKey = new Map(
    activeErrors.map((error) => [error.error_key, error]),
  );

  const masteredErrorKeys: string[] = [];

  for (const errorKey of successfulErrorKeys) {
    const languageError = errorsByKey.get(errorKey);

    if (!languageError) {
      continue;
    }

    const becameMastered = await recordSuccessfulUse(languageError);

    if (becameMastered) {
      masteredErrorKeys.push(errorKey);
    }
  }

  return {
    successfulErrorKeys,
    masteredErrorKeys,
  };
}
