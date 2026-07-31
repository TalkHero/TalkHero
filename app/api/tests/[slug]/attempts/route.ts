import { NextResponse } from "next/server";

import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";
import {
  AssessmentEngineError,
  startAssessmentAttempt,
} from "@/lib/testing/engine";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { slug } = await context.params;
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

    const result = await startAssessmentAttempt({
      userId: user.id,
      testSlug: slug,
    });

    return NextResponse.json(result, {
      status: result.resumed ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof AssessmentEngineError) {
      console.error("Assessment attempt start failed:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      if (error.code === "TEST_NOT_FOUND") {
        return NextResponse.json(
          {
            error: API_ERRORS.internalServerError,
            code: error.code,
          },
          { status: 404 },
        );
      }

      if (
        error.code === "BLUEPRINT_NOT_FOUND" ||
        error.code === "NOT_ENOUGH_QUESTIONS"
      ) {
        return NextResponse.json(
          {
            error: API_ERRORS.internalServerError,
            code: error.code,
          },
          { status: 409 },
        );
      }
    }

    console.error(
      "Unexpected assessment attempt start error:",
      error,
    );

    return NextResponse.json(
      { error: API_ERRORS.internalServerError },
      { status: 500 },
    );
  }
}
