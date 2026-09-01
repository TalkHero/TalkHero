-- =========================================================
-- TalkHero London Independence — B1
-- Mission #4: Returning a Purchase
-- NPC: Priya — Store Assistant
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
  where slug = 'london-independence'
    and status = 'published';

  if campaign_uuid is null then
    raise exception 'Campaign not found: london-independence';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'independent-life'
    and status = 'published';

  if episode_uuid is null then
    raise exception 'Episode not found: independent-life';
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
    'returning-a-purchase',
    'Returning a Purchase',
    'Поверніть несправні бездротові навушники, поясніть проблему та домовтеся про відповідне рішення.',
    'conversation',
    'B1',
    3,
    15,
    150,
    60,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-independence",
        "subtitle": "Повернення несправного товару",
        "objectives": [
          "пояснити несправність товару",
          "описати, коли виникла проблема",
          "підтвердити покупку",
          "попросити повернення або заміну",
          "реагувати на політику магазину",
          "аргументувати свою позицію"
        ]
      },
      "location": "electronics-store"
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
    'The Faulty Headphones',
    'Поясніть Priya проблему з навушниками та домовтеся про вирішення.',
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

  -- 0 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'store-arrival',
    0,
    'narration',
    null,
    'Тиждень тому ви купили бездротові навушники. Сьогодні правий навушник перестав працювати. Ви приходите до магазину, щоб вирішити проблему.',
    null,
    '[]'::jsonb,
    null,
    'priya-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Electronics Store","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'priya-greeting',
    1,
    'dialogue',
    'Priya',
    'Hello. How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'explain-return',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'explain-return',
    2,
    'input',
    'Priya',
    'Explain why you have come back to the store.',
    'Скажіть, що купили ці навушники тиждень тому, але один із них перестав працювати.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I bought these headphones a week ago, but one of them has stopped working.",
        "I bought these wireless headphones last week and the right earbud has stopped working.",
        "I bought these a week ago, but unfortunately one of the earbuds doesn''t work anymore."
      ]
    }'::jsonb,
    'priya-asks-problem',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви одразу пояснили, коли купили товар і в чому проблема.",
      "feedbackIncorrect":"Скажіть, що купили навушники тиждень тому і один навушник перестав працювати."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"explain a faulty product"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'priya-asks-problem',
    3,
    'dialogue',
    'Priya',
    'I''m sorry to hear that. What exactly happens when you try to use them?',
    null,
    '[]'::jsonb,
    null,
    'describe-fault',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'describe-fault',
    4,
    'input',
    'Priya',
    'Describe the problem in more detail.',
    'Поясніть, що лівий навушник працює нормально, але з правого немає звуку навіть після заряджання.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "The left earbud works fine, but there''s no sound from the right one even after I charge it.",
        "The left one works normally, but the right earbud has no sound even after charging it.",
        "I can hear sound from the left earbud, but the right one doesn''t produce any sound even when it''s fully charged."
      ]
    }'::jsonb,
    'receipt-question',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви описали несправність конкретно й зрозуміло.",
      "feedbackIncorrect":"Порівняйте два навушники та поясніть, що заряджання не вирішило проблему."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"describe a technical problem"
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'receipt-question',
    5,
    'dialogue',
    'Priya',
    'Do you have the receipt with you?',
    null,
    '[]'::jsonb,
    null,
    'digital-proof',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'digital-proof',
    6,
    'choice',
    'Priya',
    'You do not have the paper receipt, but you have proof of purchase on your phone.',
    'Оберіть найбільш природну відповідь.',
    '[
      {
        "id":"good",
        "text":"I don''t have the paper receipt, but I have the order confirmation and payment on my phone. Would that be enough?",
        "value":"good"
      },
      {
        "id":"rude",
        "text":"No. I threw it away. That shouldn''t matter.",
        "value":"rude"
      },
      {
        "id":"wrong",
        "text":"Yes, I would like to order a coffee.",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'proof-accepted',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви запропонували альтернативне підтвердження покупки та ввічливо запитали, чи його достатньо.",
      "feedbackIncorrect":"Поясніть, що паперового чека немає, але є цифрове підтвердження покупки."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"offer alternative proof"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'proof-accepted',
    7,
    'dialogue',
    'Priya',
    'Yes, that should be fine. I can see the purchase here. Because the item has been opened, our normal policy is to offer a replacement first.',
    null,
    '[]'::jsonb,
    null,
    'request-refund',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'request-refund',
    8,
    'input',
    'Priya',
    'You would prefer a refund. Ask politely.',
    'Скажіть, що розумієте політику магазину, але віддали б перевагу поверненню коштів.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I understand the policy, but I''d prefer a refund if possible.",
        "I understand, but would it be possible to get a refund instead?",
        "I appreciate that, but I''d rather have a refund if that''s possible."
      ]
    }'::jsonb,
    'priya-explains-policy',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви не просто відмовилися, а зробили це ввічливо.",
      "feedbackIncorrect":"Використайте конструкцію на кшталт I understand, but I''d prefer..."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"request a refund politely"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'priya-explains-policy',
    9,
    'dialogue',
    'Priya',
    'Normally we replace faulty electronics before offering a refund. Is there a particular reason you don''t want a replacement?',
    null,
    '[]'::jsonb,
    null,
    'justify-refund',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'justify-refund',
    10,
    'input',
    'Priya',
    'Explain your reason.',
    'Поясніть, що після цієї проблеми ви втратили довіру до цієї моделі та хочете купити іншу.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "After having this problem so soon, I''ve lost confidence in this model and I''d prefer to buy a different one.",
        "Because they stopped working after only a week, I''d rather choose a different model.",
        "I''m worried the same problem could happen again, so I''d prefer to buy another model."
      ]
    }'::jsonb,
    'manager-option',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна B1-відповідь. Ви аргументували свою позицію та пояснили причину.",
      "feedbackIncorrect":"Не просто попросіть refund — поясніть, чому ви більше не хочете саме цю модель."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"justify a decision",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'manager-option',
    11,
    'dialogue',
    'Priya',
    'That makes sense. In that case, I can authorise the refund as a faulty item. The money will go back to the card you used to pay.',
    null,
    '[]'::jsonb,
    null,
    'confirm-refund',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"encouraging"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'confirm-refund',
    12,
    'choice',
    'Priya',
    'Confirm that this solution works for you.',
    'Оберіть природну відповідь.',
    '[
      {
        "id":"good",
        "text":"That would be perfect, thank you. How long does the refund usually take?",
        "value":"good"
      },
      {
        "id":"weak",
        "text":"Whatever.",
        "value":"weak"
      },
      {
        "id":"wrong",
        "text":"Can I check in for my flight now?",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'refund-time',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви підтвердили рішення та одразу уточнили важливу деталь.",
      "feedbackIncorrect":"Підтвердьте, що refund вам підходить, і запитайте про термін повернення."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"confirm the solution"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'refund-time',
    13,
    'dialogue',
    'Priya',
    'It usually takes three to five working days. I''ll also email you a confirmation today.',
    null,
    '[]'::jsonb,
    null,
    'close-conversation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'close-conversation',
    14,
    'input',
    'Priya',
    'Finish the conversation naturally.',
    'Подякуйте Priya за допомогу та ввічливо завершіть розмову.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Thanks very much for your help. Have a good day.",
        "Thank you for sorting that out. Have a nice day.",
        "Thanks for your help. I really appreciate it."
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Природне й ввічливе завершення розмови.",
      "feedbackIncorrect":"Подякуйте працівнику магазину та завершіть розмову."
    }'::jsonb,
    '{
      "npcId":"london-independence-returning-purchase-priya",
      "role":"Store Assistant",
      "goal":"close a retail conversation"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Готово! Ви описали несправність товару, надали цифрове підтвердження покупки, ввічливо відреагували на політику магазину та аргументували прохання про повернення коштів.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Returning a Purchase completed",
      "learnedWords":[
        "faulty",
        "receipt",
        "proof of purchase",
        "order confirmation",
        "replacement",
        "refund",
        "store policy",
        "I''d prefer",
        "I''d rather",
        "authorise a refund"
      ]
    }'::jsonb
  );

end $$;