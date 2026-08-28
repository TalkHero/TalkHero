-- =========================================================
-- TalkHero
-- Stable NPC identities for all London Life dialogue scenes
-- =========================================================

update public.quest_scenes as scene
set
  metadata = jsonb_set(
    coalesce(scene.metadata, '{}'::jsonb),
    '{npcId}',
    to_jsonb(
      'london-life-' ||
      quest.slug ||
      '-' ||
      lower(
        regexp_replace(
          trim(scene.speaker),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        )
      )
    ),
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
  and scene.speaker is not null
  and trim(scene.speaker) <> '';