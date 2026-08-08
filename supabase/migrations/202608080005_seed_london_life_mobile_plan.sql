-- =========================================================
-- TalkHero London Life
-- Mission #4: Getting a Mobile Plan
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
    'getting-a-mobile-plan',
    'Getting a Mobile Plan',
    'Оберіть мобільний тариф, уточніть кількість інтернету, умови контракту та спосіб підключення.',
    'conversation',
    'A2',
    3,
    10,
    95,
    35,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Підключення мобільного тарифу",
        "objectives": [
          "пояснити, який мобільний тариф вам потрібен",
          "запитати про кількість мобільного інтернету",
          "уточнити місячну вартість",
          "дізнатися про контракт та eSIM",
          "підтвердити вибір тарифу"
        ]
      },
      "location": "mobile-phone-shop"
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
    'At the Mobile Shop',
    'Поговоріть із консультантом і підберіть мобільний тариф.',
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
    'Ви зайшли до магазину мобільного оператора. Вам потрібен британський номер і тариф із мобільним інтернетом.',
    null,
    '[]'::jsonb,
    null,
    'assistant-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "📱",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'assistant-greeting',
    1,
    'dialogue',
    'Emma',
    'Hi! How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'explain-need',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'explain-need',
    2,
    'choice',
    'Emma',
    'Tell Emma what you need.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "plan",
        "text": "I''m looking for a mobile plan with data.",
        "value": "plan"
      },
      {
        "id": "hotel",
        "text": "I''d like to book a room.",
        "value": "hotel"
      },
      {
        "id": "train",
        "text": "Which platform is the train on?",
        "value": "train"
      }
    ]'::jsonb,
    '{
      "optionId": "plan"
    }'::jsonb,
    'plan-options',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко пояснили, що вам потрібен мобільний тариф.",
      "feedbackIncorrect": "Оберіть фразу про мобільний тариф."
    }'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'plan-options',
    3,
    'dialogue',
    'Emma',
    'We have several options. Do you mainly need calls, texts or mobile data?',
    null,
    '[]'::jsonb,
    null,
    'data-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'data-answer',
    4,
    'input',
    'Emma',
    'Say that mobile data is the most important for you.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Mobile data is the most important for me.",
        "Data is the most important for me.",
        "I mainly need mobile data.",
        "I mostly need mobile data."
      ]
    }'::jsonb,
    'data-packages',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви пояснили свій головний пріоритет.",
      "feedbackIncorrect": "Спробуйте: I mainly need mobile data."
    }'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱",
      "goal": "state your priority"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'data-packages',
    5,
    'dialogue',
    'Emma',
    'We have a 20 GB plan for £15 a month and a 50 GB plan for £22 a month.',
    null,
    '[]'::jsonb,
    null,
    'data-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'data-question',
    6,
    'translate',
    null,
    'Скільки мобільного інтернету включено в цей тариф?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How much data is included in this plan?",
        "How much mobile data is included in this plan?",
        "How much data does this plan include?"
      ]
    }'::jsonb,
    'price-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Це природне запитання про тариф.",
      "feedbackIncorrect": "Спробуйте: How much data is included in this plan?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "📱",
      "goal": "ask about included data"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-question',
    7,
    'choice',
    'Emma',
    'You want to confirm the monthly price of the 50 GB plan.',
    'Що варто запитати?',
    '[
      {
        "id": "price",
        "text": "How much is it per month?",
        "value": "price"
      },
      {
        "id": "rent",
        "text": "How much is the rent?",
        "value": "rent"
      },
      {
        "id": "receipt",
        "text": "Can I have the receipt?",
        "value": "receipt"
      }
    ]'::jsonb,
    '{
      "optionId": "price"
    }'::jsonb,
    'contract-info',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Це правильне запитання про місячну вартість.",
      "feedbackIncorrect": "Оберіть How much is it per month?"
    }'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'contract-info',
    8,
    'dialogue',
    'Emma',
    'The 50 GB plan is £22 per month. You can choose a monthly rolling plan or a 12-month contract.',
    null,
    '[]'::jsonb,
    null,
    'contract-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'contract-question',
    9,
    'input',
    'Emma',
    'Ask whether you need to sign a long contract.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Do I need to sign a long contract?",
        "Do I have to sign a long contract?",
        "Is there a long-term contract?",
        "Do I need a long-term contract?"
      ]
    }'::jsonb,
    'contract-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви правильно уточнили умови контракту.",
      "feedbackIncorrect": "Спробуйте: Do I need to sign a long contract?"
    }'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱",
      "goal": "ask about contract terms"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'contract-answer',
    10,
    'dialogue',
    'Emma',
    'No. The monthly rolling plan has no long-term commitment.',
    null,
    '[]'::jsonb,
    null,
    'esim-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'esim-question',
    11,
    'input',
    'Emma',
    'Ask if the plan is available as an eSIM.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Is this plan available as an eSIM?",
        "Can I get this plan as an eSIM?",
        "Do you offer eSIM for this plan?",
        "Can I use an eSIM with this plan?"
      ]
    }'::jsonb,
    'esim-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно запитали про eSIM.",
      "feedbackIncorrect": "Спробуйте: Is this plan available as an eSIM?"
    }'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱",
      "goal": "ask about eSIM"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'esim-answer',
    12,
    'dialogue',
    'Emma',
    'Yes, we can activate an eSIM for you today. It only takes a few minutes.',
    null,
    '[]'::jsonb,
    null,
    'choose-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'choose-plan',
    13,
    'choice',
    'Emma',
    'Choose the 50 GB monthly rolling plan.',
    'Оберіть відповідь.',
    '[
      {
        "id": "choose",
        "text": "I''ll take the 50 GB monthly plan, please.",
        "value": "choose"
      },
      {
        "id": "coffee",
        "text": "I''d like a cappuccino, please.",
        "value": "coffee"
      },
      {
        "id": "doctor",
        "text": "I need to see a doctor.",
        "value": "doctor"
      }
    ]'::jsonb,
    '{
      "optionId": "choose"
    }'::jsonb,
    'confirmation',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко підтвердили свій вибір.",
      "feedbackIncorrect": "Оберіть відповідь про 50 GB monthly plan."
    }'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'confirmation',
    14,
    'dialogue',
    'Emma',
    'Perfect. I''ll set that up for you now. Your new number will be active in a few minutes.',
    null,
    '[]'::jsonb,
    null,
    'complete',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Mobile Adviser",
      "avatar": "📱",
      "emotion": "helpful"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви підібрали мобільний тариф, уточнили обсяг інтернету, умови контракту та підключення eSIM.',
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
        "mobile plan",
        "mobile data",
        "per month",
        "rolling plan",
        "long-term contract",
        "eSIM"
      ]
    }'::jsonb
  );

end $$;