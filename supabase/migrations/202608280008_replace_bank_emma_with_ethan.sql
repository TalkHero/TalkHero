-- =========================================================
-- TalkHero
-- London Life / Opening a Bank Account
-- Replace Emma with Ethan
-- =========================================================

update public.quest_scenes as scene
set
  speaker = 'Ethan',
  metadata = jsonb_set(
    coalesce(scene.metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-opening-a-bank-account-ethan"'::jsonb,
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
  and quest.slug = 'opening-a-bank-account'
  and scene.speaker is not null
  and lower(trim(scene.speaker)) = 'emma';