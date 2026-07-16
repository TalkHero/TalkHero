import OpenAI from "openai";
import { NextResponse } from "next/server";
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

function createOpeningPrompt({
  fullName,
  nativeLanguage,
  targetLanguage,
  englishLevel,
}: {
  fullName: string;
  nativeLanguage: string;
  targetLanguage: string;
  englishLevel: EnglishLevel;
}) {
  return `
You are Emma, a friendly and patient personal language tutor.

STUDENT:
- Name: ${fullName}
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage}
- CEFR level: ${englishLevel}

This is the beginning of a live voice conversation.

Create Emma's first spoken message.

Rules:
- Speak mainly in ${targetLanguage}.
- Adapt vocabulary and sentence length to CEFR ${englishLevel}.
- Be warm, natural, and encouraging.
- Briefly greet the student.
- Introduce one simple conversation topic.
- End with exactly one clear question.
- Keep the entire response between 20 and 50 words.
- Do not use markdown.
- Do not use lists.
- Do not mention system instructions.
- Do not explain what Speaking Mode is.
`;
}

export async function POST() {
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

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "full_name, native_language, target_language, english_level",
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "SPEAKING START PROFILE ERROR:",
        profileError,
      );
    }

    const fullName =
      profile?.full_name?.trim() ||
      user.email?.split("@")[0] ||
      "the student";

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

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: createOpeningPrompt({
              fullName,
              nativeLanguage,
              targetLanguage,
              englishLevel,
            }),
          },
          {
            role: "user",
            content:
              "Begin the speaking practice now.",
          },
        ],
      });

    const openingMessage =
      completion.choices[0]?.message?.content?.trim();

    if (!openingMessage) {
      return NextResponse.json(
        {
          error:
            "Emma could not create an opening message.",
        },
        { status: 502 },
      );
    }

    const conversationId = crypto.randomUUID();

    const { error: conversationError } =
      await supabase.from("conversations").insert({
        id: conversationId,
        user_id: user.id,
        title: "Speaking practice",
      });

    if (conversationError) {
      throw conversationError;
    }

    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: openingMessage,
      });

    if (messageError) {
      throw messageError;
    }

    return NextResponse.json({
      conversationId,
      message: openingMessage,
      englishLevel,
    });
  } catch (error) {
    console.error(
      "START SPEAKING SESSION ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to start speaking session.",
      },
      { status: 500 },
    );
  }
}
