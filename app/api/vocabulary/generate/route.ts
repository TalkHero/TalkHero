import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVocabularyRequestSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, "Word is required.")
    .max(100, "Word or phrase is too long."),

  context: z
    .string()
    .trim()
    .max(1000, "Context is too long.")
    .optional()
    .default(""),
});

const generatedVocabularySchema = z.object({
  word: z.string().trim().min(1).max(100),
  translation: z.string().trim().min(1).max(300),
  meaning: z.string().trim().min(1).max(1000),
  example: z.string().trim().min(1).max(1000),
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

const LANGUAGE_NAMES: Record<string, string> = {
  uk: "Ukrainian",
  en: "English",
  pl: "Polish",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
};

function normalizeEnglishLevel(
  value: string | null | undefined,
): EnglishLevel {
  const normalized = value?.toUpperCase() as EnglishLevel;

  return VALID_LEVELS.includes(normalized)
    ? normalized
    : "A1";
}

function getLanguageName(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  return LANGUAGE_NAMES[normalized] ?? value;
}

function createGenerationPrompt({
  word,
  context,
  nativeLanguage,
  targetLanguage,
  englishLevel,
}: {
  word: string;
  context: string;
  nativeLanguage: string;
  targetLanguage: string;
  englishLevel: EnglishLevel;
}) {
  return `
Create a concise vocabulary card for a language learner.

STUDENT:
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage}
- CEFR level: ${englishLevel}

WORD OR PHRASE:
${word}

CONTEXT:
${context || "No context was provided."}

REQUIREMENTS:
- Return the most natural dictionary form of the word or phrase.
- Translation must be in ${nativeLanguage}.
- Meaning must be explained in clear ${targetLanguage}.
- Adapt the explanation to CEFR level ${englishLevel}.
- Example must be a natural sentence in ${targetLanguage}.
- When context is provided, use the meaning that best matches that context.
- Keep every field concise.
- Do not add markdown.
- Do not add information outside the required JSON fields.
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
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const requestBody: unknown = await request.json();

    const validationResult =
      generateVocabularyRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message ||
            "Invalid request data.",
        },
        { status: 400 },
      );
    }

    const { word, context } = validationResult.data;

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "native_language, target_language, english_level",
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "GENERATE VOCABULARY PROFILE ERROR:",
        profileError,
      );
    }

    const nativeLanguage = getLanguageName(
      profile?.native_language,
      "Ukrainian",
    );

    const targetLanguage = getLanguageName(
      profile?.target_language,
      "English",
    );

    const englishLevel = normalizeEnglishLevel(
      profile?.english_level,
    );

    const { data: existingItem, error: existingItemError } =
      await supabase
        .from("vocabulary")
        .select(
          `
            id,
            word,
            translation,
            meaning,
            example,
            status,
            review_count,
            created_at,
            updated_at
          `,
        )
        .eq("user_id", user.id)
        .ilike("word", word)
        .maybeSingle();

    if (existingItemError) {
      throw existingItemError;
    }

    if (existingItem) {
      return NextResponse.json({
        vocabularyItem: existingItem,
        alreadyExists: true,
      });
    }

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        messages: [
          {
            role: "system",
            content:
              "You create accurate and concise vocabulary cards for language learners.",
          },
          {
            role: "user",
            content: createGenerationPrompt({
              word,
              context,
              nativeLanguage,
              targetLanguage,
              englishLevel,
            }),
          },
        ],

        response_format: {
          type: "json_schema",
          json_schema: {
            name: "vocabulary_card",
            strict: true,
            schema: {
              type: "object",
              properties: {
                word: {
                  type: "string",
                  description:
                    "The normalized dictionary form of the word or phrase.",
                },
                translation: {
                  type: "string",
                  description:
                    "Translation into the student's native language.",
                },
                meaning: {
                  type: "string",
                  description:
                    "A concise meaning in the target language.",
                },
                example: {
                  type: "string",
                  description:
                    "A natural example sentence in the target language.",
                },
              },
              required: [
                "word",
                "translation",
                "meaning",
                "example",
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
            "The AI did not return a vocabulary card.",
        },
        { status: 502 },
      );
    }

    let parsedContent: unknown;

    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error(
        "VOCABULARY JSON PARSE ERROR:",
        error,
        content,
      );

      return NextResponse.json(
        {
          error:
            "The AI returned an invalid vocabulary card.",
        },
        { status: 502 },
      );
    }

    const generatedResult =
      generatedVocabularySchema.safeParse(parsedContent);

    if (!generatedResult.success) {
      console.error(
        "VOCABULARY VALIDATION ERROR:",
        generatedResult.error,
      );

      return NextResponse.json(
        {
          error:
            "The generated vocabulary card is incomplete.",
        },
        { status: 502 },
      );
    }

    const generatedCard = generatedResult.data;

    const {
      data: normalizedExistingItem,
      error: normalizedExistingItemError,
    } = await supabase
      .from("vocabulary")
      .select(
        `
          id,
          word,
          translation,
          meaning,
          example,
          status,
          review_count,
          created_at,
          updated_at
        `,
      )
      .eq("user_id", user.id)
      .ilike("word", generatedCard.word)
      .maybeSingle();

    if (normalizedExistingItemError) {
      throw normalizedExistingItemError;
    }

    if (normalizedExistingItem) {
      return NextResponse.json({
        vocabularyItem: normalizedExistingItem,
        alreadyExists: true,
      });
    }

    const { data: vocabularyItem, error: insertError } =
      await supabase
        .from("vocabulary")
        .insert({
          user_id: user.id,
          word: generatedCard.word,
          translation: generatedCard.translation,
          meaning: generatedCard.meaning,
          example: generatedCard.example,
          status: "new",
          review_count: 0,
        })
        .select(
          `
            id,
            word,
            translation,
            meaning,
            example,
            status,
            review_count,
            created_at,
            updated_at
          `,
        )
        .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: duplicateItem } = await supabase
          .from("vocabulary")
          .select(
            `
              id,
              word,
              translation,
              meaning,
              example,
              status,
              review_count,
              created_at,
              updated_at
            `,
          )
          .eq("user_id", user.id)
          .ilike("word", generatedCard.word)
          .maybeSingle();

        return NextResponse.json({
          vocabularyItem: duplicateItem,
          alreadyExists: true,
        });
      }

      throw insertError;
    }

    return NextResponse.json(
      {
        vocabularyItem,
        alreadyExists: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "GENERATE VOCABULARY ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate and save vocabulary card.",
      },
      { status: 500 },
    );
  }
}
