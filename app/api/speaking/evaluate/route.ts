import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type EnglishLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

const VALID_LEVELS: EnglishLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

const evaluateRequestSchema = z.object({
  transcript: z
    .string()
    .trim()
    .min(1, API_ERRORS.transcriptRequired)
    .max(
      2000,
      "Текст відповіді не може містити більше 2000 символів.",
    ),

  previousAssistantMessage: z
    .string()
    .trim()
    .max(
      3000,
      "Контекст не може містити більше 3000 символів.",
    )
    .optional()
    .default(""),
});

const evaluationResultSchema = z.object({
  grammarScore: z.number().int().min(0).max(100),
  fluencyScore: z.number().int().min(0).max(100),
  vocabularyScore: z.number().int().min(0).max(100),
  naturalnessScore: z.number().int().min(0).max(100),
  overallScore: z.number().int().min(0).max(100),

  wasCorrect: z.boolean(),

  correctedSentence: z.string().trim().max(2000),

  shortFeedback: z
    .string()
    .trim()
    .min(1)
    .max(500),

  mainIssue: z
    .string()
    .trim()
    .max(300),

  encouragement: z
    .string()
    .trim()
    .min(1)
    .max(300),
});

function normalizeEnglishLevel(
  value: string | null | undefined,
): EnglishLevel {
  const normalized =
    value?.trim().toUpperCase() as EnglishLevel;

  return VALID_LEVELS.includes(normalized)
    ? normalized
    : "A1";
}

