-- =========================================================
-- TalkHero London Life
-- Mission #12: Buying a Travelcard
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
    'buying-a-travelcard',
    'Buying a Travelcard',
    'Оберіть квиток для громадського транспорту, уточніть зони, термін дії та спосіб оплати.',
    'conversation',
    'A2',
    11,
    11,
    135,
    55,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Квиток на громадський транспорт",
        "objectives": [
          "пояснити, який квиток вам потрібен",
          "уточнити транспортні зони",
          "запитати про термін дії квитка",
          "дізнатися вартість",
          "оплатити та уточнити, як користуватися квитком"
        ]
      },
      "location": "underground-station"
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
    'At the Underground Station',
    'Поговоріть із працівником станції та придбайте відповідний проїзний.',
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
    'Ви плануєте багато їздити Лондоном цього тижня й вирішуєте придбати проїзний.',
    null,
    '[]'::jsonb,
    null,
    'staff-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🚇",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'staff-greeting',
    1,
    'dialogue',
    'Oliver',
    'Hello. How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'request-ticket',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'request-ticket',
    2,
    'choice',
    'Oliver',
    'Explain that you need a travelcard for one week.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "travelcard",
        "text": "I''d like a travelcard for one week, please.",
        "value": "travelcard"
      },
      {
        "id": "medicine",
        "text": "I''d like some medicine, please.",
        "value": "medicine"
      },
      {
        "id": "laundry",
        "text": "I''d like to use a washing machine.",
        "value": "laundry"
      }
    ]'::jsonb,
    '{
      "optionId": "travelcard"
    }'::jsonb,
    'zones-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко пояснили, який квиток вам потрібен.",
      "feedbackIncorrect": "Оберіть фразу про travelcard на один тиждень."
    }'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'zones-question',
    3,
    'dialogue',
    'Oliver',
    'Certainly. Which zones will you be travelling in?',
    null,
    '[]'::jsonb,
    null,
    'zones-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'zones-answer',
    4,
    'input',
    'Oliver',
    'Say that you mainly need zones one and two.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I mainly need zones one and two.",
        "I need zones one and two.",
        "Mostly zones one and two.",
        "I will mainly travel in zones one and two."
      ]
    }'::jsonb,
    'validity-info',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно назвали потрібні зони.",
      "feedbackIncorrect": "Спробуйте: I mainly need zones one and two."
    }'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'validity-info',
    5,
    'dialogue',
    'Oliver',
    'A seven-day travelcard for zones one and two would be suitable.',
    null,
    '[]'::jsonb,
    null,
    'validity-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'validity-question',
    6,
    'translate',
    null,
    'Коли починає діяти проїзний?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "When does the travelcard start?",
        "When does the travelcard become valid?",
        "When will the travelcard become valid?",
        "When does it start?"
      ]
    }'::jsonb,
    'validity-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви запитали про початок дії проїзного.",
      "feedbackIncorrect": "Спробуйте: When does the travelcard become valid?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'validity-answer',
    7,
    'dialogue',
    'Oliver',
    'You can choose the start date. It will then be valid for seven consecutive days.',
    null,
    '[]'::jsonb,
    null,
    'price-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-question',
    8,
    'input',
    'Oliver',
    'Ask how much the travelcard costs.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How much does the travelcard cost?",
        "How much is the travelcard?",
        "What does the travelcard cost?",
        "How much will it cost?"
      ]
    }'::jsonb,
    'price-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Ви правильно запитали про ціну.",
      "feedbackIncorrect": "Спробуйте: How much does the travelcard cost?"
    }'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-answer',
    9,
    'dialogue',
    'Oliver',
    'It''s forty-two pounds and seventy pence for seven days.',
    null,
    '[]'::jsonb,
    null,
    'payment-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'payment-choice',
    10,
    'choice',
    'Oliver',
    'Say that you would like to pay by card.',
    'Оберіть відповідь.',
    '[
      {
        "id": "card",
        "text": "I''d like to pay by card, please.",
        "value": "card"
      },
      {
        "id": "doctor",
        "text": "I''d like to see a doctor, please.",
        "value": "doctor"
      },
      {
        "id": "repair",
        "text": "I''d like to arrange a repair.",
        "value": "repair"
      }
    ]'::jsonb,
    '{
      "optionId": "card"
    }'::jsonb,
    'usage-info',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви обрали оплату карткою.",
      "feedbackIncorrect": "Оберіть відповідь про оплату карткою."
    }'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'usage-info',
    11,
    'dialogue',
    'Oliver',
    'Done. Remember to touch in at the start of your journey and touch out at the end.',
    null,
    '[]'::jsonb,
    null,
    'usage-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'usage-question',
    12,
    'input',
    'Oliver',
    'Ask whether you need to touch out after every journey.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Do I need to touch out after every journey?",
        "Do I have to touch out after every journey?",
        "Should I touch out after every journey?",
        "Do I need to touch out at the end of every journey?"
      ]
    }'::jsonb,
    'usage-confirmation',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно уточнили правило користування.",
      "feedbackIncorrect": "Спробуйте: Do I need to touch out after every journey?"
    }'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'usage-confirmation',
    13,
    'dialogue',
    'Oliver',
    'Yes, always touch in and touch out so the system records your journey correctly.',
    null,
    '[]'::jsonb,
    null,
    'final-thanks',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-thanks',
    14,
    'choice',
    'Oliver',
    'Thank the assistant and finish the conversation.',
    'Оберіть відповідь.',
    '[
      {
        "id": "thanks",
        "text": "Great, thank you for explaining everything.",
        "value": "thanks"
      },
      {
        "id": "parcel",
        "text": "Can I send a parcel from here?",
        "value": "parcel"
      },
      {
        "id": "laundry",
        "text": "Where is the washing machine?",
        "value": "laundry"
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
      "feedbackIncorrect": "Оберіть фразу, яка дякує працівнику за пояснення."
    }'::jsonb,
    '{
      "role": "Station Assistant",
      "avatar": "🚇"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви успішно обрали та придбали проїзний і дізналися, як ним користуватися.',
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
        "travelcard",
        "zone",
        "valid",
        "start date",
        "journey",
        "touch in",
        "touch out"
      ]
    }'::jsonb
  );

end $$;