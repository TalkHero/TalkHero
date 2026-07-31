import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { API_ERRORS } from "@/lib/i18n/errors";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
        error: API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }

    const { data: sessions, error } = await supabase
      .from("speaking_sessions")
      .select(`
        id,
        conversation_id,
        overall_score,
        grammar_score,
        fluency_score,
        vocabulary_score,
        naturalness_score,
        answers_count,
        duration_seconds,
        xp_earned,
        started_at,
        completed_at,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    const rows = sessions ?? [];

    const totalSessions = rows.length;

    const totalXP = rows.reduce(
      (sum, row) => sum + row.xp_earned,
      0,
    );

    const totalPracticeMinutes = Math.round(
      rows.reduce(
        (sum, row) => sum + row.duration_seconds,
        0,
      ) / 60,
    );

    const totalAnswers = rows.reduce(
      (sum, row) => sum + row.answers_count,
      0,
    );

    const averageOverall =
      totalSessions === 0
        ? 0
        : Math.round(
            rows.reduce(
              (sum, row) => sum + row.overall_score,
              0,
            ) / totalSessions,
          );

    const bestScore =
      totalSessions === 0
        ? 0
        : Math.max(
            ...rows.map((row) => row.overall_score),
          );

    return NextResponse.json({
      sessions: rows,

      stats: {
        totalSessions,
        totalXP,
        averageOverall,
        bestScore,
        totalPracticeMinutes,
        totalAnswers,
      },
    });
  } catch (error) {
    console.error("SPEAKING HISTORY ERROR:", error);

    return NextResponse.json(
  {
    error: API_ERRORS.failedToLoadSpeakingHistory,
  },
  {
    status: 500,
  },
);
  }
}
