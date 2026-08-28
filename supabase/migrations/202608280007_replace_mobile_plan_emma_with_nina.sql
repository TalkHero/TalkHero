-- =========================================================
-- TalkHero
-- London Life / Getting a Mobile Plan
-- Replace Emma with Nina
-- =========================================================

update public.quest_scenes as scene
set
  speaker = 'Nina',
  metadata = jsonb_set(
    coalesce(scene.metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-getting-a-mobile-plan-nina"'::jsonb,
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
  and quest.slug = 'getting-a-mobile-plan'
  and scene.speaker is not null
  and lower(trim(scene.speaker)) = 'emma';