import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(100, "Full name is too long."),

  nativeLanguage: z
    .string()
    .trim()
    .min(2)
    .max(20),

  targetLanguage: z
    .string()
    .trim()
    .min(2)
    .max(20),

  englishLevel: z.enum([
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
  ]),
});

export async function PATCH(request: Request) {
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
      updateProfileSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message ||
            "Invalid profile data.",
        },
        { status: 400 },
      );
    }

    const {
      fullName,
      nativeLanguage,
      targetLanguage,
      englishLevel,
    } = validationResult.data;

    const { data: profile, error: updateError } =
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          native_language: nativeLanguage,
          target_language: targetLanguage,
          english_level: englishLevel,
        })
        .eq("id", user.id)
        .select(
          "full_name, native_language, target_language, english_level",
        )
        .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 },
    );
  }
}
