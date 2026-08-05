import "server-only";

import { createClient } from "@/lib/supabase/server";

export type MissionProgressStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export type AdventureMissionProgress = {
  questId: string;
  questSlug: string;
  status: MissionProgressStatus;
  bestScore: number;
  bestScorePercentage: number;
  stars: number;
  timesStarted: number;
  timesCompleted: number;
};

export type AdventureCampaignProgress = {
  campaignSlug: string;
  totalMissions: number;
  completedMissions: number;
  totalStars: number;
  earnedStars: number;
  missions: AdventureMissionProgress[];
};

type QuestProgressRow = {
  quest_id: string;
  status: MissionProgressStatus;
  best_score: number | string;
  best_score_percentage: number | string;
  stars: number;
  times_started: number;
  times_completed: number;
};

function isQuestProgressRow(
  value: unknown,
): value is QuestProgressRow {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const row =
    value as Record<string, unknown>;

  return (
    typeof row.quest_id === "string" &&
    typeof row.status === "string" &&
    [
      "locked",
      "available",
      "in_progress",
      "completed",
    ].includes(row.status) &&
    (typeof row.best_score === "number" ||
      typeof row.best_score === "string") &&
    (typeof row.best_score_percentage === "number" ||
      typeof row.best_score_percentage === "string") &&
    typeof row.stars === "number" &&
    typeof row.times_started === "number" &&
    typeof row.times_completed === "number"
  );
}

export async function getAdventureCampaignProgress(
  campaignSlug: string,
): Promise<AdventureCampaignProgress> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  const {
    data: campaignRow,
    error: campaignError,
  } = await supabase
    .from("quest_campaigns")
    .select("id, slug")
    .eq("slug", campaignSlug)
    .maybeSingle();

  if (campaignError) {
    throw campaignError;
  }

  if (!campaignRow) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const {
    data: episodes,
    error: episodesError,
  } = await supabase
    .from("quest_episodes")
    .select("id, order_index")
    .eq("campaign_id", campaignRow.id)
    .eq("status", "published")
    .order("order_index", {
      ascending: true,
    });

  if (episodesError) {
    throw episodesError;
  }

  const episodeIds = (episodes ?? []).map(
    (episode) => episode.id,
  );

  if (episodeIds.length === 0) {
    return {
      campaignSlug,
      totalMissions: 0,
      completedMissions: 0,
      totalStars: 0,
      earnedStars: 0,
      missions: [],
    };
  }

  const {
    data: quests,
    error: questsError,
  } = await supabase
    .from("quests")
    .select(
      "id, slug, episode_id, order_index",
    )
    .in("episode_id", episodeIds)
    .eq("status", "published");

  if (questsError) {
    throw questsError;
  }

  const episodeOrder = new Map(
    (episodes ?? []).map((episode) => [
      episode.id,
      episode.order_index,
    ]),
  );

  const orderedQuests = [...(quests ?? [])].sort(
    (left, right) => {
      const episodeDifference =
        (episodeOrder.get(left.episode_id) ?? 0) -
        (episodeOrder.get(right.episode_id) ?? 0);

      if (episodeDifference !== 0) {
        return episodeDifference;
      }

      return (
        left.order_index -
        right.order_index
      );
    },
  );

  const questIds = orderedQuests.map(
    (quest) => quest.id,
  );

  let progressRows: QuestProgressRow[] = [];

  if (questIds.length > 0) {
    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from("user_quest_progress")
      .select(
        "quest_id, status, best_score, best_score_percentage, stars, times_started, times_completed",
      )
      .eq("user_id", user.id)
      .in("quest_id", questIds);

    if (progressError) {
      throw progressError;
    }

    progressRows = Array.isArray(progress)
      ? progress.filter(
          isQuestProgressRow,
        )
      : [];
  }

  const progressByQuestId = new Map(
    progressRows.map((row) => [
      row.quest_id,
      row,
    ]),
  );

  const missions: AdventureMissionProgress[] =
    [];

  for (
    let index = 0;
    index < orderedQuests.length;
    index += 1
  ) {
    const quest = orderedQuests[index];
    const stored =
      progressByQuestId.get(quest.id);

    const previous =
      missions[index - 1];

    let status: MissionProgressStatus;

    if (stored?.status === "completed") {
      status = "completed";
    } else if (
      stored?.status === "in_progress"
    ) {
      status = "in_progress";
    } else if (index === 0) {
      status = "available";
    } else if (
      previous?.status === "completed"
    ) {
      status = "available";
    } else {
      status = "locked";
    }

    missions.push({
      questId: quest.id,
      questSlug: quest.slug,
      status,
      bestScore: Number(
        stored?.best_score ?? 0,
      ),
      bestScorePercentage: Number(
        stored?.best_score_percentage ?? 0,
      ),
      stars: stored?.stars ?? 0,
      timesStarted:
        stored?.times_started ?? 0,
      timesCompleted:
        stored?.times_completed ?? 0,
    });
  }

  const completedMissions =
    missions.filter(
      (mission) =>
        mission.status === "completed",
    ).length;

  const earnedStars = missions.reduce(
    (total, mission) =>
      total + mission.stars,
    0,
  );

  return {
    campaignSlug,
    totalMissions: missions.length,
    completedMissions,
    totalStars: missions.length * 3,
    earnedStars,
    missions,
  };
}

export function getMissionProgressBySlug(
  progress: AdventureCampaignProgress,
  questSlug: string,
): AdventureMissionProgress | null {
  return (
    progress.missions.find(
      (mission) =>
        mission.questSlug === questSlug,
    ) ?? null
  );
}
