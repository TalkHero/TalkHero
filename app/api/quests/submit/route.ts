import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isQuestEngineError,
  submitQuestScene,
} from "@/lib/quests";
import { createClient } from "@/lib/supabase/server";

const SubmitQuestSceneSchema =
  z.object({
    runId: z.string().uuid(),
    userInput: z.unknown(),
    responseTimeMs:
      z
        .number()
        .int()
        .nonnegative()
        .nullable()
        .optional(),
  });

export async function POST(
  request: Request,
) {
  try {
    const body =
      SubmitQuestSceneSchema.parse(
        await request.json(),
      );

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "Потрібно увійти до облікового запису.",
        },
        {
          status: 401,
        },
      );
    }

    const result =
      await submitQuestScene({
        userId: user.id,
        runId: body.runId,
        userInput:
          body.userInput,
        responseTimeMs:
          body.responseTimeMs,
      });

    return NextResponse.json(
      result,
    );
  } catch (error) {
    if (
      error instanceof z.ZodError
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректні дані відповіді.",
          issues:
            error.issues,
        },
        {
          status: 400,
        },
      );
    }

    if (
      isQuestEngineError(error)
    ) {
      const status =
        error.code ===
        "QUEST_RUN_NOT_FOUND"
          ? 404
          : 409;

      return NextResponse.json(
        {
          error:
            error.message,
          code:
            error.code,
          details:
            error.details,
        },
        {
          status,
        },
      );
    }

    console.error(
      "ПОМИЛКА API НАДСИЛАННЯ СЦЕНИ:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Не вдалося надіслати відповідь.",
      },
      {
        status: 500,
      },
    );
  }
}
