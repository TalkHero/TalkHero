import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";
const ACTIVITY_DAYS_COUNT = 91;

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, API_ERRORS.fullNameRequired)
    .max(100, API_ERRORS.fullNameTooLong),

  nativeLanguage: z.string().trim().min(2).max(20),

  targetLanguage: z.string().trim().min(2).max(20),

  englishLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

type AchievementRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  metric: string;
  target_value: number;
  xp_reward: number;
  sort_order: number | null;
};

type UserAchievementRow = {
  achievement_id: string;
  unlocked_at: string;
};

type ActivityRow = {
  created_at: string;
};

type ActivityCalendarDay = {
  date: string;
  count: number;
};

function getRequiredXpForLevel(level: number) {
  return Math.max(0, (level - 1) * 100);
}

function getProgressData(xp: number, level: number) {
  const safeXp = Math.max(0, xp);
  const safeLevel = Math.max(1, level);

  const currentLevelXp = getRequiredXpForLevel(safeLevel);
  const nextLevelXp = getRequiredXpForLevel(safeLevel + 1);

  const xpInsideCurrentLevel = Math.max(
    0,
    safeXp - currentLevelXp,
  );

  const xpRequiredForNextLevel = Math.max(
    1,
    nextLevelXp - currentLevelXp,
  );

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (xpInsideCurrentLevel / xpRequiredForNextLevel) *
          100,
      ),
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

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getActivityStartDate() {
  const startDate = new Date();

  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(
    startDate.getUTCDate() - (ACTIVITY_DAYS_COUNT - 1),
  );

  return startDate;
}

function buildActivityCalendar(
  messageRows: ActivityRow[],
  speakingRows: ActivityRow[],
) {
  const activityMap = new Map<string, number>();
  const startDate = getActivityStartDate();

  for (let index = 0; index < ACTIVITY_DAYS_COUNT; index += 1) {
    const currentDate = new Date(startDate);

    currentDate.setUTCDate(startDate.getUTCDate() + index);

    activityMap.set(formatDateKey(currentDate), 0);
  }

  const registerActivity = (createdAt: string) => {
    const activityDate = new Date(createdAt);

    if (Number.isNaN(activityDate.getTime())) {
      return;
    }

    const dateKey = formatDateKey(activityDate);

    if (!activityMap.has(dateKey)) {
      return;
    }

    activityMap.set(
      dateKey,
      (activityMap.get(dateKey) ?? 0) + 1,
    );
  };

  messageRows.forEach((row) => {
    registerActivity(row.created_at);
  });

  speakingRows.forEach((row) => {
    registerActivity(row.created_at);
  });

  const days: ActivityCalendarDay[] = Array.from(
    activityMap.entries(),
  ).map(([date, count]) => ({
    date,
    count,
  }));

  const totalActiveDays = days.filter(
    (day) => day.count > 0,
  ).length;

  const totalActivities = days.reduce(
    (total, day) => total + day.count,
    0,
  );

  return {
    days,
    totalActiveDays,
    totalActivities,
  };
}

