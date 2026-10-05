import { NextResponse } from "next/server";
import { z } from "zod";

import {
  InvalidJsonBodyError,
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/api/request-body";
import {
  isQuestEngineError,
  startQuest,
} from "@/lib/quests";
import { createClient } from "@/lib/supabase/server";

const MAX_START_BODY_BYTES = 4 * 1024;

const StartQuestSchema = z.object({
  campaignSlug: z.string().trim().min(1).max(120),
  episodeSlug: z.string().trim().min(1).max(120),
  questSlug: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const requestBody =
      await readJsonBodyWithLimit(
        request,
        MAX_START_BODY_BYTES,
      );

    const body =
      StartQuestSchema.parse(requestBody);

    const result = await startQuest({
      userId: user.id,
      ...body,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof
      RequestBodyTooLargeError
    ) {
      return NextResponse.json(
        {
          error:
            "Quest start request is too large",
        },
        { status: 413 },
      );
    }

    if (
      error instanceof
      InvalidJsonBodyError
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid quest start request",
        },
        { status: 400 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid quest start request", issues: error.issues },
        { status: 400 },
      );
    }

    if (isQuestEngineError(error)) {
      const status = [
        "CAMPAIGN_NOT_FOUND",
        "EPISODE_NOT_FOUND",
        "QUEST_NOT_FOUND",
      ].includes(error.code)
        ? 404
        : 409;

      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Не вдалося запустити квест.",
          code: error.code,
          details:
            process.env.NODE_ENV === "development"
              ? error.details
              : undefined,
        },
        { status },
      );
    }

    console.error("START QUEST API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to start quest" },
      { status: 500 },
    );
  }
}
