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

    const { data: cards, error: cardsError } = await supabase
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
          ease_factor,
          interval_days,
          repetitions,
          next_review_at,
          last_reviewed_at,
          created_at,
          updated_at
        `,
      )
      .eq("user_id", user.id)
      .lte("next_review_at", now)
      .order("next_review_at", { ascending: true })
      .limit(50);

    if (cardsError) {
      throw cardsError;
    }

    const { count: totalCount, error: totalCountError } =
      await supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

    if (totalCountError) {
      throw totalCountError;
    }

    const { count: learnedCount, error: learnedCountError } =
      await supabase
        .from("vocabulary")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "learned");

    if (learnedCountError) {
      throw learnedCountError;
    }

    return NextResponse.json({
      cards: cards ?? [],
      stats: {
        due: cards?.length ?? 0,
        total: totalCount ?? 0,
        learned: learnedCount ?? 0,
      },
    });
  } catch (error) {
    console.error("GET REVIEW CARDS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load review cards.",
      },
      {
        status: 500,
      },
    );
  }
}
