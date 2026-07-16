import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const now = new Date().toISOString();

    const [
      profileResult,
      conversationsResult,
      vocabularyResult,
      learnedResult,
      dueResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, english_level, xp, level, streak",
        )
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("conversations")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "learned"),

      supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .lte("next_review_at", now),
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (conversationsResult.error) {
      throw conversationsResult.error;
    }

    if (vocabularyResult.error) {
      throw vocabularyResult.error;
    }

    if (learnedResult.error) {
      throw learnedResult.error;
    }

    if (dueResult.error) {
      throw dueResult.error;
    }

    return NextResponse.json({
      profile: {
        fullName:
          profileResult.data?.full_name ||
          user.email?.split("@")[0] ||
          "Student",

        englishLevel:
          profileResult.data?.english_level || "A1",

        xp: profileResult.data?.xp ?? 0,
        level: profileResult.data?.level ?? 1,
        streak: profileResult.data?.streak ?? 0,
      },

      stats: {
        conversations: conversationsResult.count ?? 0,
        vocabulary: vocabularyResult.count ?? 0,
        learned: learnedResult.count ?? 0,
        dueToday: dueResult.count ?? 0,
      },
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard statistics.",
      },
      {
        status: 500,
      },
    );
  }
}
