import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

const VALID_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;

type EnglishLevel = (typeof VALID_LEVELS)[number];

type UpdateEnglishLevelRequest = {
  englishLevel?: unknown;
};

function isEnglishLevel(
  value: unknown,
): value is EnglishLevel {
  return (
    typeof value === "string" &&
    VALID_LEVELS.some((level) => level === value)
  );
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: API_ERRORS.unauthorized },
        { status: 401 },
      );
    }

    const body =
      (await request.json()) as UpdateEnglishLevelRequest;

    if (!isEnglishLevel(body.englishLevel)) {
      return NextResponse.json(
        {
          error:
           API_ERRORS.invalidEnglishLevel
        },
        { status: 400 },
      );
    }

    const { data: profile, error: updateError } =
      await supabase
        .from("profiles")
        .update({
          english_level: body.englishLevel,
        })
        .eq("id", user.id)
        .select("english_level")
        .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      englishLevel: profile.english_level,
    });
  } catch (error) {
    console.error("UPDATE ENGLISH LEVEL ERROR:", error);

    return NextResponse.json(
      { error: API_ERRORS.failedToUpdateEnglishLevel },
      { status: 500 },
    );
  }
}
