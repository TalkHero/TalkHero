-- =========================================================
-- TalkHero London Independence — B1
-- Mission #3: Calling Customer Support
-- NPC: Harriet — Customer Support Agent
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
    'calling-customer-support',
    'Calling Customer Support',
    'Зателефонуйте до служби підтримки, поясніть проблему з подвійним списанням коштів, уточніть деталі та домовтеся про повернення грошей.',
    'conversation',
    'B1',
    2,
    15,
    140,
    55,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-independence",
        "subtitle": "Дзвінок у службу підтримки",
        "objectives": [
          "пояснити проблему по телефону",
          "описати послідовність подій",
          "відповісти на уточнювальні запитання",
          "ввічливо не погодитися",
          "запропонувати бажане рішення",
          "уточнити термін повернення коштів"
        ]
      },
      "location": "phone-call"
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
    'The Double Charge',
    'Вирішіть проблему з подвійним списанням коштів разом із Harriet.',
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
    'call-start',
    0,
    'narration',
    null,
    'Ви помітили, що онлайн-сервіс двічі списав £29.99 за одну підписку. Ви телефонуєте до служби підтримки, щоб з’ясувати, що сталося.',
    null,
    '[]'::jsonb,
    null,
    'harriet-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Phone Call","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'harriet-greeting',
    1,
    'dialogue',
    'Harriet',
    'Good afternoon. Customer Support, Harriet speaking. How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'explain-problem',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'explain-problem',
    2,
    'input',
    'Harriet',
    'Explain why you are calling.',
    'Поясніть, що з вашого рахунку двічі списали £29.99 за одну підписку.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I''m calling because I''ve been charged £29.99 twice for the same subscription.",
        "I noticed that I was charged £29.99 twice for the same subscription.",
        "There seems to be a problem with my payment. I''ve been charged twice for one subscription."
      ]
    }'::jsonb,
    'verification',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви одразу чітко пояснили причину дзвінка.",
      "feedbackIncorrect":"Назвіть проблему, суму та поясніть, що списання відбулося двічі."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"explain a billing problem"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'verification',
    3,
    'dialogue',
    'Harriet',
    'I''m sorry about that. Let me take a look. Could you confirm the email address associated with your account?',
    null,
    '[]'::jsonb,
    null,
    'verify-account',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'verify-account',
    4,
    'choice',
    'Harriet',
    'Respond professionally.',
    'Оберіть найбільш природну відповідь.',
    '[
      {
        "id":"good",
        "text":"Of course. The email address on the account is alex@example.com.",
        "value":"good"
      },
      {
        "id":"bad",
        "text":"Why do you want to know?",
        "value":"bad"
      },
      {
        "id":"irrelevant",
        "text":"I would like a table for two.",
        "value":"irrelevant"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'charge-details',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви спокійно надали інформацію для перевірки облікового запису.",
      "feedbackIncorrect":"У цій ситуації достатньо ввічливо підтвердити запитану інформацію."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"verify account details"
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'charge-details',
    5,
    'dialogue',
    'Harriet',
    'Thank you. I can see two payments here. Do you remember when you first noticed the duplicate charge?',
    null,
    '[]'::jsonb,
    null,
    'give-timeline',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'give-timeline',
    6,
    'input',
    'Harriet',
    'Explain when you noticed the problem.',
    'Скажіть, що ви оформили підписку вчора, а сьогодні вранці побачили два списання.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I subscribed yesterday, and this morning I noticed that there were two charges on my account.",
        "I signed up yesterday, but I noticed the two payments this morning.",
        "I bought the subscription yesterday and saw the duplicate charge this morning."
      ]
    }'::jsonb,
    'harriet-investigates',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви чітко описали послідовність подій у минулому.",
      "feedbackIncorrect":"Поясніть дві події: коли оформили підписку і коли помітили подвійне списання."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"describe a sequence of events",
      "grammar":["past simple"]
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'harriet-investigates',
    7,
    'dialogue',
    'Harriet',
    'I see what happened. It looks like the payment was processed twice. One option is to leave the extra amount as credit on your account for next month.',
    null,
    '[]'::jsonb,
    null,
    'disagree-politely',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'disagree-politely',
    8,
    'choice',
    'Harriet',
    'You want the money returned instead. What is the best response?',
    'Ввічливо не погодьтеся з запропонованим рішенням.',
    '[
      {
        "id":"polite",
        "text":"I understand, but I''d prefer to have the extra payment refunded if possible.",
        "value":"polite"
      },
      {
        "id":"rude",
        "text":"No. That''s a terrible idea. Give me my money.",
        "value":"rude"
      },
      {
        "id":"accept",
        "text":"That''s fine. Keep the money.",
        "value":"accept"
      }
    ]'::jsonb,
    '{"optionId":"polite"}'::jsonb,
    'harriet-asks-why',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Саме так. I understand, but... — корисна конструкція для ввічливої незгоди.",
      "feedbackIncorrect":"Необхідно ввічливо відхилити пропозицію і сказати, якого рішення ви хочете."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"disagree politely"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'harriet-asks-why',
    9,
    'dialogue',
    'Harriet',
    'Of course. May I ask why you''d prefer a refund rather than account credit?',
    null,
    '[]'::jsonb,
    null,
    'explain-preference',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'explain-preference',
    10,
    'input',
    'Harriet',
    'Explain why you want a refund.',
    'Дайте коротке аргументоване пояснення.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I''d prefer a refund because I only authorised one payment and I need the extra money back in my account.",
        "I only agreed to one payment, so I''d rather have the second payment refunded.",
        "I''d prefer the refund because I wasn''t expecting to pay for two months at once."
      ]
    }'::jsonb,
    'refund-approved',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви пояснили свою позицію, а не просто повторили вимогу.",
      "feedbackIncorrect":"Поясніть причину: ви погоджувалися лише на один платіж і хочете повернути зайво списані кошти."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"justify a preference",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'refund-approved',
    11,
    'dialogue',
    'Harriet',
    'That''s completely understandable. I''ve submitted a refund for £29.99. It should go back to your original payment method.',
    null,
    '[]'::jsonb,
    null,
    'ask-refund-time',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"encouraging"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'ask-refund-time',
    12,
    'input',
    'Harriet',
    'Ask when you should receive the money.',
    'Ввічливо уточніть, скільки часу займе повернення коштів.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Could you tell me how long the refund will take?",
        "Do you know how long it will take for the money to come back?",
        "When should I expect to receive the refund?"
      ]
    }'::jsonb,
    'refund-timing',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви уточнили важливу деталь перед завершенням дзвінка.",
      "feedbackIncorrect":"Запитайте, коли або через скільки часу гроші повернуться."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"ask about timing"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'refund-timing',
    13,
    'dialogue',
    'Harriet',
    'It normally takes three to five working days, depending on your bank. You''ll also receive a confirmation email in the next few minutes.',
    null,
    '[]'::jsonb,
    null,
    'close-call',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'close-call',
    14,
    'choice',
    'Harriet',
    'Finish the call naturally.',
    'Оберіть природне завершення розмови.',
    '[
      {
        "id":"good",
        "text":"Great, thank you for your help. I''ll keep an eye out for the email. Have a good day.",
        "value":"good"
      },
      {
        "id":"short",
        "text":"Fine. Bye.",
        "value":"short"
      },
      {
        "id":"wrong",
        "text":"Could I see the dessert menu?",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви професійно й природно завершили дзвінок.",
      "feedbackIncorrect":"Подякуйте за допомогу та природно завершіть розмову."
    }'::jsonb,
    '{
      "npcId":"london-independence-customer-support-harriet",
      "role":"Customer Support Agent",
      "goal":"close a support call"
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
    'Проблему вирішено! Ви пояснили подвійне списання, описали послідовність подій, ввічливо не погодилися з першим рішенням, аргументували свою позицію та домовилися про повернення коштів.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Calling Customer Support completed",
      "learnedWords":[
        "duplicate charge",
        "subscription",
        "account credit",
        "refund",
        "original payment method",
        "working days",
        "I understand, but",
        "I''d prefer",
        "keep an eye out"
      ]
    }'::jsonb
  );

end $$;