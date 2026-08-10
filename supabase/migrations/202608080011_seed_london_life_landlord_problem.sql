-- =========================================================
-- TalkHero London Life
-- Mission #10: Reporting a Problem to the Landlord
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  select id
  into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-life'
    and status = 'published';

  if campaign_uuid is null then
    raise exception 'Campaign not found: london-life';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'everyday-life'
    and status = 'published';

  if episode_uuid is null then
    raise exception 'Episode not found: everyday-life';
  end if;

  insert into public.quests (
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
    metadata
  ) values (
    episode_uuid,
    'reporting-a-problem',
    'Reporting a Problem to the Landlord',
    'Повідомте орендодавцю про проблему у квартирі, поясніть несправність та домовтеся про ремонт.',
    'conversation',
    'A2',
    9,
    11,
    125,
    50,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Проблема у квартирі",
        "objectives": [
          "повідомити про несправність",
          "описати проблему",
          "пояснити, коли вона почалася",
          "уточнити, коли прийде майстер",
          "домовитися про зручний час ремонту"
        ]
      },
      "location": "flat"
    }'::jsonb
  )
  on conflict (episode_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    quest_type = excluded.quest_type,
    cefr_level = excluded.cefr_level,
    order_index = excluded.order_index,
    estimated_minutes = excluded.estimated_minutes,
    xp_reward = excluded.xp_reward,
    coin_reward = excluded.coin_reward,
    status = excluded.status,
    config = excluded.config,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into quest_uuid;

  insert into public.quest_acts (
    quest_id,
    act_code,
    title,
    description,
    order_index,
    status,
    checkpoint,
    metadata
  ) values (
    quest_uuid,
    'main',
    'Calling the Landlord',
    'Зателефонуйте орендодавцю та домовтеся про ремонт у квартирі.',
    0,
    'published',
    false,
    '{"adventure":true}'::jsonb
  )
  on conflict (quest_id, act_code) do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    checkpoint = excluded.checkpoint,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into act_uuid;

  delete from public.quest_scenes
  where quest_id = quest_uuid;

  insert into public.quest_scenes (
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
    metadata
  ) values

  (
    quest_uuid,
    act_uuid,
    'intro',
    0,
    'narration',
    null,
    'У вашій квартирі перестало працювати опалення. Ви телефонуєте орендодавцю, щоб повідомити про проблему.',
    null,
    '[]'::jsonb,
    null,
    'landlord-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🏠",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'landlord-greeting',
    1,
    'dialogue',
    'Daniel',
    'Hello, Daniel speaking. How can I help?',
    null,
    '[]'::jsonb,
    null,
    'report-problem',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'report-problem',
    2,
    'choice',
    'Daniel',
    'Explain why you are calling.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "heating",
        "text": "I''m calling because the heating in my flat isn''t working.",
        "value": "heating"
      },
      {
        "id": "bank",
        "text": "I''d like to open a bank account.",
        "value": "bank"
      },
      {
        "id": "parcel",
        "text": "I need to send a parcel.",
        "value": "parcel"
      }
    ]'::jsonb,
    '{
      "optionId": "heating"
    }'::jsonb,
    'details-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко повідомили про проблему.",
      "feedbackIncorrect": "Оберіть фразу про несправне опалення."
    }'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'details-question',
    3,
    'dialogue',
    'Daniel',
    'I''m sorry to hear that. What exactly is happening?',
    null,
    '[]'::jsonb,
    null,
    'describe-problem',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'describe-problem',
    4,
    'input',
    'Daniel',
    'Say that the radiators are cold and the flat is very cold.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "The radiators are cold and the flat is very cold.",
        "The radiators are cold and my flat is very cold.",
        "The radiators are not warm and the flat is very cold."
      ]
    }'::jsonb,
    'when-started',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви добре описали проблему.",
      "feedbackIncorrect": "Спробуйте: The radiators are cold and the flat is very cold."
    }'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'when-started',
    5,
    'dialogue',
    'Daniel',
    'When did the problem start?',
    null,
    '[]'::jsonb,
    null,
    'when-started-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'when-started-input',
    6,
    'input',
    'Daniel',
    'Say that it stopped working last night.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "It stopped working last night.",
        "The heating stopped working last night.",
        "It stopped working yesterday evening."
      ]
    }'::jsonb,
    'boiler-check',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви пояснили, коли почалася проблема.",
      "feedbackIncorrect": "Спробуйте: It stopped working last night."
    }'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'boiler-check',
    7,
    'dialogue',
    'Daniel',
    'Have you checked whether the boiler is showing an error message?',
    null,
    '[]'::jsonb,
    null,
    'boiler-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'boiler-answer',
    8,
    'choice',
    'Daniel',
    'Say that the boiler shows an error message.',
    'Оберіть відповідь.',
    '[
      {
        "id": "error",
        "text": "Yes, the boiler is showing an error message.",
        "value": "error"
      },
      {
        "id": "fine",
        "text": "No, everything is working perfectly.",
        "value": "fine"
      },
      {
        "id": "parcel",
        "text": "Yes, I need tracked delivery.",
        "value": "parcel"
      }
    ]'::jsonb,
    '{
      "optionId": "error"
    }'::jsonb,
    'repair-info',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви повідомили про повідомлення про помилку.",
      "feedbackIncorrect": "Оберіть відповідь про error message."
    }'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'repair-info',
    9,
    'dialogue',
    'Daniel',
    'I''ll arrange for an engineer to come and look at it.',
    null,
    '[]'::jsonb,
    null,
    'repair-time-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'repair-time-question',
    10,
    'translate',
    null,
    'Коли зможе прийти майстер?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "When can the engineer come?",
        "When will the engineer be able to come?",
        "When can someone come to fix it?"
      ]
    }'::jsonb,
    'repair-slot',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Ви правильно запитали про час ремонту.",
      "feedbackIncorrect": "Спробуйте: When can the engineer come?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🏠"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'repair-slot',
    11,
    'dialogue',
    'Daniel',
    'The engineer can come tomorrow between 2 and 4 p.m. Will you be at home?',
    null,
    '[]'::jsonb,
    null,
    'confirm-slot',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'confirm-slot',
    12,
    'input',
    'Daniel',
    'Confirm that you will be at home between 2 and 4 p.m.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Yes, I''ll be at home between 2 and 4 p.m.",
        "Yes, I will be at home between 2 and 4 p.m.",
        "Yes, I''ll be home between 2 and 4."
      ]
    }'::jsonb,
    'access-info',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Час ремонту підтверджено.",
      "feedbackIncorrect": "Спробуйте: Yes, I''ll be at home between 2 and 4 p.m."
    }'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'access-info',
    13,
    'dialogue',
    'Daniel',
    'Perfect. The engineer will call you before arriving.',
    null,
    '[]'::jsonb,
    null,
    'final-thanks',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-thanks',
    14,
    'choice',
    'Daniel',
    'Thank the landlord and finish the call.',
    'Оберіть відповідь.',
    '[
      {
        "id": "thanks",
        "text": "Thank you for arranging the repair.",
        "value": "thanks"
      },
      {
        "id": "bank",
        "text": "I''d like to open an account.",
        "value": "bank"
      },
      {
        "id": "food",
        "text": "Can I order some food?",
        "value": "food"
      }
    ]'::jsonb,
    '{
      "optionId": "thanks"
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви ввічливо завершили розмову.",
      "feedbackIncorrect": "Оберіть відповідь, яка дякує за організацію ремонту."
    }'::jsonb,
    '{
      "role": "Landlord",
      "avatar": "🔑"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви повідомили про проблему з опаленням і домовилися про візит майстра.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🎉",
      "emotion": "celebrating",
      "learnedWords": [
        "landlord",
        "heating",
        "radiator",
        "boiler",
        "error message",
        "engineer",
        "repair"
      ]
    }'::jsonb
  );

end $$;