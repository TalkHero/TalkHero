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
  skipAssessmentQuestion,
} from "@/lib/testing/engine";

const MAX_ASSESSMENT_SKIP_BODY_BYTES =
  4 * 1024;

type RouteContext = {
  params: Promise<{
    slug: string;
    attemptId: string;
  }>;
};

type SkipQuestionBody = {
  questionId?: unknown;
};

function getErrorStatus(
  error: AssessmentEngineError,
): number {
  switch (error.code) {
    case "TEST_NOT_FOUND":
    case "ATTEMPT_NOT_FOUND":
    case "QUESTION_NOT_FOUND":
      return 404;

    case "ATTEMPT_NOT_IN_PROGRESS":
    case "QUESTION_OUT_OF_SEQUENCE":
    case "QUESTION_ALREADY_ANSWERED":
      return 409;

    default:
      return 500;
  }
}

function getErrorMessage(
  error: AssessmentEngineError,
): string {
  switch (error.code) {
    case "TEST_NOT_FOUND":
      return API_ERRORS.assessmentTestNotFound;

    case "ATTEMPT_NOT_FOUND":
      return API_ERRORS.assessmentAttemptNotFound;

    case "QUESTION_NOT_FOUND":
      return API_ERRORS.assessmentQuestionNotFound;

    case "ATTEMPT_NOT_IN_PROGRESS":
      return API_ERRORS.assessmentAttemptNotInProgress;

    case "QUESTION_OUT_OF_SEQUENCE":
      return API_ERRORS.assessmentQuestionOutOfSequence;

    case "QUESTION_ALREADY_ANSWERED":
      return API_ERRORS.assessmentQuestionAlreadyAnswered;

    default:
      return API_ERRORS.internalServerError;
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
        {
          error: API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }

    let body: SkipQuestionBody;

    try {
      body =
        (await readJsonBodyWithLimit(
          request,
          MAX_ASSESSMENT_SKIP_BODY_BYTES,
        )) as SkipQuestionBody;
    } catch (error) {
      if (
        error instanceof
        RequestBodyTooLargeError
      ) {
        return NextResponse.json(
          {
            error:
              "Запит пропуску питання занадто великий.",
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
            error: API_ERRORS.invalidRequestData,
          code: "QUESTION_NOT_FOUND",
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
          error: API_ERRORS.invalidRequestData,
          code: "QUESTION_NOT_FOUND",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await skipAssessmentQuestion({
        userId: user.id,
        testSlug: slug,
        attemptId,
        questionId: body.questionId,
      });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AssessmentEngineError) {
      console.error(
        "Assessment question skip failed:",
        {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      );

      return NextResponse.json(
        {
          error: getErrorMessage(error),
          code: error.code,
        },
        {
          status: getErrorStatus(error),
        },
      );
    }

    console.error(
      "Unexpected assessment question skip error:",
      error,
    );

    return NextResponse.json(
      {
        error: API_ERRORS.internalServerError,
      },
      {
        status: 500,
      },
    );
  }
}
