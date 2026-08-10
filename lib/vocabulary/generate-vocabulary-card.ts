import "server-only";

import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type EnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const VALID_LEVELS: EnglishLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

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

const generatedVocabularySchema = z.object({
  word: z.string().trim().min(1).max(100),

  translation: z.string().trim().min(1).max(300),

  meaning: z.string().trim().min(1).max(1000),

  example: z.string().trim().min(1).max(1000),
});

export type GeneratedVocabularyCard = z.infer<typeof generatedVocabularySchema>;

function normalizeEnglishLevel(value: string | null | undefined): EnglishLevel {
  const normalized = value?.toUpperCase() as EnglishLevel;

  return VALID_LEVELS.includes(normalized) ? normalized : "A1";
}

function getLanguageName(
  value: string | null | undefined,
  fallback: string,
): string {
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
}): string {
  const trimmedWord = word.trim();

  const isPhrase = /\s/.test(trimmedWord);

  const phraseRule = isPhrase
    ? `
- IMPORTANT: The input is a complete phrase or sentence.
- Preserve the full phrase exactly as a phrase.
- Do NOT reduce the phrase to a single dictionary word.
- "word" must represent the complete phrase or sentence.
- "translation" must translate the complete phrase or sentence.
- "meaning" must explain the communicative meaning of the complete phrase or sentence.
- "example" must demonstrate the complete phrase or the same communicative pattern naturally.
`
    : `
- The input is an individual word.
- Return the most natural dictionary form of that individual word.
- Keep the meaning consistent with the supplied context.
`;

  return `
Create a concise vocabulary card for a language learner.

STUDENT:
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage}
- CEFR level: ${englishLevel}

WORD OR PHRASE:
${trimmedWord}

CONTEXT:
${context || "No context was provided."}

REQUIREMENTS:
${phraseRule}
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

export async function generateVocabularyCard({
  word,
  context = "",
  nativeLanguage,
  targetLanguage,
  englishLevel,
}: {
  word: string;
  context?: string;
  nativeLanguage?: string | null;
  targetLanguage?: string | null;
  englishLevel?: string | null;
}): Promise<GeneratedVocabularyCard> {
  const trimmedWord = word.trim();

  if (!trimmedWord) {
    throw new Error("Vocabulary word or phrase is required.");
  }

  const resolvedNativeLanguage = getLanguageName(nativeLanguage, "Ukrainian");

  const resolvedTargetLanguage = getLanguageName(targetLanguage, "English");

  const resolvedEnglishLevel = normalizeEnglishLevel(englishLevel);

  const completion = await openai.chat.completions.create({
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
          word: trimmedWord,
          context,
          nativeLanguage: resolvedNativeLanguage,
          targetLanguage: resolvedTargetLanguage,
          englishLevel: resolvedEnglishLevel,
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
                "The vocabulary word or complete phrase being learned.",
            },

            translation: {
              type: "string",
              description: "Translation into the student's native language.",
            },

            meaning: {
              type: "string",
              description: "A concise explanation in the target language.",
            },

            example: {
              type: "string",
              description: "A natural example sentence in the target language.",
            },
          },

          required: ["word", "translation", "meaning", "example"],

          additionalProperties: false,
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI did not return a vocabulary card.");
  }

  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid vocabulary JSON.");
  }

  const result = generatedVocabularySchema.safeParse(parsedContent);

  if (!result.success) {
    throw new Error("AI returned an incomplete vocabulary card.");
  }

  const generated = result.data;

  const isPhrase = /\s/.test(trimmedWord);

  /*
   * Для повної фрази не дозволяємо
   * AI замінити її одним словом.
   *
   * Наприклад:
   *
   * I need the account for everyday spending
   *
   * має залишитися цілою фразою,
   * а не перетворитися на "account".
   */
  if (isPhrase) {
    return {
      ...generated,
      word: trimmedWord,
    };
  }

  return generated;
}
