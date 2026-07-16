import { createClient } from "@/lib/supabase/server";

export type ProgressReward = {
  xp: number;
  level: number;
  streak: number;
  lastActivityDate: string;
};

type AwardXpOptions = {
  userId: string;
  amount: number;
};

type AwardXpRow = {
  xp: number;
  level: number;
  streak: number;
  last_activity_date: string;
};

export async function awardXp({
  userId,
  amount,
}: AwardXpOptions): Promise<ProgressReward> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "XP amount must be a positive integer.",
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "award_user_xp",
    {
      p_user_id: userId,
      p_amount: amount,
    },
  );

  if (error) {
    console.error("AWARD XP ERROR:", error);
    throw new Error("Failed to award XP.");
  }

  const rows = data as AwardXpRow[] | null;
  const progress = rows?.[0];

  if (!progress) {
    throw new Error(
      "XP reward did not return updated progress.",
    );
  }

  return {
    xp: progress.xp,
    level: progress.level,
    streak: progress.streak,
    lastActivityDate:
      progress.last_activity_date,
  };
}
