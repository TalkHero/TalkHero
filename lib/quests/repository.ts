import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { QuestEngineError } from "./errors";

import type {
  PublicQuest,
  PublicQuestScene,
  QuestActRecord,
  QuestCampaignRecord,
  QuestEpisodeRecord,
  QuestRecord,
  QuestRunRecord,
  QuestSceneRecord,
} from "./types";

export type QuestStructure = {
  acts: QuestActRecord[];
  scenes: QuestSceneRecord[];
};

export function normalizeQuestSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function mapPublicQuest(quest: QuestRecord): PublicQuest {
  return {
    id: quest.id,
    episodeId: quest.episode_id,
    slug: quest.slug,
    title: quest.title,
    description: quest.description,
    questType: quest.quest_type,
    cefrLevel: quest.cefr_level,
    orderIndex: quest.order_index,
    estimatedMinutes: quest.estimated_minutes,
    xpReward: quest.xp_reward,
    coinReward: quest.coin_reward,
  };
}

export function mapPublicScene(scene: QuestSceneRecord): PublicQuestScene {
  return {
    id: scene.id,
    actId: scene.act_id,
    sceneCode: scene.scene_code,
    orderIndex: scene.order_index,
    sceneType: scene.scene_type,
    speaker: scene.speaker,
    content: scene.content,
    prompt: scene.prompt,
    options: Array.isArray(scene.options) ? scene.options : [],
    metadata: scene.metadata ?? {},
  };
}

export async function loadPublishedCampaigns(): Promise<QuestCampaignRecord[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_campaigns")
    .select(
      `
        id,
        slug,
        title,
        description,
        cover_image_url,
        cefr_level,
        status,
        order_index,
        metadata,
        created_at,
        updated_at
      `,
    )
    .eq("status", "published")
    .order("order_index", {
      ascending: true,
    });

  if (error) {
    console.error("Failed to load published quest campaigns:", error);

    throw new QuestEngineError(
      "CAMPAIGN_NOT_FOUND",
      "Failed to load published quest campaigns",
    );
  }

  return (data ?? []) as QuestCampaignRecord[];
}

export async function loadCampaign(
  campaignSlug: string,
): Promise<QuestCampaignRecord> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_campaigns")
    .select(
      `
      id,
      slug,
      title,
      description,
      cover_image_url,
      cefr_level,
      status,
      order_index,
      metadata,
      created_at,
      updated_at
    `,
    )
    .eq("slug", campaignSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to load quest campaign:", error);

    throw new QuestEngineError(
      "CAMPAIGN_NOT_FOUND",
      "Failed to load quest campaign",
      { campaignSlug },
    );
  }

  if (!data) {
    throw new QuestEngineError(
      "CAMPAIGN_NOT_FOUND",
      `Published quest campaign not found: ${campaignSlug}`,
      { campaignSlug },
    );
  }

  return data as QuestCampaignRecord;
}

export async function loadEpisode(
  campaignId: string,
  episodeSlug: string,
): Promise<QuestEpisodeRecord> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_episodes")
    .select(
      `
      id,
      campaign_id,
      slug,
      title,
      description,
      order_index,
      status,
      metadata,
      created_at,
      updated_at
    `,
    )
    .eq("campaign_id", campaignId)
    .eq("slug", episodeSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to load quest episode:", error);

    throw new QuestEngineError(
      "EPISODE_NOT_FOUND",
      "Failed to load quest episode",
      { campaignId, episodeSlug },
    );
  }

  if (!data) {
    throw new QuestEngineError(
      "EPISODE_NOT_FOUND",
      `Published quest episode not found: ${episodeSlug}`,
      { campaignId, episodeSlug },
    );
  }

  return data as QuestEpisodeRecord;
}

export async function loadQuest(
  episodeId: string,
  questSlug: string,
): Promise<QuestRecord> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quests")
    .select(
      `
      id,
      episode_id,
      slug,
      title,
      description,
      quest_type,
      cefr_level,
      order_index,
      estimated_minutes,
      xp_reward,
      coin_reward,
      status,
      config,
      metadata,
      created_at,
      updated_at
    `,
    )
    .eq("episode_id", episodeId)
    .eq("slug", questSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to load quest:", error);

    throw new QuestEngineError("QUEST_NOT_FOUND", "Failed to load quest", {
      episodeId,
      questSlug,
    });
  }

  if (!data) {
    throw new QuestEngineError(
      "QUEST_NOT_FOUND",
      `Published quest not found: ${questSlug}`,
      { episodeId, questSlug },
    );
  }

  return data as QuestRecord;
}

