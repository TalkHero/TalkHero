import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

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
    throw new Error(API_ERRORS.userIdRequired);
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(API_ERRORS.invalidXpAmount);
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
    throw new Error(API_ERRORS.failedToAwardXp);
  }

  const rows = data as AwardXpRow[] | null;
  const progress = rows?.[0];

  if (!progress) {
    throw new Error(API_ERRORS.missingUpdatedProgress);
  }

  return {
    xp: progress.xp,
    level: progress.level,
    streak: progress.streak,
    lastActivityDate:
      progress.last_activity_date,
  };
}
