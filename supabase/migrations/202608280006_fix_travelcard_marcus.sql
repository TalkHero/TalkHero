-- =========================================================
-- TalkHero
-- London Life / Buying a Travelcard
-- Force stable Marcus identity for all Marcus/Oliver scenes
-- =========================================================

update public.quest_scenes as scene
set
  speaker = 'Marcus',
  metadata = jsonb_set(
    coalesce(scene.metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-buying-a-travelcard-marcus"'::jsonb,
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
  and quest.slug = 'buying-a-travelcard'
  and scene.speaker is not null
  and lower(trim(scene.speaker)) = 'oliver';