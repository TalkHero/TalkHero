-- =========================================================
-- TalkHero London Life
-- Mission #8: Opening a Bank Account
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
    'opening-a-bank-account',
    'Opening a Bank Account',
    'Відкрийте банківський рахунок, уточніть необхідні документи, умови обслуговування та отримання дебетової картки.',
    'conversation',
    'A2',
    7,
    11,
    115,
    45,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Відкриття банківського рахунку",
        "objectives": [
          "пояснити, що ви хочете відкрити банківський рахунок",
          "уточнити, які документи потрібні",
          "обрати тип рахунку",
          "запитати про щомісячну плату та дебетову картку",
          "підтвердити контактні дані та завершити оформлення"
        ]
      },
      "location": "bank"
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
    'At the Bank',
    'Поговоріть із банківським консультантом і відкрийте поточний рахунок.',
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
    'Ви прийшли до банку, щоб відкрити рахунок для повсякденних витрат і отримання зарплати.',
    null,
    '[]'::jsonb,
    null,
    'advisor-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🏦",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'advisor-greeting',
    1,
    'dialogue',
    'Emma',
    'Good morning. How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'request-account',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'request-account',
    2,
    'choice',
    'Emma',
    'Explain why you are here.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "account",
        "text": "I''d like to open a bank account, please.",
        "value": "account"
      },
      {
        "id": "parcel",
        "text": "I''d like to send a parcel.",
        "value": "parcel"
      },
      {
        "id": "appointment",
        "text": "I''d like to book a doctor''s appointment.",
        "value": "appointment"
      }
    ]'::jsonb,
    '{
      "optionId": "account"
    }'::jsonb,
    'account-purpose',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко пояснили, що хочете відкрити рахунок.",
      "feedbackIncorrect": "Оберіть фразу про відкриття банківського рахунку."
    }'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'account-purpose',
    3,
    'dialogue',
    'Emma',
    'Of course. Will you mainly use the account for everyday spending, bills, or salary payments?',
    null,
    '[]'::jsonb,
    null,
    'purpose-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'purpose-input',
    4,
    'input',
    'Emma',
    'Say that you need the account for everyday spending and salary payments.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I need it for everyday spending and salary payments.",
        "I need the account for everyday spending and salary payments.",
        "I''ll use it for everyday spending and salary payments.",
        "I will use it for everyday spending and salary payments."
      ]
    }'::jsonb,
    'documents-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви пояснили, для чого потрібен рахунок.",
      "feedbackIncorrect": "Спробуйте: I need it for everyday spending and salary payments."
    }'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'documents-question',
    5,
    'dialogue',
    'Emma',
    'You''ll need proof of identity and proof of address.',
    null,
    '[]'::jsonb,
    null,
    'documents-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'documents-input',
    6,
    'translate',
    null,
    'Які документи мені потрібно надати?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "What documents do I need to provide?",
        "Which documents do I need to provide?",
        "What documents do I need?",
        "Which documents do I need?"
      ]
    }'::jsonb,
    'documents-confirmation',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви природно запитали про необхідні документи.",
      "feedbackIncorrect": "Спробуйте: What documents do I need to provide?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'documents-confirmation',
    7,
    'dialogue',
    'Emma',
    'A passport or driving licence is fine, and we also need something showing your current address.',
    null,
    '[]'::jsonb,
    null,
    'account-type',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'account-type',
    8,
    'choice',
    'Emma',
    'Choose a standard current account.',
    'Оберіть відповідь.',
    '[
      {
        "id": "current",
        "text": "A standard current account would be fine.",
        "value": "current"
      },
      {
        "id": "mortgage",
        "text": "I''d like to apply for a mortgage today.",
        "value": "mortgage"
      },
      {
        "id": "exchange",
        "text": "I need to exchange some dollars.",
        "value": "exchange"
      }
    ]'::jsonb,
    '{
      "optionId": "current"
    }'::jsonb,
    'monthly-fee',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви обрали звичайний current account.",
      "feedbackIncorrect": "Оберіть варіант зі standard current account."
    }'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'monthly-fee',
    9,
    'dialogue',
    'Emma',
    'This account has no monthly fee if you use online statements.',
    null,
    '[]'::jsonb,
    null,
    'fee-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'fee-question',
    10,
    'input',
    'Emma',
    'Ask whether there is a monthly fee.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Is there a monthly fee?",
        "Does the account have a monthly fee?",
        "Is there any monthly fee?",
        "Do I have to pay a monthly fee?"
      ]
    }'::jsonb,
    'card-info',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно запитали про щомісячну плату.",
      "feedbackIncorrect": "Спробуйте: Is there a monthly fee?"
    }'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'card-info',
    11,
    'dialogue',
    'Emma',
    'You''ll receive a debit card, and contactless payments are included.',
    null,
    '[]'::jsonb,
    null,
    'card-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'card-question',
    12,
    'input',
    'Emma',
    'Ask when the debit card will arrive.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "When will the debit card arrive?",
        "When will my debit card arrive?",
        "How long will the debit card take to arrive?",
        "How long will my debit card take to arrive?"
      ]
    }'::jsonb,
    'contact-details',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Ви правильно запитали про доставку картки.",
      "feedbackIncorrect": "Спробуйте: When will the debit card arrive?"
    }'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'contact-details',
    13,
    'dialogue',
    'Emma',
    'It should arrive within five working days. I just need to confirm your email address and phone number.',
    null,
    '[]'::jsonb,
    null,
    'final-confirmation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-confirmation',
    14,
    'choice',
    'Emma',
    'Confirm your details and thank the adviser.',
    'Оберіть відповідь.',
    '[
      {
        "id": "confirm",
        "text": "Yes, those details are correct. Thank you for your help.",
        "value": "confirm"
      },
      {
        "id": "coffee",
        "text": "Could I have a coffee, please?",
        "value": "coffee"
      },
      {
        "id": "parcel",
        "text": "Can I track my parcel?",
        "value": "parcel"
      }
    ]'::jsonb,
    '{
      "optionId": "confirm"
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви підтвердили дані та завершили оформлення.",
      "feedbackIncorrect": "Оберіть відповідь, яка підтверджує дані та дякує консультанту."
    }'::jsonb,
    '{
      "role": "Bank Adviser",
      "avatar": "🏦"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви успішно відкрили банківський рахунок, уточнили умови та домовилися про отримання дебетової картки.',
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
        "bank account",
        "proof of identity",
        "proof of address",
        "current account",
        "monthly fee",
        "debit card",
        "contactless"
      ]
    }'::jsonb
  );

end $$;