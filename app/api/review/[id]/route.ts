import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const reviewSchema = z.object({
  grade: z.enum(["again", "hard", "good", "easy"]),
});

type ReviewGrade = z.infer<typeof reviewSchema>["grade"];

type ReviewState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

function calculateNextReview(
  grade: ReviewGrade,
  current: ReviewState,
) {
  let easeFactor = current.easeFactor || 2.5;
  let intervalDays = current.intervalDays || 0;
  let repetitions = current.repetitions || 0;

  if (grade === "again") {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  if (grade === "hard") {
    repetitions = Math.max(1, repetitions);
    intervalDays =
      intervalDays <= 1
        ? 1
        : Math.max(1, Math.round(intervalDays * 1.2));

    easeFactor = Math.max(1.3, easeFactor - 0.15);
  }

  if (grade === "good") {
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(
        1,
        Math.round(intervalDays * easeFactor),
      );
    }
  }

  if (grade === "easy") {
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 4;
    } else {
      intervalDays = Math.max(
        2,
        Math.round(intervalDays * easeFactor * 1.3),
      );
    }

    easeFactor += 0.15;
  }

  const nextReviewDate = new Date();

  if (grade === "again") {
    nextReviewDate.setMinutes(
      nextReviewDate.getMinutes() + 10,
    );
  } else {
    nextReviewDate.setDate(
      nextReviewDate.getDate() + intervalDays,
    );
  }

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    repetitions,
    nextReviewAt: nextReviewDate.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
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

    const { id } = await context.params;

    const requestBody: unknown = await request.json();

    const validationResult =
      reviewSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            API_ERRORS.invalidReviewGrade,
        },
        { status: 400 },
      );
    }

    const { data: card, error: cardError } = await supabase
      .from("vocabulary")
      .select(
        `
          id,
          status,
          review_count,
          ease_factor,
          interval_days,
          repetitions
        `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cardError) {
      throw cardError;
    }

    if (!card) {
      return NextResponse.json(
        { error: API_ERRORS.reviewCardNotFound },
        { status: 404 },
      );
    }

    const nextReview = calculateNextReview(
      validationResult.data.grade,
      {
        easeFactor: Number(card.ease_factor ?? 2.5),
        intervalDays: card.interval_days ?? 0,
        repetitions: card.repetitions ?? 0,
      },
    );

    const newReviewCount =
      (card.review_count ?? 0) + 1;

    const newStatus =
      nextReview.repetitions >= 3
        ? "learned"
        : nextReview.repetitions > 0
          ? "learning"
          : "new";

    const now = new Date().toISOString();

    const { data: updatedCard, error: updateError } =
      await supabase
        .from("vocabulary")
        .update({
          status: newStatus,
          review_count: newReviewCount,
          ease_factor: nextReview.easeFactor,
          interval_days: nextReview.intervalDays,
          repetitions: nextReview.repetitions,
          next_review_at: nextReview.nextReviewAt,
          last_reviewed_at: now,
          updated_at: now,
        })
        .eq("id", id)
        .eq("user_id", user.id)
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
        .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      card: updatedCard,
      grade: validationResult.data.grade,
    });
  } catch (error) {
    console.error("REVIEW CARD ERROR:", error);

    return NextResponse.json(
      {
        error: API_ERRORS.failedToUpdateReviewCard,
      },
      {
        status: 500,
      },
    );
  }
}
