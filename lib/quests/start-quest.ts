import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { QuestEngineError } from "./errors";
import { recordQuestEvent } from "./run-events";

import type {
  PublicQuest,
  PublicQuestScene,
  QuestActRecord,
  QuestCampaignRecord,
  QuestEpisodeRecord,
  QuestProgress,
  QuestRecord,
  QuestRunRecord,
  QuestSceneRecord,
  StartedQuest,
} from "./types";

export type StartQuestInput = {
  userId: string;
  campaignSlug: string;
  episodeSlug: string;
  questSlug: string;
};

type QuestRunInsert = {
  user_id: string;
  quest_id: string;
  status: "in_progress";
  current_scene_id: string;
  current_scene_code: string;
  completed_scene_count: number;
  score: number;
  max_score: number;
  xp_earned: number;
  coins_earned: number;
  state: Record<string, unknown>;
  completed_at: null;
};

type QuestStructure = {
  acts: QuestActRecord[];
  scenes: QuestSceneRecord[];
};

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function mapPublicQuest(
  quest: QuestRecord,
): PublicQuest {
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

function mapPublicScene(
  scene: QuestSceneRecord,
): PublicQuestScene {
  return {
    id: scene.id,
    actId: scene.act_id,
    sceneCode: scene.scene_code,
    orderIndex: scene.order_index,
    sceneType: scene.scene_type,
    speaker: scene.speaker,
    content: scene.content,
    prompt: scene.prompt,
    options: Array.isArray(scene.options)
      ? scene.options
      : [],
    metadata: scene.metadata ?? {},
  };
}

function getScenePoints(
  scene: QuestSceneRecord,
): number {
  const points =
    scene.evaluation_config?.points;

  if (
    typeof points !== "number" ||
    !Number.isFinite(points) ||
    points < 0
  ) {
    return 0;
  }

  return points;
}

function calculateMaxScore(
  scenes: QuestSceneRecord[],
): number {
  return scenes.reduce(
    (total, scene) =>
      total + getScenePoints(scene),
    0,
  );
}

function buildProgress(
  run: QuestRunRecord,
  totalScenes: number,
): QuestProgress {
  return {
    current: Math.min(
      run.completed_scene_count + 1,
      totalScenes,
    ),
    total: totalScenes,
    completed: run.completed_scene_count,
  };
}

async function loadCampaign(
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
    console.error(
      "Failed to load quest campaign:",
      error,
    );

    throw new QuestEngineError(
      "CAMPAIGN_NOT_FOUND",
      "Failed to load quest campaign",
      {
        campaignSlug,
      },
    );
  }

  if (!data) {
    throw new QuestEngineError(
      "CAMPAIGN_NOT_FOUND",
      `Published quest campaign not found: ${campaignSlug}`,
      {
        campaignSlug,
      },
    );
  }

  return data as QuestCampaignRecord;
}

async function loadEpisode(
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
    console.error(
      "Failed to load quest episode:",
      error,
    );

    throw new QuestEngineError(
      "EPISODE_NOT_FOUND",
      "Failed to load quest episode",
      {
        campaignId,
        episodeSlug,
      },
    );
  }

  if (!data) {
    throw new QuestEngineError(
      "EPISODE_NOT_FOUND",
      `Published quest episode not found: ${episodeSlug}`,
      {
        campaignId,
        episodeSlug,
      },
    );
  }

  return data as QuestEpisodeRecord;
}

async function loadQuest(
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
    console.error(
      "Failed to load quest:",
      error,
    );

    throw new QuestEngineError(
      "QUEST_NOT_FOUND",
      "Failed to load quest",
      {
        episodeId,
        questSlug,
      },
    );
  }

  if (!data) {
    throw new QuestEngineError(
      "QUEST_NOT_FOUND",
      `Published quest not found: ${questSlug}`,
      {
        episodeId,
        questSlug,
      },
    );
  }

  return data as QuestRecord;
}

async function loadQuestStructure(
  questId: string,
): Promise<QuestStructure> {
  const admin = createAdminClient();

  const { data: actData, error: actError } =
    await admin
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
      .order("order_index", {
        ascending: true,
      });

  if (actError) {
    console.error(
      "Failed to load quest acts:",
      actError,
    );

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load quest acts",
      {
        questId,
      },
    );
  }

  const acts =
    (actData ?? []) as QuestActRecord[];

  if (acts.length === 0) {
    throw new QuestEngineError(
      "QUEST_HAS_NO_SCENES",
      "Quest has no published acts",
      {
        questId,
      },
    );
  }

  const actIds = acts.map((act) => act.id);

  const { data: sceneData, error: sceneError } =
    await admin
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
    console.error(
      "Failed to load quest scenes:",
      sceneError,
    );

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load quest scenes",
      {
        questId,
      },
    );
  }

  const scenes =
    (sceneData ?? []) as QuestSceneRecord[];

  if (scenes.length === 0) {
    throw new QuestEngineError(
      "QUEST_HAS_NO_SCENES",
      "Quest has no published scenes",
      {
        questId,
      },
    );
  }

  const actOrder = new Map(
    acts.map((act) => [
      act.id,
      act.order_index,
    ]),
  );

  scenes.sort((left, right) => {
    const leftActOrder =
      actOrder.get(left.act_id) ?? 0;

    const rightActOrder =
      actOrder.get(right.act_id) ?? 0;

    if (leftActOrder !== rightActOrder) {
      return leftActOrder - rightActOrder;
    }

    return left.order_index - right.order_index;
  });

  return {
    acts,
    scenes,
  };
}

