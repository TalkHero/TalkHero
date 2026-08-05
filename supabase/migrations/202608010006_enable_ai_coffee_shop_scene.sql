-- =========================================================
-- TalkHero: перша AI-сцена в Coffee Shop Mission
--
-- Сцена drink-translate:
--   - залишається типом translate;
--   - приймає довільну природну англійську відповідь;
--   - оцінюється через AI Conversation Engine;
--   - переходи, повтори та бали контролює Quest Engine.
--
-- Міграція не видаляє сцени й не ламає активні quest_runs.
-- =========================================================

do $$
declare
  target_scene_id uuid;
begin
  select scene.id
  into target_scene_id
  from public.quest_scenes scene
  join public.quests quest
    on quest.id = scene.quest_id
  join public.quest_episodes episode
    on episode.id = quest.episode_id
  join public.quest_campaigns campaign
    on campaign.id = episode.campaign_id
  where campaign.slug = 'english-basics'
    and episode.slug = 'first-contact'
    and quest.slug = 'coffee-shop'
    and scene.scene_code = 'drink-translate';

  if target_scene_id is null then
    raise exception
      'Не знайдено сцену coffee-shop / drink-translate.';
  end if;

  update public.quest_scenes
  set
    speaker = 'Mia',

    content =
      'Я хотів би капучино, будь ласка.',

    prompt =
      'Скажіть або напишіть природне замовлення англійською.',

    expected_answer = '{
      "acceptedAnswers": [
        "I would like a cappuccino please",
        "I would like a cappuccino, please",
        "I''d like a cappuccino please",
        "I''d like a cappuccino, please",
        "Can I have a cappuccino please",
        "Can I have a cappuccino, please",
        "Could I have a cappuccino please",
        "Could I have a cappuccino, please",
        "A cappuccino please",
        "A cappuccino, please"
      ]
    }'::jsonb,

    evaluation_config = '{
      "mode": "ai",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2
    }'::jsonb,

    metadata =
      coalesce(metadata, '{}'::jsonb)
      || '{
        "role": "Barista",
        "avatar": "☕",
        "emotion": "happy",
        "goal": "Order a cappuccino politely",
        "cefrLevel": "A1",
        "aiConversation": true
      }'::jsonb,

    updated_at = now()

  where id = target_scene_id;
end $$;

-- Перевірка результату міграції.
do $$
declare
  configured_mode text;
begin
  select
    scene.evaluation_config ->> 'mode'
  into configured_mode
  from public.quest_scenes scene
  join public.quests quest
    on quest.id = scene.quest_id
  join public.quest_episodes episode
    on episode.id = quest.episode_id
  join public.quest_campaigns campaign
    on campaign.id = episode.campaign_id
  where campaign.slug = 'english-basics'
    and episode.slug = 'first-contact'
    and quest.slug = 'coffee-shop'
    and scene.scene_code = 'drink-translate';

  if configured_mode is distinct from 'ai' then
    raise exception
      'AI-режим для drink-translate не було застосовано.';
  end if;
end $$;
