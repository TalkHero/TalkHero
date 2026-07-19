import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
    .min(1, "Transcript is required.")
    .max(2000, "Transcript is too long."),

  previousAssistantMessage: z
    .string()
    .trim()
    .max(3000, "Context is too long.")
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

The speech was converted to text by browser speech recognition.
Do not evaluate pronunciation or accent because you do not have
access to the original audio.

STUDENT LEVEL:
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

SCORING RULES:
- Every score must be an integer from 0 to 100.
- Adapt expectations to CEFR level ${englishLevel}.
- Do not punish an A1 or A2 learner for using simple language.
- Do not assume speech recognition errors are definitely the
  student's mistakes.
- Keep feedback brief and supportive.
- Correct only the most important problem.
- If the sentence is already acceptable, preserve it.
- correctedSentence must always contain the best natural version
  of the student's response.
- mainIssue must be an empty string when there is no important issue.
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
          error: "Unauthorized",
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
            "Invalid evaluation data.",
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
              "You are a precise but supportive English speaking evaluator.",
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
            "The evaluator returned an empty response.",
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
            "The evaluator returned invalid data.",
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
            "The speaking evaluation is incomplete.",
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
          "Failed to evaluate the spoken response.",
      },
      {
        status: 500,
      },
    );
  }
}
