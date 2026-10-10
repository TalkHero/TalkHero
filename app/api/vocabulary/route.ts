import { NextResponse } from "next/server";
import { z } from "zod";

import {
  InvalidJsonBodyError,
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/api/request-body";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

const MAX_VOCABULARY_CREATE_BODY_BYTES =
  16 * 1024;

const createVocabularySchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, API_ERRORS.wordRequired)
    .max(
      100,
      "Слово не може містити більше 100 символів.",
    ),

  translation: z
    .string()
    .trim()
    .min(1, "Переклад є обов'язковим для ручної картки.")
    .max(
      300,
      "Переклад не може містити більше 300 символів.",
    ),

  meaning: z
    .string()
    .trim()
    .min(
      1,
      "Пояснення є обов'язковим для ручної картки.",
    )
    .max(
      1000,
      "Пояснення не може містити більше 1000 символів.",
    ),

  example: z
    .string()
    .trim()
    .min(
      1,
      "Приклад є обов'язковим для ручної картки.",
    )
    .max(
      1000,
      "Приклад не може містити більше 1000 символів.",
    ),
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
        { error: API_ERRORS.unauthorized },
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
        error: API_ERRORS.failedToLoadVocabulary,
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
        { error: API_ERRORS.unauthorized },
        { status: 401 },
      );
    }

    let requestBody: unknown;

    try {
      requestBody =
        await readJsonBodyWithLimit(
          request,
          MAX_VOCABULARY_CREATE_BODY_BYTES,
        );
    } catch (error) {
      if (
        error instanceof
        RequestBodyTooLargeError
      ) {
        return NextResponse.json(
          {
            error:
              "Запит додавання слова занадто великий.",
          },
          {
            status: 413,
          },
        );
      }

      if (
        error instanceof
        InvalidJsonBodyError
      ) {
        return NextResponse.json(
          {
            error:
              API_ERRORS.invalidVocabularyData,
          },
          {
            status: 400,
          },
        );
      }

      throw error;
    }

    const validationResult =
      createVocabularySchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message ||
            API_ERRORS.invalidVocabularyData,
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
          error: `Слово "${word}" вже є у вашому словнику.`,
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
            error: `Слово "${word}" вже є у вашому словнику.`,
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
        error: API_ERRORS.failedToAddWord,
      },
      {
        status: 500,
      },
    );
  }
}
