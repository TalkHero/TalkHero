-- =========================================================
-- TalkHero London Independence — B1
-- Mission #9: At the Doctor
-- NPC: Dr. Eleanor Price — GP
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
    'at-the-doctor',
    'At the Doctor',
    'Поясніть лікарю свої симптоми, опишіть, як вони змінювалися, та уточніть рекомендації щодо відновлення.',
    'conversation',
    'B1',
    8,
    15,
    200,
    85,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Прийом у сімейного лікаря",
        "objectives":[
          "описати симптоми",
          "пояснити тривалість симптомів",
          "описати зміни стану",
          "відповідати на уточнювальні запитання",
          "пояснити вплив на повсякденне життя",
          "уточнити рекомендації",
          "підсумувати план відновлення"
        ]
      },
      "location":"gp-surgery"
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
    'A Persistent Cough',
    'Поговоріть з Dr. Eleanor Price про симптоми та рекомендації.',
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
    quest_uuid, act_uuid, 'arrival', 0, 'narration', null,
    'Ви прийшли на прийом до сімейного лікаря. Уже близько тижня у вас кашель, втома та періодичний головний біль. Температури майже немає, але останні два дні стан трохи погіршився.',
    null,
    '[]'::jsonb,
    null,
    'doctor-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"GP Surgery","emotion":"concerned"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-greeting', 1, 'dialogue', 'Dr. Eleanor Price',
    'Good morning. What can I do for you today?',
    null,
    '[]'::jsonb,
    null,
    'describe-main-symptoms',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'describe-main-symptoms', 2, 'input', 'Dr. Eleanor Price',
    'Describe your main symptoms.',
    'Скажіть, що вже приблизно тиждень у вас кашель, ви швидко втомлюєтеся і час від часу болить голова.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I''ve had a cough for about a week, I''ve been feeling very tired, and I''ve also had headaches from time to time.",
        "I''ve been coughing for around a week, and I feel tired quite easily. I also get headaches occasionally.",
        "For the past week I''ve had a cough, a lot of tiredness and occasional headaches."
      ]
    }'::jsonb,
    'doctor-duration',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви назвали симптоми та їх тривалість.",
      "feedbackIncorrect":"Назвіть кашель, втому, головний біль і скажіть, що це триває близько тижня."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"describe symptoms and duration",
      "grammar":["present perfect","for"]
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-duration', 3, 'dialogue', 'Dr. Eleanor Price',
    'Has it been about the same all week, or have your symptoms changed recently?',
    null,
    '[]'::jsonb,
    null,
    'describe-change',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'describe-change', 4, 'input', 'Dr. Eleanor Price',
    'Explain how your condition has changed.',
    'Поясніть, що спочатку кашель був легким, але протягом останніх двох днів він став сильнішим і ви почали більше втомлюватися.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "At first the cough was quite mild, but over the last two days it''s been getting worse and I''ve started feeling more tired.",
        "It started as a mild cough, but it has become worse during the last two days and I''ve been much more tired.",
        "The cough wasn''t too bad at first, but it''s got worse recently and I feel more exhausted than before."
      ]
    }'::jsonb,
    'doctor-fever',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви описали зміну стану в часі.",
      "feedbackIncorrect":"Порівняйте початок хвороби з останніми двома днями."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"describe changing symptoms",
      "grammar":["present perfect continuous","comparatives"]
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-fever', 5, 'dialogue', 'Dr. Eleanor Price',
    'Have you had a high temperature, chest pain or any difficulty breathing?',
    null,
    '[]'::jsonb,
    null,
    'answer-red-flags',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"concerned"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'answer-red-flags', 6, 'choice', 'Dr. Eleanor Price',
    'Choose the answer that matches your symptoms.',
    'У вас не було високої температури, болю в грудях або проблем із диханням.',
    '[
      {
        "id":"good",
        "text":"No, I haven''t had a high temperature or chest pain, and my breathing has been normal.",
        "value":"good"
      },
      {
        "id":"wrong",
        "text":"Yes, I can''t breathe at all.",
        "value":"wrong"
      },
      {
        "id":"irrelevant",
        "text":"I missed my train yesterday.",
        "value":"irrelevant"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'doctor-daily-impact',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви чітко відповіли на кілька уточнювальних запитань.",
      "feedbackIncorrect":"За сценарієм у вас немає високої температури, болю в грудях або проблем із диханням."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"answer medical clarification questions"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-daily-impact', 7, 'dialogue', 'Dr. Eleanor Price',
    'How is this affecting your normal routine? Are you still able to work and sleep normally?',
    null,
    '[]'::jsonb,
    null,
    'describe-impact',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'describe-impact', 8, 'input', 'Dr. Eleanor Price',
    'Explain how the symptoms affect your daily life.',
    'Скажіть, що ви все ще можете працювати, але вам важко концентруватися, а кашель іноді будить вас уночі.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I can still work, but it''s harder to concentrate because I feel tired, and the cough sometimes wakes me up at night.",
        "I''m still going to work, but I find it difficult to focus and I sometimes wake up during the night because of the cough.",
        "I can work, although concentrating is more difficult, and the cough has been disturbing my sleep."
      ]
    }'::jsonb,
    'doctor-assessment',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви пояснили не лише симптоми, а й їхній вплив на життя.",
      "feedbackIncorrect":"Згадайте роботу, концентрацію та сон."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"explain impact on daily life"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-assessment', 9, 'dialogue', 'Dr. Eleanor Price',
    'From what you''ve told me, this sounds like a viral respiratory infection. At the moment I don''t hear anything worrying in your chest.',
    null,
    '[]'::jsonb,
    null,
    'clarify-meaning',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"encouraging"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'clarify-meaning', 10, 'input', 'Dr. Eleanor Price',
    'Clarify what the doctor means.',
    'Уточніть, чи це означає, що зараз антибіотики не потрібні.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Do you mean that I don''t need antibiotics at the moment?",
        "So does that mean antibiotics aren''t necessary right now?",
        "Just to make sure I understand, you don''t think I need antibiotics?"
      ]
    }'::jsonb,
    'doctor-treatment',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви перевірили, чи правильно зрозуміли рекомендацію.",
      "feedbackIncorrect":"Уточніть, чи потрібні зараз antibiotics."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"clarify medical advice"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-treatment', 11, 'dialogue', 'Dr. Eleanor Price',
    'That''s right. Antibiotics wouldn''t help with a viral infection. I''d recommend resting, drinking plenty of fluids and taking paracetamol if you need it for the headache.',
    null,
    '[]'::jsonb,
    null,
    'ask-work',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'ask-work', 12, 'input', 'Dr. Eleanor Price',
    'Ask whether you should keep working.',
    'Запитайте, чи можете ви продовжувати працювати, чи краще взяти кілька днів відпочинку.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Should I continue working, or would it be better to take a couple of days off and rest?",
        "Do you think I can keep working, or should I stay home for a few days?",
        "Would you recommend going to work, or should I take some time off to recover?"
      ]
    }'::jsonb,
    'doctor-rest',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви попросили практичну рекомендацію щодо відновлення.",
      "feedbackIncorrect":"Запитайте, чи слід продовжувати працювати або взяти кілька днів відпочинку."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"ask for practical advice"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'doctor-rest', 13, 'dialogue', 'Dr. Eleanor Price',
    'If you can, I''d take two or three days off. Rest properly, drink plenty of water, and come back if you develop a high temperature, chest pain, breathing problems, or if the cough gets significantly worse.',
    null,
    '[]'::jsonb,
    null,
    'confirm-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "emotion":"encouraging"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'confirm-plan', 14, 'input', 'Dr. Eleanor Price',
    'Summarise the doctor''s advice.',
    'Підтвердьте, що ви відпочинете 2–3 дні, будете пити більше рідини та повернетеся, якщо симптоми значно погіршаться.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Okay, so I should rest for two or three days, drink plenty of fluids, and come back if the symptoms get much worse.",
        "Right. I''ll take a few days off, drink plenty of water, and contact you again if I develop any of those symptoms.",
        "So the plan is to rest for a couple of days, keep drinking fluids, and come back if the cough or other symptoms get significantly worse."
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви правильно підсумували план і перевірили своє розуміння.",
      "feedbackIncorrect":"Підсумуйте три речі: відпочинок, рідина та повернення до лікаря при погіршенні."
    }'::jsonb,
    '{
      "npcId":"london-independence-at-the-doctor-eleanor",
      "role":"GP",
      "goal":"summarise advice"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Прийом завершено! Ви описали симптоми та їх тривалість, пояснили, як стан змінювався і впливав на ваше життя, уточнили рекомендації лікаря та правильно підсумували план відновлення.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"At the Doctor completed",
      "learnedWords":[
        "symptoms",
        "cough",
        "headache",
        "get worse",
        "difficulty breathing",
        "affect",
        "viral infection",
        "antibiotics",
        "take time off",
        "recover",
        "plenty of fluids"
      ]
    }'::jsonb
  );

end $$;