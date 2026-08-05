-- =========================================================
-- TalkHero demo quest for the first end-to-end smoke test
-- Route: /quests/english-basics/first-contact/coffee-shop
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  insert into public.quest_campaigns (
    slug, title, description, cefr_level, status, order_index, metadata
  ) values (
    'english-basics',
    'English Basics',
    'Short interactive quests for everyday English.',
    'A1',
    'published',
    0,
    '{"demo": true}'::jsonb
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    cefr_level = excluded.cefr_level,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into campaign_uuid;

  insert into public.quest_episodes (
    campaign_id, slug, title, description, order_index, status, metadata
  ) values (
    campaign_uuid,
    'first-contact',
    'First Contact',
    'Practice a simple conversation in a coffee shop.',
    0,
    'published',
    '{"demo": true}'::jsonb
  )
  on conflict (campaign_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into episode_uuid;

  insert into public.quests (
    episode_id, slug, title, description, quest_type, cefr_level,
    order_index, estimated_minutes, xp_reward, coin_reward,
    status, config, metadata
  ) values (
    episode_uuid,
    'coffee-shop',
    'Coffee Shop Mission',
    'Greet the barista and order a drink in English.',
    'conversation',
    'A1',
    0,
    3,
    25,
    10,
    'published',
    '{"version": 1}'::jsonb,
    '{"demo": true}'::jsonb
  )
  on conflict (episode_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    quest_type = excluded.quest_type,
    cefr_level = excluded.cefr_level,
    estimated_minutes = excluded.estimated_minutes,
    xp_reward = excluded.xp_reward,
    coin_reward = excluded.coin_reward,
    status = excluded.status,
    config = excluded.config,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into quest_uuid;

  insert into public.quest_acts (
    quest_id, act_code, title, description, order_index, status, checkpoint, metadata
  ) values (
    quest_uuid,
    'main',
    'At the counter',
    'A short conversation with a barista.',
    0,
    'published',
    false,
    '{"demo": true}'::jsonb
  )
  on conflict (quest_id, act_code) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into act_uuid;

  delete from public.quest_scenes where quest_id = quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type, speaker,
    content, prompt, options, expected_answer, next_scene_code,
    branching, evaluation_config, metadata
  ) values
  (
    quest_uuid, act_uuid, 'welcome', 0, 'dialogue', 'Mia',
    'Hi! Welcome to TalkHero Coffee. Let us practice a short order.',
    null, '[]'::jsonb, null, 'greeting-choice', '{}'::jsonb, '{}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'greeting-choice', 1, 'choice', 'Mia',
    'Choose the best greeting.',
    'What do you say first?',
    '[{"id":"hello","text":"Hello!","value":"hello"},{"id":"bye","text":"Goodbye!","value":"bye"},{"id":"sleep","text":"Good night!","value":"sleep"}]'::jsonb,
    '{"optionId":"hello"}'::jsonb,
    'order-input',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Great greeting!","feedbackIncorrect":"Try a greeting you would use when meeting someone."}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'order-input', 2, 'input', 'Mia',
    'Use a polite sentence with “coffee”.',
    'Order a coffee in English.',
    '[]'::jsonb,
    '{"acceptedAnswers":["I would like a coffee","I''d like a coffee","Can I have a coffee","A coffee, please"]}'::jsonb,
    'success',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":20,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Perfect — polite and clear!","feedbackIncorrect":"Try: I would like a coffee."}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'success', 3, 'dialogue', 'Mia',
    'Excellent! Your coffee is ready. You completed your first TalkHero conversation.',
    null, '[]'::jsonb, null, null, '{}'::jsonb, '{}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  );
end $$;
