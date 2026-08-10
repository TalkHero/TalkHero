-- =========================================================
-- TalkHero London Life
-- Mission #9: Setting Up Utilities
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
    'setting-up-utilities',
    'Setting Up Utilities',
    'Підключіть комунальні послуги у новому помешканні, повідомте показники лічильника та налаштуйте оплату.',
    'conversation',
    'A2',
    8,
    11,
    120,
    50,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Підключення комунальних послуг",
        "objectives": [
          "повідомити, що ви щойно переїхали",
          "назвати нову адресу",
          "передати показники лічильника",
          "уточнити щомісячну оплату",
          "налаштувати direct debit"
        ]
      },
      "location": "home"
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
    'Calling the Utility Company',
    'Зателефонуйте постачальнику електроенергії та налаштуйте рахунок для нового житла.',
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
    'Ви щойно переїхали до нової квартири. Тепер потрібно оформити електроенергію на своє ім’я.',
    null,
    '[]'::jsonb,
    null,
    'agent-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "⚡",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'agent-greeting',
    1,
    'dialogue',
    'Sophie',
    'Good morning. Energy Services. How can I help?',
    null,
    '[]'::jsonb,
    null,
    'explain-move',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'explain-move',
    2,
    'choice',
    'Sophie',
    'Explain why you are calling.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "moved",
        "text": "I''ve just moved into a new flat and I need to set up my electricity account.",
        "value": "moved"
      },
      {
        "id": "parcel",
        "text": "I''d like to send a parcel to Germany.",
        "value": "parcel"
      },
      {
        "id": "doctor",
        "text": "I need to book a doctor''s appointment.",
        "value": "doctor"
      }
    ]'::jsonb,
    '{
      "optionId": "moved"
    }'::jsonb,
    'address-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко пояснили причину дзвінка.",
      "feedbackIncorrect": "Оберіть відповідь про переїзд і підключення електроенергії."
    }'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'address-question',
    3,
    'dialogue',
    'Sophie',
    'No problem. What is your new address?',
    null,
    '[]'::jsonb,
    null,
    'address-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'address-input',
    4,
    'input',
    'Sophie',
    'Say that your address is 24 Green Street, London.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "My address is 24 Green Street, London.",
        "It''s 24 Green Street, London.",
        "The address is 24 Green Street, London."
      ]
    }'::jsonb,
    'meter-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно повідомили адресу.",
      "feedbackIncorrect": "Спробуйте: My address is 24 Green Street, London."
    }'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'meter-question',
    5,
    'dialogue',
    'Sophie',
    'Do you have the current meter reading?',
    null,
    '[]'::jsonb,
    null,
    'meter-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'meter-input',
    6,
    'input',
    'Sophie',
    'Say that the meter reading is 4,286.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "The meter reading is 4286.",
        "The meter reading is 4,286.",
        "It''s 4286.",
        "It is 4286."
      ]
    }'::jsonb,
    'payment-info',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Показники лічильника передані.",
      "feedbackIncorrect": "Спробуйте: The meter reading is 4286."
    }'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'payment-info',
    7,
    'dialogue',
    'Sophie',
    'Thank you. Based on average usage, your estimated monthly payment will be about £72.',
    null,
    '[]'::jsonb,
    null,
    'monthly-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'monthly-question',
    8,
    'translate',
    null,
    'Скільки я платитиму щомісяця?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How much will I pay each month?",
        "How much will I pay every month?",
        "How much is the monthly payment?",
        "What will my monthly payment be?"
      ]
    }'::jsonb,
    'direct-debit-info',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Це природне запитання про щомісячну оплату.",
      "feedbackIncorrect": "Спробуйте: How much will I pay each month?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'direct-debit-info',
    9,
    'dialogue',
    'Sophie',
    'The easiest option is monthly direct debit from your bank account.',
    null,
    '[]'::jsonb,
    null,
    'direct-debit-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'direct-debit-choice',
    10,
    'choice',
    'Sophie',
    'Agree to pay by direct debit.',
    'Оберіть відповідь.',
    '[
      {
        "id": "direct-debit",
        "text": "Yes, I''d like to pay by direct debit.",
        "value": "direct-debit"
      },
      {
        "id": "cash",
        "text": "I''d like to withdraw some cash.",
        "value": "cash"
      },
      {
        "id": "delivery",
        "text": "I''d like tracked delivery.",
        "value": "delivery"
      }
    ]'::jsonb,
    '{
      "optionId": "direct-debit"
    }'::jsonb,
    'bill-date',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви обрали direct debit.",
      "feedbackIncorrect": "Оберіть варіант оплати через direct debit."
    }'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'bill-date',
    11,
    'dialogue',
    'Sophie',
    'Your first payment will be taken on the 15th of next month.',
    null,
    '[]'::jsonb,
    null,
    'bill-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'bill-question',
    12,
    'input',
    'Sophie',
    'Ask when you will receive your first bill.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "When will I receive my first bill?",
        "When will I get my first bill?",
        "When should I receive my first bill?"
      ]
    }'::jsonb,
    'confirmation',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно запитали про перший рахунок.",
      "feedbackIncorrect": "Спробуйте: When will I receive my first bill?"
    }'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'confirmation',
    13,
    'dialogue',
    'Sophie',
    'We''ll email your first bill within two weeks. Your electricity account is now active.',
    null,
    '[]'::jsonb,
    null,
    'final-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-answer',
    14,
    'choice',
    'Sophie',
    'Confirm and thank the agent.',
    'Оберіть відповідь.',
    '[
      {
        "id": "thanks",
        "text": "That''s perfect. Thank you for your help.",
        "value": "thanks"
      },
      {
        "id": "appointment",
        "text": "Can I book an appointment?",
        "value": "appointment"
      },
      {
        "id": "parcel",
        "text": "Where can I post this parcel?",
        "value": "parcel"
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
      "feedbackCorrect": "Чудово. Ви завершили розмову ввічливо.",
      "feedbackIncorrect": "Оберіть відповідь, яка підтверджує все та дякує оператору."
    }'::jsonb,
    '{
      "role": "Customer Service Agent",
      "avatar": "⚡"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви успішно оформили електроенергію, передали показники лічильника та налаштували оплату.',
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
        "utilities",
        "electricity account",
        "meter reading",
        "monthly payment",
        "direct debit",
        "bill"
      ]
    }'::jsonb
  );

end $$;