import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isQuestEngineError,
  startQuest,
} from "@/lib/quests";
import { createClient } from "@/lib/supabase/server";

const StartQuestSchema = z.object({
  campaignSlug: z.string().trim().min(1).max(120),
  episodeSlug: z.string().trim().min(1).max(120),
  questSlug: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const body = StartQuestSchema.parse(await request.json());
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

    const result = await startQuest({
      userId: user.id,
      ...body,
    });

    return NextResponse.json(result);
  } catch (error) {
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
        { error: error.message, code: error.code, details: error.details },
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