export async function loadQuestById(questId: string): Promise<QuestRecord> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quests")
    .select(
      `
      id,
      episode_id,
      slug,
      title,
      description,
      quest_type,
      cefr_level,
      order_index,
      estimated_minutes,
      xp_reward,
      coin_reward,
      status,
      config,
      metadata,
      created_at,
      updated_at
    `,
    )
    .eq("id", questId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load quest by ID:", error);

    throw new QuestEngineError("QUEST_NOT_FOUND", "Failed to load quest", {
      questId,
    });
  }

  if (!data) {
    throw new QuestEngineError("QUEST_NOT_FOUND", "Quest not found", {
      questId,
    });
  }

  return data as QuestRecord;
}

export async function loadQuestStructure(
  questId: string,
): Promise<QuestStructure> {
  const admin = createAdminClient();

  const { data: actData, error: actError } = await admin
    .from("quest_acts")
    .select(
      `
      id,
      quest_id,
      act_code,
      title,
      description,
      order_index,
      status,
      checkpoint,
      metadata,
      created_at,
      updated_at
    `,
    )
    .eq("quest_id", questId)
    .eq("status", "published")
    .order("order_index", { ascending: true });

  if (actError) {
    console.error("Failed to load quest acts:", actError);

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load quest acts",
      { questId },
    );
  }

  const acts = (actData ?? []) as QuestActRecord[];

  if (acts.length === 0) {
    throw new QuestEngineError(
      "QUEST_HAS_NO_SCENES",
      "Quest has no published acts",
      { questId },
    );
  }

  const actIds = acts.map((act) => act.id);

  const { data: sceneData, error: sceneError } = await admin
    .from("quest_scenes")
    .select(
      `
      id,
      quest_id,
      act_id,
      scene_code,
      order_index,
      scene_type,
      speaker,
      content,
      prompt,
      options,
      expected_answer,
      next_scene_code,
      branching,
      evaluation_config,
      metadata,
      created_at,
      updated_at
    `,
    )
    .eq("quest_id", questId)
    .in("act_id", actIds);

  if (sceneError) {
    console.error("Failed to load quest scenes:", sceneError);

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load quest scenes",
      { questId },
    );
  }

  const scenes = (sceneData ?? []) as QuestSceneRecord[];

  if (scenes.length === 0) {
    throw new QuestEngineError(
      "QUEST_HAS_NO_SCENES",
      "Quest has no published scenes",
      { questId },
    );
  }

  const actOrder = new Map(acts.map((act) => [act.id, act.order_index]));

  scenes.sort((left, right) => {
    const leftActOrder = actOrder.get(left.act_id) ?? 0;
    const rightActOrder = actOrder.get(right.act_id) ?? 0;

    if (leftActOrder !== rightActOrder) {
      return leftActOrder - rightActOrder;
    }

    return left.order_index - right.order_index;
  });

  return { acts, scenes };
}

export async function loadQuestRun(
  runId: string,
  userId?: string,
): Promise<QuestRunRecord> {
  const admin = createAdminClient();

  let query = admin
    .from("quest_runs")
    .select(
      `
      id,
      user_id,
      quest_id,
      status,
      current_scene_id,
      current_scene_code,
      completed_scene_count,
      score,
      max_score,
      xp_earned,
      coins_earned,
      state,
      started_at,
      completed_at,
      updated_at
    `,
    )
    .eq("id", runId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Failed to load quest run:", error);

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load quest run",
      { runId, userId },
    );
  }

  if (!data) {
    throw new QuestEngineError("QUEST_RUN_LOAD_FAILED", "Quest run not found", {
      runId,
      userId,
    });
  }

  return data as QuestRunRecord;
}

export async function loadActiveRun(
  userId: string,
  questId: string,
): Promise<QuestRunRecord | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quest_runs")
    .select(
      `
      id,
      user_id,
      quest_id,
      status,
      current_scene_id,
      current_scene_code,
      completed_scene_count,
      score,
      max_score,
      xp_earned,
      coins_earned,
      state,
      started_at,
      completed_at,
      updated_at
    `,
    )
    .eq("user_id", userId)
    .eq("quest_id", questId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (error) {
    console.error("Failed to load active quest run:", error);

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load active quest run",
      { userId, questId },
    );
  }

  return data ? (data as QuestRunRecord) : null;
}

export function findCurrentScene(
  run: QuestRunRecord,
  scenes: QuestSceneRecord[],
): QuestSceneRecord {
  if (!run.current_scene_id || !run.current_scene_code) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "Quest run has no current scene",
      {
        runId: run.id,
        questId: run.quest_id,
      },
    );
  }

  const currentScene = scenes.find(
    (scene) => scene.id === run.current_scene_id,
  );

  if (!currentScene) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "Current quest scene is unavailable",
      {
        runId: run.id,
        questId: run.quest_id,
        currentSceneId: run.current_scene_id,
        currentSceneCode: run.current_scene_code,
      },
    );
  }

  return currentScene;
}
