import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

const evaluationSchema = z.object({
  grammarScore: z.number().finite().min(0).max(100),
  fluencyScore: z.number().finite().min(0).max(100),
  vocabularyScore: z.number().finite().min(0).max(100),
  naturalnessScore: z.number().finite().min(0).max(100),
  overallScore: z.number().finite().min(0).max(100),
});

const completeSpeakingSessionSchema = z.object({
  conversationId: z.string().uuid().nullable(),

  startedAt: z.string().datetime({
    offset: true,
  }),

  durationSeconds: z
    .number()
    .int()
    .nonnegative()
    .max(60 * 60 * 6),

  evaluations: z.array(evaluationSchema).max(500),
});

type NumericEvaluationField =
  | "grammarScore"
  | "fluencyScore"
  | "vocabularyScore"
  | "naturalnessScore"
  | "overallScore";

type CompleteSpeakingRpcRow = {
  session_id: string;
  xp_earned: number;
  total_xp: number;
  level: number;
  previous_level: number;
  leveled_up: boolean;
  already_completed: boolean;
};

function calculateAverage(
  evaluations: z.infer<typeof evaluationSchema>[],
  field: NumericEvaluationField,
) {
  if (evaluations.length === 0) {
    return 0;
  }

  const total = evaluations.reduce(
    (sum, evaluation) => sum + evaluation[field],
    0,
  );

  return Math.round(total / evaluations.length);
}

function getRequiredXpForLevel(level: number) {
  return Math.max(0, (level - 1) * 100);
}

function getProgressData(xp: number, level: number) {
  const safeXp = Math.max(0, xp);
  const safeLevel = Math.max(1, level);

  const currentLevelXp = getRequiredXpForLevel(safeLevel);

  const nextLevelXp = getRequiredXpForLevel(safeLevel + 1);

  const xpInsideCurrentLevel = Math.max(0, safeXp - currentLevelXp);

  const xpRequiredForNextLevel = Math.max(1, nextLevelXp - currentLevelXp);

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round((xpInsideCurrentLevel / xpRequiredForNextLevel) * 100),
    ),
  );

  return {
    xp: safeXp,
    level: safeLevel,
    currentLevelXp,
    nextLevelXp,
    xpInsideCurrentLevel,
    xpRequiredForNextLevel,
    progressPercent,
  };
}

export async function POST(request: Request) {
  try {
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

    const requestBody: unknown = await request.json();

    const validationResult =
      completeSpeakingSessionSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message ??
            API_ERRORS.invalidSpeakingSessionData,
        },
        {
          status: 400,
        },
      );
    }

    const { conversationId, startedAt, durationSeconds, evaluations } =
      validationResult.data;

    const startedAtDate = new Date(startedAt);

    if (
      Number.isNaN(startedAtDate.getTime()) ||
      startedAtDate.getTime() > Date.now()
    ) {
      return NextResponse.json(
        {
          error: API_ERRORS.invalidSessionStartTime,
        },
        {
          status: 400,
        },
      );
    }

    const completedAt = Date.now();

    const maximumPossibleDuration = Math.max(
      0,
      Math.floor((completedAt - startedAtDate.getTime()) / 1000) + 10,
    );

    if (durationSeconds > maximumPossibleDuration) {
      return NextResponse.json(
        {
          error: API_ERRORS.invalidSessionDuration,
        },
        {
          status: 400,
        },
      );
    }

    const averages = {
      overallScore: calculateAverage(evaluations, "overallScore"),

      grammarScore: calculateAverage(evaluations, "grammarScore"),

      fluencyScore: calculateAverage(evaluations, "fluencyScore"),

      vocabularyScore: calculateAverage(evaluations, "vocabularyScore"),

      naturalnessScore: calculateAverage(evaluations, "naturalnessScore"),
    };

    const { data, error: completionError } = await supabase.rpc(
      "complete_speaking_session",
      {
        p_conversation_id: conversationId,
        p_overall_score: averages.overallScore,
        p_grammar_score: averages.grammarScore,
        p_fluency_score: averages.fluencyScore,
        p_vocabulary_score: averages.vocabularyScore,
        p_naturalness_score: averages.naturalnessScore,
        p_answers_count: evaluations.length,
        p_duration_seconds: durationSeconds,
        p_started_at: startedAtDate.toISOString(),
      },
    );

    if (completionError) {
      throw completionError;
    }

    const completionResult = (data as CompleteSpeakingRpcRow[] | null)?.[0];

    if (!completionResult) {
      throw new Error(API_ERRORS.speakingSessionNotCompleted);
    }

    return NextResponse.json({
      success: true,

      session: {
        id: completionResult.session_id,
        conversationId,
        answersCount: evaluations.length,
        durationSeconds,

        scores: averages,

        xpEarned: completionResult.xp_earned,

        alreadyCompleted: completionResult.already_completed,
      },

      progress: {
  ...getProgressData(
    completionResult.total_xp,
    completionResult.level,
  ),

  previousLevel: completionResult.previous_level,
  leveledUp: completionResult.leveled_up,
},
    });
 } catch (error) {
  console.error("COMPLETE SPEAKING SESSION ERROR:", error);

  return NextResponse.json(
    {
      error: API_ERRORS.failedToCompleteSpeakingSession,
    },
    {
      status: 500,
    },
  );
}
}