async function loadActiveRun(
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
    console.error(
      "Failed to load active quest run:",
      error,
    );

    throw new QuestEngineError(
      "QUEST_RUN_LOAD_FAILED",
      "Failed to load active quest run",
      {
        userId,
        questId,
      },
    );
  }

  return data
    ? (data as QuestRunRecord)
    : null;
}

async function resumeQuestRun({
  quest,
  run,
  scenes,
}: {
  quest: QuestRecord;
  run: QuestRunRecord;
  scenes: QuestSceneRecord[];
}): Promise<StartedQuest> {
  if (
    !run.current_scene_id ||
    !run.current_scene_code
  ) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "Active quest run has no current scene",
      {
        runId: run.id,
        questId: quest.id,
      },
    );
  }

  const currentScene = scenes.find(
    (scene) =>
      scene.id === run.current_scene_id,
  );

  if (!currentScene) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "Current quest scene is unavailable",
      {
        runId: run.id,
        questId: quest.id,
        currentSceneId:
          run.current_scene_id,
        currentSceneCode:
          run.current_scene_code,
      },
    );
  }

  await recordQuestEvent({
    runId: run.id,
    scene: currentScene,
    eventType: "scene_presented",
    metadata: {
      resumed: true,
      actId: currentScene.act_id,
      orderIndex:
        currentScene.order_index,
    },
  });

  return {
    runId: run.id,
    resumed: true,
    quest: mapPublicQuest(quest),
    progress: buildProgress(
      run,
      scenes.length,
    ),
    scene: mapPublicScene(currentScene),
  };
}

async function removeFailedRun(
  runId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("quest_runs")
    .delete()
    .eq("id", runId);

  if (error) {
    console.error(
      "Failed to clean up quest run:",
      error,
    );
  }
}

export async function startQuest({
  userId,
  campaignSlug,
  episodeSlug,
  questSlug,
}: StartQuestInput): Promise<StartedQuest> {
  const normalizedCampaignSlug =
    normalizeSlug(campaignSlug);

  const normalizedEpisodeSlug =
    normalizeSlug(episodeSlug);

  const normalizedQuestSlug =
    normalizeSlug(questSlug);

  if (!userId.trim()) {
    throw new QuestEngineError(
      "QUEST_RUN_CREATE_FAILED",
      "User ID is required",
    );
  }

  if (!normalizedCampaignSlug) {
    throw new QuestEngineError(
      "CAMPAIGN_NOT_FOUND",
      "Campaign slug is required",
    );
  }

  if (!normalizedEpisodeSlug) {
    throw new QuestEngineError(
      "EPISODE_NOT_FOUND",
      "Episode slug is required",
    );
  }

  if (!normalizedQuestSlug) {
    throw new QuestEngineError(
      "QUEST_NOT_FOUND",
      "Quest slug is required",
    );
  }

  const campaign = await loadCampaign(
    normalizedCampaignSlug,
  );

  const episode = await loadEpisode(
    campaign.id,
    normalizedEpisodeSlug,
  );

  const quest = await loadQuest(
    episode.id,
    normalizedQuestSlug,
  );

  const { acts, scenes } =
    await loadQuestStructure(quest.id);

  const activeRun = await loadActiveRun(
    userId,
    quest.id,
  );

  if (activeRun) {
    return resumeQuestRun({
      quest,
      run: activeRun,
      scenes,
    });
  }

  const firstScene = scenes[0];

  if (!firstScene) {
    throw new QuestEngineError(
      "QUEST_HAS_NO_SCENES",
      "Quest has no available scenes",
      {
        questId: quest.id,
      },
    );
  }

  const firstAct = acts.find(
    (act) => act.id === firstScene.act_id,
  );

  if (!firstAct) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "First quest scene has no valid act",
      {
        questId: quest.id,
        sceneId: firstScene.id,
        actId: firstScene.act_id,
      },
    );
  }

  const admin = createAdminClient();

  const runInsert: QuestRunInsert = {
    user_id: userId,
    quest_id: quest.id,
    status: "in_progress",
    current_scene_id: firstScene.id,
    current_scene_code:
      firstScene.scene_code,
    completed_scene_count: 0,
    score: 0,
    max_score:
      calculateMaxScore(scenes),
    xp_earned: 0,
    coins_earned: 0,
    state: {
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      episodeId: episode.id,
      episodeSlug: episode.slug,
      currentActId: firstAct.id,
      currentActCode:
        firstAct.act_code,
      sceneCount: scenes.length,
    },
    completed_at: null,
  };

  const { data: runData, error: runError } =
    await admin
      .from("quest_runs")
      .insert(runInsert)
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
      .single();

  if (runError || !runData) {
    /*
     * A parallel request may have created the active run
     * after the first active-run lookup.
     */
    if (runError?.code === "23505") {
      const concurrentRun =
        await loadActiveRun(
          userId,
          quest.id,
        );

      if (concurrentRun) {
        return resumeQuestRun({
          quest,
          run: concurrentRun,
          scenes,
        });
      }
    }

    console.error(
      "Failed to create quest run:",
      runError,
    );

    throw new QuestEngineError(
      "QUEST_RUN_CREATE_FAILED",
      "Failed to create quest run",
      {
        userId,
        questId: quest.id,
      },
    );
  }

  const run = runData as QuestRunRecord;

  try {
    await recordQuestEvent({
      runId: run.id,
      scene: firstScene,
      eventType: "scene_presented",
      metadata: {
        resumed: false,
        actId: firstScene.act_id,
        orderIndex:
          firstScene.order_index,
      },
    });
  } catch (error) {
    await removeFailedRun(run.id);
    throw error;
  }

  return {
    runId: run.id,
    resumed: false,
    quest: mapPublicQuest(quest),
    progress: {
      current: 1,
      total: scenes.length,
      completed: 0,
    },
    scene: mapPublicScene(firstScene),
  };
}
