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
const REQUIRED_SUCCESSFUL_USES = 3;

type MasteryAnalysisResponse = {
  successfulErrorKeys: string[];
};

function buildErrorsForAnalysis(
  errors: UserLanguageError[],
): string {
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
  const activeKeys = new Set(
    activeErrors.map((error) => error.error_key),
  );

  return [
    ...new Set(
      (response.successfulErrorKeys ?? [])
        .map((key) => key.trim())
        .filter((key) => activeKeys.has(key)),
    ),
  ].slice(0, 3);
}

async function recordSuccessfulUse(
  error: UserLanguageError,
): Promise<boolean> {
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
  const activeErrors = (await loadErrors(userId))
    .filter((error) => !error.is_mastered)
    .slice(0, MAX_ERRORS_TO_CHECK);

  if (activeErrors.length === 0) {
    return {
      successfulErrorKeys: [],
      masteredErrorKeys: [],
    };
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
              maxItems: 3,
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

${buildErrorsForAnalysis(activeErrors)}

CURRENT STUDENT MESSAGE:

${userMessage}
`,
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content?.trim();

  if (!content) {
    return {
      successfulErrorKeys: [],
      masteredErrorKeys: [],
    };
  }

  let parsedResponse: MasteryAnalysisResponse;

  try {
    parsedResponse = JSON.parse(
      content,
    ) as MasteryAnalysisResponse;
  } catch (error) {
    console.error("PARSE MASTERY ANALYSIS ERROR:", error);

    return {
      successfulErrorKeys: [],
      masteredErrorKeys: [],
    };
  }

  const successfulErrorKeys = normalizeSuccessfulKeys(
    parsedResponse,
    activeErrors,
  );

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

    const becameMastered =
      await recordSuccessfulUse(languageError);

    if (becameMastered) {
      masteredErrorKeys.push(errorKey);
    }
  }

  return {
    successfulErrorKeys,
    masteredErrorKeys,
  };
}
