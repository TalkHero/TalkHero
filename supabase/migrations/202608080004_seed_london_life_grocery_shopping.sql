-- =========================================================
-- TalkHero London Life
-- Mission #3: Grocery Shopping
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
    'grocery-shopping',
    'Grocery Shopping',
    'Знайдіть потрібні продукти, уточніть ціну та кількість і розрахуйтеся на касі.',
    'conversation',
    'A2',
    2,
    10,
    90,
    35,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Покупки в супермаркеті",
        "objectives": [
          "запитати, де знаходиться потрібний товар",
          "уточнити ціну",
          "попросити потрібну кількість",
          "відповісти на запитання касира",
          "ввічливо завершити покупку"
        ]
      },
      "location": "supermarket"
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
    'At the Supermarket',
    'Зробіть покупки та поспілкуйтеся з працівником і касиром.',
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
    'Ви зайшли до супермаркету неподалік від дому. Вам потрібно купити молоко, яблука та хліб.',
    null,
    '[]'::jsonb,
    null,
    'find-milk',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🛒",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'find-milk',
    1,
    'dialogue',
    'Alex',
    'Hi there. Can I help you find something?',
    null,
    '[]'::jsonb,
    null,
    'milk-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'milk-question',
    2,
    'input',
    'Alex',
    'Ask where the milk is.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Where is the milk?",
        "Where''s the milk?",
        "Can you tell me where the milk is?",
        "Could you tell me where the milk is?"
      ]
    }'::jsonb,
    'milk-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Це природне запитання в магазині.",
      "feedbackIncorrect": "Спробуйте: Where is the milk?"
    }'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼",
      "goal": "ask where a product is"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'milk-answer',
    3,
    'dialogue',
    'Alex',
    'It''s in aisle four, next to the yoghurt and cheese.',
    null,
    '[]'::jsonb,
    null,
    'apple-price',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'apple-price',
    4,
    'choice',
    'Alex',
    'You see some apples, but there is no clear price label.',
    'Що варто запитати?',
    '[
      {
        "id": "price",
        "text": "How much are these apples?",
        "value": "price"
      },
      {
        "id": "station",
        "text": "Which train should I take?",
        "value": "station"
      },
      {
        "id": "doctor",
        "text": "Do I need an appointment?",
        "value": "doctor"
      }
    ]'::jsonb,
    '{
      "optionId": "price"
    }'::jsonb,
    'price-answer',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Це правильне запитання про ціну.",
      "feedbackIncorrect": "Оберіть фразу How much are these apples?"
    }'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼",
      "goal": "ask about price"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-answer',
    5,
    'dialogue',
    'Alex',
    'They''re £2.20 per kilo.',
    null,
    '[]'::jsonb,
    null,
    'quantity-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'quantity-input',
    6,
    'input',
    'Alex',
    'Say that you would like one kilo of apples.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''d like one kilo of apples.",
        "I would like one kilo of apples.",
        "Can I have one kilo of apples?",
        "One kilo of apples, please."
      ]
    }'::jsonb,
    'bread-choice',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно попросили потрібну кількість.",
      "feedbackIncorrect": "Спробуйте: I''d like one kilo of apples."
    }'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼",
      "goal": "ask for quantity"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'bread-choice',
    7,
    'choice',
    'Alex',
    'You also need a loaf of bread.',
    'Оберіть природну фразу.',
    '[
      {
        "id": "bread",
        "text": "I''d also like a loaf of bread, please.",
        "value": "bread"
      },
      {
        "id": "hotel",
        "text": "I have a reservation.",
        "value": "hotel"
      },
      {
        "id": "bank",
        "text": "What is the exchange rate?",
        "value": "bank"
      }
    ]'::jsonb,
    '{
      "optionId": "bread"
    }'::jsonb,
    'checkout-intro',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Це природне прохання в магазині.",
      "feedbackIncorrect": "Оберіть відповідь про хліб."
    }'::jsonb,
    '{
      "role": "Shop Assistant",
      "avatar": "🧑‍💼"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'checkout-intro',
    8,
    'narration',
    null,
    'Ви знайшли всі продукти й підійшли до каси.',
    null,
    '[]'::jsonb,
    null,
    'bag-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🛒"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'bag-question',
    9,
    'dialogue',
    'Maya',
    'Hello. Would you like a bag?',
    null,
    '[]'::jsonb,
    null,
    'bag-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Cashier",
      "avatar": "🧾",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'bag-answer',
    10,
    'choice',
    'Maya',
    'You need one bag.',
    'Що відповісти?',
    '[
      {
        "id": "yes-bag",
        "text": "Yes, please. Just one.",
        "value": "yes-bag"
      },
      {
        "id": "taxi",
        "text": "Take me to the station, please.",
        "value": "taxi"
      },
      {
        "id": "menu",
        "text": "Can I see the menu?",
        "value": "menu"
      }
    ]'::jsonb,
    '{
      "optionId": "yes-bag"
    }'::jsonb,
    'payment-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Коротко й природно.",
      "feedbackIncorrect": "Оберіть відповідь про пакет."
    }'::jsonb,
    '{
      "role": "Cashier",
      "avatar": "🧾",
      "goal": "respond about a bag"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'payment-question',
    11,
    'dialogue',
    'Maya',
    'That comes to £12.45. Will you be paying by cash or card?',
    null,
    '[]'::jsonb,
    null,
    'payment-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Cashier",
      "avatar": "🧾"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'payment-answer',
    12,
    'input',
    'Maya',
    'Say that you would like to pay by card.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''ll pay by card.",
        "I will pay by card.",
        "By card, please.",
        "I''d like to pay by card.",
        "I would like to pay by card."
      ]
    }'::jsonb,
    'receipt-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Це природна відповідь на касі.",
      "feedbackIncorrect": "Спробуйте: I''ll pay by card."
    }'::jsonb,
    '{
      "role": "Cashier",
      "avatar": "🧾",
      "goal": "choose payment method"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'receipt-question',
    13,
    'dialogue',
    'Maya',
    'Payment approved. Would you like your receipt?',
    null,
    '[]'::jsonb,
    null,
    'receipt-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Cashier",
      "avatar": "🧾"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'receipt-answer',
    14,
    'input',
    'Maya',
    'Politely say yes and thank the cashier.',
    'Напишіть коротку відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Yes, please. Thank you.",
        "Yes, please, thank you.",
        "Yes, thank you.",
        "Yes please. Thanks."
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви ввічливо завершили покупку.",
      "feedbackIncorrect": "Спробуйте: Yes, please. Thank you."
    }'::jsonb,
    '{
      "role": "Cashier",
      "avatar": "🧾",
      "goal": "finish checkout politely"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви знайшли потрібні продукти, уточнили ціну й кількість та успішно розрахувалися на касі.',
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
        "aisle",
        "per kilo",
        "loaf of bread",
        "bag",
        "cash or card",
        "receipt"
      ]
    }'::jsonb
  );

end $$;