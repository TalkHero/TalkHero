import { NextResponse } from "next/server";
import { z } from "zod";

import {
  InvalidJsonBodyError,
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/api/request-body";
import {
  isQuestEngineError,
  submitQuestScene,
} from "@/lib/quests";
import { createClient } from "@/lib/supabase/server";

const MAX_SUBMIT_BODY_BYTES = 16 * 1024;
const MAX_USER_INPUT_LENGTH = 2000;

const SubmitQuestSceneSchema =
  z.object({
    runId: z.string().uuid(),
    sceneId: z.string().uuid(),
    submissionId: z.string().uuid(),
    userInput:
      z
        .unknown()
        .refine(
          (value) =>
            typeof value !== "string" ||
            value.length <=
              MAX_USER_INPUT_LENGTH,
          {
            message:
              "Quest answer is too long.",
          },
        ),
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

    const requestBody =
      await readJsonBodyWithLimit(
        request,
        MAX_SUBMIT_BODY_BYTES,
      );

    const body =
      SubmitQuestSceneSchema.parse(
        requestBody,
      );

    const result =
      await submitQuestScene({
        userId: user.id,
        runId: body.runId,
        sceneId: body.sceneId,
        submissionId: body.submissionId,
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
      error instanceof
      RequestBodyTooLargeError
    ) {
      return NextResponse.json(
        {
          error:
            "Запит занадто великий.",
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
            "Некоректні дані відповіді.",
        },
        {
          status: 400,
        },
      );
    }

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
            process.env.NODE_ENV === "development"
              ? error.message
              : "Не вдалося надіслати відповідь.",
          code:
            error.code,
          details:
            process.env.NODE_ENV === "development"
              ? error.details
              : undefined,
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
