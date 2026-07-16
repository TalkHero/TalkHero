import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createVocabularySchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, "Word is required.")
    .max(100, "Word is too long."),

  translation: z
    .string()
    .trim()
    .max(300, "Translation is too long.")
    .optional()
    .default(""),

  meaning: z
    .string()
    .trim()
    .max(1000, "Meaning is too long.")
    .optional()
    .default(""),

  example: z
    .string()
    .trim()
    .max(1000, "Example is too long.")
    .optional()
    .default(""),
});

export async function GET() {
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

    const { data: vocabulary, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      vocabulary: vocabulary ?? [],
    });
  } catch (error) {
    console.error("GET VOCABULARY ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load vocabulary.",
      },
      {
        status: 500,
      },
    );
  }
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
      createVocabularySchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message ||
            "Invalid vocabulary data.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      word,
      translation,
      meaning,
      example,
    } = validationResult.data;

    const { data: existingWord, error: existingWordError } =
      await supabase
        .from("vocabulary")
        .select("id")
        .eq("user_id", user.id)
        .ilike("word", word)
        .maybeSingle();

    if (existingWordError) {
      throw existingWordError;
    }

    if (existingWord) {
      return NextResponse.json(
        {
          error: `"${word}" is already in your vocabulary.`,
        },
        {
          status: 409,
        },
      );
    }

    const { data: vocabularyItem, error: insertError } =
      await supabase
        .from("vocabulary")
        .insert({
          user_id: user.id,
          word,
          translation: translation || null,
          meaning: meaning || null,
          example: example || null,
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
        return NextResponse.json(
          {
            error: `"${word}" is already in your vocabulary.`,
          },
          {
            status: 409,
          },
        );
      }

      throw insertError;
    }

    return NextResponse.json(
      {
        vocabularyItem,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE VOCABULARY ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to add word.",
      },
      {
        status: 500,
      },
    );
  }
}
