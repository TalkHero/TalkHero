-- =========================================================
-- TalkHero
-- Add stable NPC identity for London Life / Meeting a Neighbor
-- =========================================================

update public.quest_scenes as scene
set
  metadata = jsonb_set(
    coalesce(scene.metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-neighbor-daniel"'::jsonb,
    true
  ),
  updated_at = now()
from public.quests as quest
join public.quest_episodes as episode
  on episode.id = quest.episode_id
join public.quest_campaigns as campaign
  on campaign.id = episode.campaign_id
where scene.quest_id = quest.id
  and campaign.slug = 'london-life'
  and episode.slug = 'everyday-life'
  and quest.slug = 'meeting-a-neighbor'
  and scene.scene_code = 'neighbor-greeting'
  and scene.speaker = 'Daniel';