function createEvaluationPrompt({
  transcript,
  previousAssistantMessage,
  englishLevel,
}: {
  transcript: string;
  previousAssistantMessage: string;
  englishLevel: EnglishLevel;
}) {
  return `
You are evaluating a language learner's spoken English.

The speech was converted to text by speech recognition.
Do not evaluate pronunciation or accent because you do not have
access to the original audio.

PROFILE CEFR LEVEL:
${englishLevel}

EMMA'S PREVIOUS MESSAGE:
${previousAssistantMessage || "No previous message was provided."}

STUDENT'S SPOKEN RESPONSE:
${transcript}

Evaluate only these areas:

1. Grammar
2. Fluency based on sentence structure and flow
3. Vocabulary
4. Naturalness

IMPORTANT EVALUATION PRINCIPLES:

- Evaluate whether the student's actual response is correct, natural,
  and appropriate for the conversation.
- Do NOT mark a response incorrect merely because it is simple.
- A grammatically correct simple sentence is still correct at B2, C1,
  or C2.
- CEFR level may influence how you interpret vocabulary range and
  fluency, but it must NEVER be used to invent an error.
- Do NOT require the student to demonstrate their full CEFR level in
  every individual reply.
- Do NOT rewrite a correct sentence into a more advanced sentence just
  because the profile level is high.
- Do NOT add facts, meanings, time periods, reasons, opinions, or
  details that the student did not say.
- Preserve the student's intended meaning exactly.
- Example:
  Student: "I am from Lviv."
  This is a correct natural sentence.
  Do NOT replace it with:
  "I have been living in Lviv all my life."
  because that changes the meaning.
- If Emma asks a broad question and the student gives a short but valid
  answer, do not classify it as a language error merely because the
  answer could have been longer.
- Conversation quality and language correctness are different things.
  Lack of detail is not automatically a grammar or naturalness error.

SCORING RULES:

- Every score must be an integer from 0 to 100.
- Judge grammar based on actual grammatical correctness.
- Judge fluency only from the structure and flow visible in the
  transcript.
- Judge vocabulary based on whether the words used are appropriate and
  accurate, not on whether they are advanced enough for the profile
  level.
- Judge naturalness based on whether a native speaker could reasonably
  say the sentence in this conversational context.
- Do not assume speech recognition errors are definitely the student's
  mistakes.
- Correct only genuine, meaningful language problems.
- Do not invent corrections.
- Do not overcorrect stylistic preferences.
- If several natural phrasings are possible, do not treat the student's
  version as wrong merely because another version is also natural.

CORRECTION RULES:

- wasCorrect must be true when there is no meaningful grammar,
  vocabulary, or naturalness error.
- If wasCorrect is true:
  - correctedSentence must preserve the student's sentence.
  - mainIssue must be an empty string.
  - shortFeedback must briefly confirm that the response is correct.
- If wasCorrect is false:
  - correctedSentence must contain a corrected natural English version.
  - Preserve the student's meaning.
  - Correct only the most important issue.
  - mainIssue must briefly identify that genuine issue.
- correctedSentence must never introduce information that was not
  present in the student's response.

LANGUAGE RULES:

- correctedSentence must always be written in English.
- shortFeedback must always be written in Ukrainian.
- mainIssue must always be written in Ukrainian.
- encouragement must always be written in Ukrainian.
- Explain mistakes in clear, natural Ukrainian.
- English examples may appear inside Ukrainian explanations when
  necessary.
- Do not return English-only feedback in shortFeedback, mainIssue,
  or encouragement.
- Keep all feedback brief.
- Do not include markdown.
`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }

    const requestBody: unknown = await request.json();

    const validationResult =
      evaluateRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message ||
            API_ERRORS.invalidEvaluationData,
        },
        {
          status: 400,
        },
      );
    }

    const {
      transcript,
      previousAssistantMessage,
    } = validationResult.data;

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("english_level")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "SPEAKING EVALUATION PROFILE ERROR:",
        profileError,
      );
    }

    const englishLevel = normalizeEnglishLevel(
      profile?.english_level,
    );

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        messages: [
         {
  role: "system",
  content:
    "You are a precise but supportive English speaking evaluator. All learner-facing explanations must be written in Ukrainian, while corrected English sentences must remain in English.",
},
          {
            role: "user",
            content: createEvaluationPrompt({
              transcript,
              previousAssistantMessage,
              englishLevel,
            }),
          },
        ],

        response_format: {
          type: "json_schema",

          json_schema: {
            name: "speaking_evaluation",
            strict: true,

            schema: {
              type: "object",

              properties: {
                grammarScore: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                },

                fluencyScore: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                },

                vocabularyScore: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                },

                naturalnessScore: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                },

                overallScore: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                },

                wasCorrect: {
                  type: "boolean",
                },

                correctedSentence: {
                  type: "string",
                },

                shortFeedback: {
                  type: "string",
                },

                mainIssue: {
                  type: "string",
                },

                encouragement: {
                  type: "string",
                },
              },

              required: [
                "grammarScore",
                "fluencyScore",
                "vocabularyScore",
                "naturalnessScore",
                "overallScore",
                "wasCorrect",
                "correctedSentence",
                "shortFeedback",
                "mainIssue",
                "encouragement",
              ],

              additionalProperties: false,
            },
          },
        },
      });

    const content =
      completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error:
            API_ERRORS.emptyEvaluationResponse,
        },
        {
          status: 502,
        },
      );
    }

    let parsedContent: unknown;

    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error(
        "SPEAKING EVALUATION JSON ERROR:",
        error,
        content,
      );

      return NextResponse.json(
        {
          error:
            API_ERRORS.invalidEvaluationResponse,
        },
        {
          status: 502,
        },
      );
    }

    const evaluationResult =
      evaluationResultSchema.safeParse(parsedContent);

    if (!evaluationResult.success) {
      console.error(
        "SPEAKING EVALUATION VALIDATION ERROR:",
        evaluationResult.error,
      );

      return NextResponse.json(
        {
          error:
            API_ERRORS.incompleteSpeakingEvaluation,
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      evaluation: evaluationResult.data,
      englishLevel,
    });
  } catch (error) {
    console.error(
      "SPEAKING EVALUATION ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          API_ERRORS.failedToEvaluateSpeaking,
      },
      {
        status: 500,
      },
    );
  }
}
