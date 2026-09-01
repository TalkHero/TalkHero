-- =========================================================
-- TalkHero London Independence — B1
-- Mission #7: Hotel Problem
-- NPC: George — Hotel Receptionist
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  select id into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-independence'
    and status = 'published';

  if campaign_uuid is null then
    raise exception 'Campaign not found: london-independence';
  end if;

  select id into episode_uuid
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
    'hotel-problem',
    'Hotel Problem',
    'Вирішіть проблему з номером у готелі: поясніть несправності, відхиліть незручне рішення та домовтеся про інший номер.',
    'conversation',
    'B1',
    6,
    15,
    180,
    75,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Проблема з номером у готелі",
        "objectives":[
          "чітко описати кілька проблем",
          "пояснити, як проблема впливає на вас",
          "реагувати на запропоноване рішення",
          "ввічливо наполягати на альтернативі",
          "домовитися про зміну номера",
          "уточнити компенсацію та деталі"
        ]
      },
      "location":"hotel-reception"
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
    'A Bad Night Ahead?',
    'Поговоріть із George та знайдіть прийнятне рішення проблеми з номером.',
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
    quest_uuid, act_uuid, 'room-problem', 0, 'narration', null,
    'Ви щойно заселилися в готель. У номері холодно, опалення не працює, а вентиляція видає гучний постійний шум. Ви спускаєтеся на рецепцію.',
    null,
    '[]'::jsonb,
    null,
    'george-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Hotel Reception","emotion":"concerned"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'george-greeting', 1, 'dialogue', 'George',
    'Good evening. Is everything all right with your room?',
    null,
    '[]'::jsonb,
    null,
    'describe-problems',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'describe-problems', 2, 'input', 'George',
    'Explain what is wrong with the room.',
    'Опишіть обидві проблеми: опалення не працює, а вентиляція дуже шумить.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "There are two problems with my room. The heating isn''t working and the ventilation system is making a very loud noise.",
        "Unfortunately, the heating doesn''t seem to work, and there''s also a lot of noise coming from the ventilation.",
        "The room is very cold because the heating isn''t working, and the ventilation is extremely noisy."
      ]
    }'::jsonb,
    'george-clarifies',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви чітко описали обидві проблеми.",
      "feedbackIncorrect":"Назвіть обидві проблеми: heating і noisy ventilation."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"describe multiple problems"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'george-clarifies', 3, 'dialogue', 'George',
    'I''m sorry about that. Has the heating not worked at all since you arrived, or did it stop recently?',
    null,
    '[]'::jsonb,
    null,
    'explain-heating',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"concerned"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-heating', 4, 'input', 'George',
    'Give George more detail.',
    'Поясніть, що опалення не працювало від моменту вашого заселення і ви вже пробували змінити температуру.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "It hasn''t worked since I arrived. I''ve already tried changing the temperature, but nothing happened.",
        "The heating hasn''t worked at all since I checked in. I tried adjusting the temperature, but it didn''t help.",
        "It hasn''t been working since I got to the room, even though I''ve tried changing the settings."
      ]
    }'::jsonb,
    'technician-offer',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви пояснили тривалість проблеми та що вже намагалися зробити.",
      "feedbackIncorrect":"Скажіть, що проблема існує від моменту заселення і ви вже пробували змінити налаштування."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"give detailed background",
      "grammar":["present perfect"]
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'technician-offer', 5, 'dialogue', 'George',
    'I understand. Our maintenance technician can take a look, but unfortunately he won''t be available until around ten o''clock tonight.',
    null,
    '[]'::jsonb,
    null,
    'reject-waiting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'reject-waiting', 6, 'choice', 'George',
    'Waiting until 10 p.m. is not acceptable because you need to sleep early.',
    'Відхиліть рішення ввічливо, але впевнено.',
    '[
      {
        "id":"good",
        "text":"I understand, but I''m afraid waiting until ten won''t really work for me. I need to get some sleep early tonight.",
        "value":"good"
      },
      {
        "id":"rude",
        "text":"That''s ridiculous. Fix it now.",
        "value":"rude"
      },
      {
        "id":"accept",
        "text":"No problem. I''ll just stay in the cold room.",
        "value":"accept"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'george-heater',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Саме так. Ви визнали ситуацію, але чітко пояснили, чому запропоноване рішення вам не підходить.",
      "feedbackIncorrect":"Відхиліть пропозицію ввічливо та поясніть причину."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"reject an unsuitable solution politely"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'george-heater', 7, 'dialogue', 'George',
    'I see. I could bring you a portable heater for tonight. That would solve the temperature problem.',
    null,
    '[]'::jsonb,
    null,
    'mention-noise',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mention-noise', 8, 'input', 'George',
    'Explain why the heater is not a complete solution.',
    'Нагадайте George, що залишається друга проблема — шум вентиляції, через який буде важко спати.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "That would help with the temperature, but there''s still the problem with the ventilation. The noise is loud enough to keep me awake.",
        "I appreciate that, but the heater wouldn''t solve the noise problem. I don''t think I''ll be able to sleep with the ventilation making that sound.",
        "The heater would help, but unfortunately the ventilation is still extremely noisy, so I''d probably have trouble sleeping."
      ]
    }'::jsonb,
    'george-room-check',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви пояснили, чому часткове рішення не усуває всю проблему.",
      "feedbackIncorrect":"Поясніть, що heater вирішує холод, але не шум вентиляції."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"evaluate a proposed solution",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'george-room-check', 9, 'dialogue', 'George',
    'You''re right. Let me check whether we have another room available... We do have one, but it''s on the first floor near the lift.',
    null,
    '[]'::jsonb,
    null,
    'ask-room-details',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'ask-room-details', 10, 'input', 'George',
    'Ask for information before accepting.',
    'Уточніть, чи новий номер тихий і чи в ньому точно працює опалення.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Before I decide, could you tell me whether that room is quiet and whether the heating is definitely working?",
        "Could you check if the room is quiet and if the heating works properly?",
        "That might work. Is the room quiet, and has the heating been checked?"
      ]
    }'::jsonb,
    'george-confirms-room',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви перевірили ключові деталі перед тим, як погодитися.",
      "feedbackIncorrect":"Запитайте про дві речі: рівень шуму та опалення."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"clarify an alternative solution"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'george-confirms-room', 11, 'dialogue', 'George',
    'Yes. The heating was checked this afternoon, and the room itself is quiet. The lift is on the other side of the corridor, so you shouldn''t hear it.',
    null,
    '[]'::jsonb,
    null,
    'request-compensation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"encouraging"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'request-compensation', 12, 'input', 'George',
    'The problem has taken time and you need to move all your things. Politely ask whether the hotel can offer anything for the inconvenience.',
    'Ввічливо запитайте про компенсацію за незручності.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Thank you. Since I''ll need to move all my things and this has taken quite a bit of time, would it be possible to offer something for the inconvenience?",
        "I appreciate you finding another room. Would the hotel be able to offer any compensation for the inconvenience?",
        "That sounds much better. Could I also ask whether there''s any compensation available because of the problems with the original room?"
      ]
    }'::jsonb,
    'george-compensation',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Це ввічливе, але впевнене прохання про компенсацію.",
      "feedbackIncorrect":"Подякуйте за новий номер і ввічливо запитайте, чи готель може щось запропонувати за незручності."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"request compensation politely",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'george-compensation', 13, 'dialogue', 'George',
    'Certainly. I can offer you complimentary breakfast tomorrow morning, and we''ll move your luggage to the new room for you.',
    null,
    '[]'::jsonb,
    null,
    'confirm-solution',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'confirm-solution', 14, 'choice', 'George',
    'Confirm the final solution.',
    'Підсумуйте домовленість і прийміть її.',
    '[
      {
        "id":"good",
        "text":"That sounds good, thank you. I''ll move to the new room, you''ll arrange the luggage, and breakfast is included tomorrow morning.",
        "value":"good"
      },
      {
        "id":"weak",
        "text":"Okay, I suppose.",
        "value":"weak"
      },
      {
        "id":"wrong",
        "text":"What time does the train to Brighton leave?",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви чітко підтвердили всі частини домовленості.",
      "feedbackIncorrect":"Підтвердьте новий номер, перенесення багажу та безкоштовний сніданок."
    }'::jsonb,
    '{
      "npcId":"london-independence-hotel-problem-george",
      "role":"Hotel Receptionist",
      "goal":"confirm a negotiated solution"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Проблему вирішено! Ви детально описали несправності, пояснили, чому перші пропозиції не підходять, ввічливо наполягли на кращому рішенні та домовилися про новий номер і компенсацію.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Hotel Problem completed",
      "learnedWords":[
        "heating",
        "ventilation",
        "maintenance technician",
        "portable heater",
        "I''m afraid",
        "keep me awake",
        "inconvenience",
        "compensation",
        "complimentary",
        "arrange"
      ]
    }'::jsonb
  );

end $$;