export async function GET() {
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

    const activityStartDate = getActivityStartDate().toISOString();

    const [
      profileResult,
      conversationsResult,
      vocabularyResult,
      speakingResult,
      speakingActivityResult,
      achievementsResult,
      userAchievementsResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            native_language,
            target_language,
            english_level,
            xp,
            level,
            current_streak,
            longest_streak,
            last_activity_date
          `,
        )
        .eq("id", user.id)
        .single(),

      supabase
        .from("conversations")
        .select("id", {
          count: "exact",
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
        .from("speaking_sessions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id),

      supabase
        .from("speaking_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", activityStartDate),

      supabase
        .from("achievements")
        .select(
          `
            id,
            slug,
            title,
            description,
            icon,
            metric,
            target_value,
            xp_reward,
            sort_order
          `,
        )
        .order("sort_order", {
          ascending: true,
        }),

      supabase
        .from("user_achievements")
        .select(
          `
            achievement_id,
            unlocked_at
          `,
        )
        .eq("user_id", user.id),
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

    if (speakingResult.error) {
      throw speakingResult.error;
    }

    if (speakingActivityResult.error) {
      throw speakingActivityResult.error;
    }

    if (achievementsResult.error) {
      throw achievementsResult.error;
    }

    if (userAchievementsResult.error) {
      throw userAchievementsResult.error;
    }

    const profile = profileResult.data;

    const conversationIds = (
      conversationsResult.data ?? []
    ).map((conversation) => conversation.id);

    let messagesSent = 0;
    let messageActivityRows: ActivityRow[] = [];

    if (conversationIds.length > 0) {
      const [
        messagesCountResult,
        messagesActivityResult,
      ] = await Promise.all([
        supabase
          .from("messages")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("conversation_id", conversationIds)
          .eq("role", "user"),

        supabase
          .from("messages")
          .select("created_at")
          .in("conversation_id", conversationIds)
          .eq("role", "user")
          .gte("created_at", activityStartDate),
      ]);

      if (messagesCountResult.error) {
        throw messagesCountResult.error;
      }

      if (messagesActivityResult.error) {
        throw messagesActivityResult.error;
      }

      messagesSent = messagesCountResult.count ?? 0;

      messageActivityRows =
        (messagesActivityResult.data as
          | ActivityRow[]
          | null) ?? [];
    }

    const speakingActivityRows =
      (speakingActivityResult.data as
        | ActivityRow[]
        | null) ?? [];

    const activity = buildActivityCalendar(
      messageActivityRows,
      speakingActivityRows,
    );

    const achievements =
      (achievementsResult.data as
        | AchievementRow[]
        | null) ?? [];

    const userAchievements =
      (userAchievementsResult.data as
        | UserAchievementRow[]
        | null) ?? [];

    const unlockedAchievementMap = new Map(
      userAchievements.map((achievement) => [
        achievement.achievement_id,
        achievement.unlocked_at,
      ]),
    );

    const achievementItems = achievements.map(
      (achievement) => {
        const unlockedAt =
          unlockedAchievementMap.get(achievement.id) ??
          null;

        return {
          id: achievement.id,
          slug: achievement.slug,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          metric: achievement.metric,
          targetValue: achievement.target_value,
          xpReward: achievement.xp_reward,
          sortOrder: achievement.sort_order ?? 0,
          unlocked: unlockedAt !== null,
          unlockedAt,
        };
      },
    );

    const unlockedAchievements =
      achievementItems.filter(
        (achievement) => achievement.unlocked,
      );

    const xp = profile.xp ?? 0;
    const level = profile.level ?? 1;

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: user.email ?? null,
        fullName: profile.full_name ?? null,
        nativeLanguage:
          profile.native_language ?? null,
        targetLanguage:
          profile.target_language ?? null,
        englishLevel:
          profile.english_level ?? "B1",
      },

      progress: getProgressData(xp, level),

      streak: {
        currentStreak:
          profile.current_streak ?? 0,
        longestStreak:
          profile.longest_streak ?? 0,
        lastActivityDate:
          profile.last_activity_date ?? null,
      },

      activity: {
        days: activity.days,
        totalActiveDays: activity.totalActiveDays,
        totalActivities: activity.totalActivities,
      },

      achievements: {
        items: achievementItems,
        unlocked: unlockedAchievements,
        locked: achievementItems.filter(
          (achievement) => !achievement.unlocked,
        ),
        total: achievementItems.length,
        unlockedCount:
          unlockedAchievements.length,
      },

      statistics: {
        messagesSent,
        savedWords:
          vocabularyResult.count ?? 0,
        speakingSessions:
          speakingResult.count ?? 0,
        conversations:
          conversationsResult.count ?? 0,
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      {
        error: API_ERRORS.failedToLoadProfile,
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
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

    const requestBody: unknown =
      await request.json();

    const validationResult =
      updateProfileSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]
              ?.message ??
            API_ERRORS.invalidProfileData,
        },
        {
          status: 400,
        },
      );
    }

    const {
      fullName,
      nativeLanguage,
      targetLanguage,
      englishLevel,
    } = validationResult.data;

    const { data: profile, error: updateError } =
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          native_language: nativeLanguage,
          target_language: targetLanguage,
          english_level: englishLevel,
        })
        .eq("id", user.id)
        .select(
          `
            id,
            full_name,
            native_language,
            target_language,
            english_level
          `,
        )
        .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        nativeLanguage:
          profile.native_language,
        targetLanguage:
          profile.target_language,
        englishLevel:
          profile.english_level,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: API_ERRORS.failedToUpdateProfile,
      },
      {
        status: 500,
      },
    );
  }
}
