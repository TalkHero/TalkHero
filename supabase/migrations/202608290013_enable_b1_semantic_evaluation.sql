-- Enable semantic AI evaluation for free-input scenes
-- in the London Independence B1 campaign.
--
-- Choice and passive scenes remain unchanged.
-- Existing acceptedAnswers are preserved and become
-- reference examples for the AI evaluator.

update quest_scenes as s
set evaluation_config =
  jsonb_set(
    coalesce(s.evaluation_config, '{}'::jsonb),
    '{mode}',
    '"ai"'::jsonb,
    true
  )
from quests as q
join quest_episodes as e
  on e.id = q.episode_id
join quest_campaigns as c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.cefr_level = 'B1'
  and s.scene_type = 'input';
