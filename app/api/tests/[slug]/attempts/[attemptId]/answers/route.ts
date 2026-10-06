import { NextResponse } from "next/server";

import {
  InvalidJsonBodyError,
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/api/request-body";
import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";
import {
  AssessmentEngineError,
  submitAssessmentAnswer,
} from "@/lib/testing/engine";

const MAX_ASSESSMENT_ANSWER_BODY_BYTES =
  32 * 1024;

type RouteContext = {
  params: Promise<{
    slug: string;
    attemptId: string;
  }>;
};

type SubmitAnswerBody = {
  questionId?: unknown;
  answer?: unknown;
};

function getErrorStatus(
  error: AssessmentEngineError,
): number {
  switch (error.code) {
    case "TEST_NOT_FOUND":
    case "ATTEMPT_NOT_FOUND":
    case "QUESTION_NOT_FOUND":
      return 404;

    case "INVALID_ANSWER":
      return 400;

    case "ATTEMPT_NOT_IN_PROGRESS":
    case "QUESTION_OUT_OF_SEQUENCE":
    case "QUESTION_ALREADY_ANSWERED":
      return 409;

    default:
      return 500;
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { slug, attemptId } =
      await context.params;

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

    let body: SubmitAnswerBody;

    try {
      body =
        (await readJsonBodyWithLimit(
          request,
          MAX_ASSESSMENT_ANSWER_BODY_BYTES,
        )) as SubmitAnswerBody;
    } catch (error) {
      if (
        error instanceof
        RequestBodyTooLargeError
      ) {
        return NextResponse.json(
          {
            error:
              "Відповідь тесту занадто велика.",
            code: "INVALID_ANSWER",
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
            error: API_ERRORS.internalServerError,
            code: "INVALID_ANSWER",
          },
          {
            status: 400,
          },
        );
      }

      throw error;
    }

    if (
      typeof body.questionId !== "string" ||
      body.questionId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: API_ERRORS.internalServerError,
          code: "QUESTION_NOT_FOUND",
        },
        { status: 400 },
      );
    }

    const result =
      await submitAssessmentAnswer({
        userId: user.id,
        testSlug: slug,
        attemptId,
        questionId: body.questionId,
        answer: body.answer,
      });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AssessmentEngineError) {
      console.error(
        "Assessment answer submission failed:",
        {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      );

      return NextResponse.json(
        {
          error: API_ERRORS.internalServerError,
          code: error.code,
        },
        {
          status: getErrorStatus(error),
        },
      );
    }

    console.error(
      "Unexpected assessment answer submission error:",
      error,
    );

    return NextResponse.json(
      {
        error: API_ERRORS.internalServerError,
      },
      { status: 500 },
    );
  }
}
