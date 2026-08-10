-- =========================================================
-- TalkHero London Life
-- Mission #7: Post Office — Sending a Parcel
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
    'post-office',
    'Post Office — Sending a Parcel',
    'Відправте посилку, оберіть спосіб доставки, уточніть вартість і термін та завершіть оплату.',
    'conversation',
    'A2',
    6,
    10,
    110,
    45,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Відправлення посилки",
        "objectives": [
          "пояснити, куди ви хочете відправити посилку",
          "уточнити вагу та вартість доставки",
          "обрати відстежувану доставку",
          "запитати про термін доставки",
          "завершити оплату та отримати квитанцію"
        ]
      },
      "location": "post-office"
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
    'At the Post Office',
    'Поговоріть із працівником пошти та відправте посилку за кордон.',
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
    'Ви прийшли до поштового відділення, щоб відправити посилку другу в іншу країну.',
    null,
    '[]'::jsonb,
    null,
    'clerk-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "📦",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'clerk-greeting',
    1,
    'dialogue',
    'James',
    'Good afternoon. How can I help you?',
    null,
    '[]'::jsonb,
    null,
    'send-parcel',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'send-parcel',
    2,
    'choice',
    'James',
    'Explain what you want to do.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "parcel",
        "text": "I''d like to send this parcel, please.",
        "value": "parcel"
      },
      {
        "id": "hotel",
        "text": "I''d like to book a room.",
        "value": "hotel"
      },
      {
        "id": "doctor",
        "text": "I need to see a doctor.",
        "value": "doctor"
      }
    ]'::jsonb,
    '{
      "optionId": "parcel"
    }'::jsonb,
    'destination-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко пояснили, що хочете відправити посилку.",
      "feedbackIncorrect": "Оберіть фразу про відправлення посилки."
    }'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'destination-question',
    3,
    'dialogue',
    'James',
    'Certainly. Where are you sending it?',
    null,
    '[]'::jsonb,
    null,
    'destination-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'destination-input',
    4,
    'input',
    'James',
    'Say that you are sending the parcel to Germany.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''m sending it to Germany.",
        "I am sending it to Germany.",
        "It''s going to Germany.",
        "The parcel is going to Germany."
      ]
    }'::jsonb,
    'weigh-parcel',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно назвали країну призначення.",
      "feedbackIncorrect": "Спробуйте: I''m sending it to Germany."
    }'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'weigh-parcel',
    5,
    'dialogue',
    'James',
    'Let me weigh it. It''s 1.8 kilos.',
    null,
    '[]'::jsonb,
    null,
    'price-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-question',
    6,
    'translate',
    null,
    'Скільки коштуватиме відправити цю посилку?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How much will it cost to send this parcel?",
        "How much does it cost to send this parcel?",
        "How much is it to send this parcel?",
        "How much will it be to send this parcel?"
      ]
    }'::jsonb,
    'delivery-options',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Це природне запитання про вартість.",
      "feedbackIncorrect": "Спробуйте: How much will it cost to send this parcel?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "📦",
      "goal": "ask about postage cost"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'delivery-options',
    7,
    'dialogue',
    'James',
    'Standard delivery is £12.50. Tracked delivery is £16.80.',
    null,
    '[]'::jsonb,
    null,
    'tracked-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'tracked-choice',
    8,
    'choice',
    'James',
    'Choose tracked delivery.',
    'Оберіть відповідь.',
    '[
      {
        "id": "tracked",
        "text": "I''d like tracked delivery, please.",
        "value": "tracked"
      },
      {
        "id": "cash",
        "text": "I need to withdraw some cash.",
        "value": "cash"
      },
      {
        "id": "coffee",
        "text": "Can I have a cappuccino?",
        "value": "coffee"
      }
    ]'::jsonb,
    '{
      "optionId": "tracked"
    }'::jsonb,
    'delivery-time',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви обрали відстежувану доставку.",
      "feedbackIncorrect": "Оберіть фразу про tracked delivery."
    }'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'delivery-time',
    9,
    'dialogue',
    'James',
    'Tracked delivery usually takes three to five working days.',
    null,
    '[]'::jsonb,
    null,
    'time-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'time-question',
    10,
    'input',
    'James',
    'Ask how long delivery usually takes.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How long does delivery usually take?",
        "How long will delivery take?",
        "How long does it usually take?",
        "How long will it take?"
      ]
    }'::jsonb,
    'address-check',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно запитали про термін доставки.",
      "feedbackIncorrect": "Спробуйте: How long does delivery usually take?"
    }'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'address-check',
    11,
    'dialogue',
    'James',
    'Please check that the recipient''s name and address are correct before we send it.',
    null,
    '[]'::jsonb,
    null,
    'address-confirmation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'address-confirmation',
    12,
    'input',
    'James',
    'Confirm that the address is correct.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Yes, the address is correct.",
        "Yes, it''s correct.",
        "Yes, everything is correct.",
        "The address is correct."
      ]
    }'::jsonb,
    'payment-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви підтвердили адресу.",
      "feedbackIncorrect": "Спробуйте: Yes, the address is correct."
    }'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'payment-question',
    13,
    'dialogue',
    'James',
    'That will be £16.80. How would you like to pay?',
    null,
    '[]'::jsonb,
    null,
    'payment-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'payment-answer',
    14,
    'choice',
    'James',
    'Pay by card and ask for the receipt.',
    'Оберіть відповідь.',
    '[
      {
        "id": "card",
        "text": "By card, please. Could I have the receipt?",
        "value": "card"
      },
      {
        "id": "menu",
        "text": "Could I see the menu?",
        "value": "menu"
      },
      {
        "id": "doctor",
        "text": "Do I need an appointment?",
        "value": "doctor"
      }
    ]'::jsonb,
    '{
      "optionId": "card"
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви завершили оплату та попросили квитанцію.",
      "feedbackIncorrect": "Оберіть відповідь про оплату карткою та receipt."
    }'::jsonb,
    '{
      "role": "Postal Clerk",
      "avatar": "📮"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви успішно відправили посилку, обрали відстежувану доставку та отримали квитанцію.',
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
        "parcel",
        "tracked delivery",
        "working days",
        "recipient",
        "address",
        "receipt"
      ]
    }'::jsonb
  );

end $$;