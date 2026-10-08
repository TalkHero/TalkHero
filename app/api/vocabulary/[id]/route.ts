import { NextResponse } from "next/server";
import { z } from "zod";

import {
  InvalidJsonBodyError,
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/api/request-body";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

const MAX_VOCABULARY_UPDATE_BODY_BYTES =
  4 * 1024;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateVocabularySchema = z.object({
  status: z.enum(["new", "learning", "learned"]),
});

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    let requestBody: unknown;

    try {
      requestBody =
        await readJsonBodyWithLimit(
          request,
          MAX_VOCABULARY_UPDATE_BODY_BYTES,
        );
    } catch (error) {
      if (
        error instanceof
        RequestBodyTooLargeError
      ) {
        return NextResponse.json(
          {
            error:
              "Запит оновлення слова занадто великий.",
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
              API_ERRORS.invalidVocabularyStatus,
          },
          {
            status: 400,
          },
        );
      }

      throw error;
    }

    const validationResult =
      updateVocabularySchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: API_ERRORS.invalidVocabularyStatus },
        { status: 400 },
      );
    }

    const { data: vocabularyItem, error } = await supabase
      .from("vocabulary")
      .update({
        status: validationResult.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
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
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!vocabularyItem) {
      return NextResponse.json(
        { error: API_ERRORS.vocabularyItemNotFound },
        { status: 404 },
      );
    }

    return NextResponse.json({
      vocabularyItem,
    });
  } catch (error) {
    console.error("UPDATE VOCABULARY ERROR:", error);

    return NextResponse.json(
      { error: API_ERRORS.failedToUpdateVocabularyItem },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const { data: vocabularyItem, error: findError } =
      await supabase
        .from("vocabulary")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!vocabularyItem) {
      return NextResponse.json(
        { error: API_ERRORS.vocabularyItemNotFound },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase
      .from("vocabulary")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      deletedVocabularyId: id,
    });
  } catch (error) {
    console.error("DELETE VOCABULARY ERROR:", error);

    return NextResponse.json(
      { error: API_ERRORS.failedToDeleteVocabularyItem },
      { status: 500 },
    );
  }
}
