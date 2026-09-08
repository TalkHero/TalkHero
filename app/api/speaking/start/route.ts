import { NextResponse } from "next/server";

import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";

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

function normalizeEnglishLevel(value: string | null | undefined): EnglishLevel {
  const normalized = value?.trim().toUpperCase() as EnglishLevel;

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

function getFirstName(fullName: string | null | undefined): string | null {
  const normalized = fullName?.trim();

  if (!normalized) {
    return null;
  }

  const [firstName] = normalized.split(/\s+/);

  return firstName?.trim() || null;
}

function createOpeningMessage({
  firstName,
  nativeLanguage,
  targetLanguage,
}: {
  firstName: string | null;
  nativeLanguage: string;
  targetLanguage: string;
}): string {
  if (targetLanguage === "English") {
    if (firstName) {
      return `Hi, ${firstName}! I'm Emma. Nice to meet you. What do you like doing in your free time?`;
    }

    return "Hi! I'm Emma. Nice to meet you. What's your name?";
  }

  if (nativeLanguage === "Ukrainian") {
    return firstName
      ? `Привіт, ${firstName}! Почнімо розмову. Спробуй сказати мені щось ${targetLanguage}.`
      : `Привіт! Почнімо розмову. Спробуй сказати мені щось ${targetLanguage}.`;
  }

  return firstName
    ? `Hi, ${firstName}! Let's practise ${targetLanguage}. Tell me something about yourself.`
    : `Hi! Let's practise ${targetLanguage}. Tell me something about yourself.`;
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
        {
          error: API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, native_language, target_language, english_level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("SPEAKING START PROFILE ERROR:", profileError);
    }
    const firstName = getFirstName(profile?.full_name);

    const nativeLanguage = getLanguageName(
      profile?.native_language,
      "Ukrainian",
    );

    const targetLanguage = getLanguageName(profile?.target_language, "English");

    const englishLevel = normalizeEnglishLevel(profile?.english_level);

    /*
     * ВАЖЛИВО:
     * перша репліка більше не потребує
     * OpenAI Chat Completion.
     *
     * Вона створюється миттєво
     * на сервері.
     */
    const openingMessage = createOpeningMessage({
      firstName,
      nativeLanguage,
      targetLanguage,
    });

    const conversationId = crypto.randomUUID();

    const { error: conversationError } = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        user_id: user.id,
        title: "Speaking practice",
      });

    if (conversationError) {
      throw conversationError;
    }

    const { error: messageError } = await supabase.from("messages").insert({
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
      nativeLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error("START SPEAKING SESSION ERROR:", error);

    return NextResponse.json(
      {
        error: API_ERRORS.failedToStartSpeakingSession,
      },
      {
        status: 500,
      },
    );
  }
}
