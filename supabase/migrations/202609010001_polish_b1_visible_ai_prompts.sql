-- Remove visible reference answers from B1 AI input prompts.
-- Reference answers remain in expected_answer for semantic AI evaluation.

update public.quest_scenes as s
set prompt = 'Розкажіть про свій професійний досвід у 2–3 реченнях.'
from public.quests as q
join public.quest_episodes as e
  on e.id = q.episode_id
join public.quest_campaigns as c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'job-interview'
  and s.scene_code = 'background-answer';

update public.quest_scenes as s
set prompt = 'Розкажіть про один зі своїх основних обов’язків на попередній роботі. Дайте повну відповідь у 1–2 реченнях.'
from public.quests as q
join public.quest_episodes as e
  on e.id = q.episode_id
join public.quest_campaigns as c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'job-interview'
  and s.scene_code = 'responsibility-answer';