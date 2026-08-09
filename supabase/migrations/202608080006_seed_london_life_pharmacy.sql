-- =========================================================
-- TalkHero London Life
-- Mission #5: At the Pharmacy
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
    'at-the-pharmacy',
    'At the Pharmacy',
    'Поясніть симптоми, попросіть відповідні ліки та уточніть, як їх приймати.',
    'conversation',
    'A2',
    4,
    10,
    100,
    40,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Візит до аптеки",
        "objectives": [
          "пояснити свої симптоми",
          "сказати, як давно ви погано почуваєтеся",
          "попросити ліки",
          "уточнити дозування",
          "запитати про побічні ефекти"
        ]
      },
      "location": "pharmacy"
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
    'Talking to the Pharmacist',
    'Опишіть симптоми та дізнайтеся, як правильно приймати ліки.',
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
    'Ви зайшли до аптеки. Від ранку у вас болить горло й трохи болить голова.',
    null,
    '[]'::jsonb,
    null,
    'pharmacist-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "💊",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'pharmacist-greeting',
    1,
    'dialogue',
    'Olivia',
    'Hello. How can I help you?',
    null,
    '[]'::jsonb,
    null,
    'symptoms-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'symptoms-choice',
    2,
    'choice',
    'Olivia',
    'Explain what is wrong.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "symptoms",
        "text": "I have a sore throat and a headache.",
        "value": "symptoms"
      },
      {
        "id": "train",
        "text": "I need a ticket to Oxford.",
        "value": "train"
      },
      {
        "id": "rent",
        "text": "I''m looking for a flat.",
        "value": "rent"
      }
    ]'::jsonb,
    '{
      "optionId": "symptoms"
    }'::jsonb,
    'duration-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко описали свої симптоми.",
      "feedbackIncorrect": "Оберіть фразу про біль у горлі та головний біль."
    }'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'duration-question',
    3,
    'dialogue',
    'Olivia',
    'I see. How long have you had these symptoms?',
    null,
    '[]'::jsonb,
    null,
    'duration-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'duration-input',
    4,
    'input',
    'Olivia',
    'Say that you have felt like this since this morning.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''ve felt like this since this morning.",
        "I have felt like this since this morning.",
        "I''ve had these symptoms since this morning.",
        "I have had these symptoms since this morning."
      ]
    }'::jsonb,
    'fever-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно використали since this morning.",
      "feedbackIncorrect": "Спробуйте: I''ve had these symptoms since this morning."
    }'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊",
      "goal": "describe symptom duration"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'fever-question',
    5,
    'dialogue',
    'Olivia',
    'Do you have a fever or a cough?',
    null,
    '[]'::jsonb,
    null,
    'fever-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'fever-answer',
    6,
    'input',
    'Olivia',
    'Say that you do not have a fever, but you have a small cough.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I don''t have a fever, but I have a slight cough.",
        "I do not have a fever, but I have a slight cough.",
        "No fever, but I have a slight cough.",
        "I don''t have a fever, but I have a small cough."
      ]
    }'::jsonb,
    'medicine-offer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко описали додатковий симптом.",
      "feedbackIncorrect": "Спробуйте: I don''t have a fever, but I have a slight cough."
    }'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'medicine-offer',
    7,
    'dialogue',
    'Olivia',
    'I can recommend some throat lozenges and painkillers.',
    null,
    '[]'::jsonb,
    null,
    'medicine-request',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'medicine-request',
    8,
    'choice',
    'Olivia',
    'Ask for something for your sore throat.',
    'Оберіть природну фразу.',
    '[
      {
        "id": "medicine",
        "text": "Can I have something for my sore throat, please?",
        "value": "medicine"
      },
      {
        "id": "hotel",
        "text": "Can I check in early?",
        "value": "hotel"
      },
      {
        "id": "bus",
        "text": "Does this bus go to the centre?",
        "value": "bus"
      }
    ]'::jsonb,
    '{
      "optionId": "medicine"
    }'::jsonb,
    'dosage-info',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Це природне прохання в аптеці.",
      "feedbackIncorrect": "Оберіть фразу про ліки від болю в горлі."
    }'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'dosage-info',
    9,
    'dialogue',
    'Olivia',
    'Of course. Take one lozenge every three hours.',
    null,
    '[]'::jsonb,
    null,
    'dosage-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'dosage-question',
    10,
    'translate',
    null,
    'Як часто мені потрібно це приймати?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How often should I take this?",
        "How often do I need to take this?",
        "How often should I use this?"
      ]
    }'::jsonb,
    'side-effects',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Це важливе запитання про дозування.",
      "feedbackIncorrect": "Спробуйте: How often should I take this?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "💊",
      "goal": "ask about dosage"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'side-effects',
    11,
    'dialogue',
    'Olivia',
    'These lozenges are usually well tolerated. The painkillers may cause mild stomach discomfort.',
    null,
    '[]'::jsonb,
    null,
    'side-effect-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'side-effect-question',
    12,
    'input',
    'Olivia',
    'Ask whether there are any side effects.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Are there any side effects?",
        "Does this have any side effects?",
        "Are there any possible side effects?"
      ]
    }'::jsonb,
    'final-advice',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно запитали про побічні ефекти.",
      "feedbackIncorrect": "Спробуйте: Are there any side effects?"
    }'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-advice',
    13,
    'dialogue',
    'Olivia',
    'If you feel worse or your symptoms last more than a few days, you should see a doctor.',
    null,
    '[]'::jsonb,
    null,
    'thanks',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊",
      "emotion": "helpful"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'thanks',
    14,
    'choice',
    'Olivia',
    'Finish the conversation politely.',
    'Оберіть відповідь.',
    '[
      {
        "id": "thanks",
        "text": "Thank you for your help.",
        "value": "thanks"
      },
      {
        "id": "ticket",
        "text": "I need a return ticket.",
        "value": "ticket"
      },
      {
        "id": "rent",
        "text": "Is the rent negotiable?",
        "value": "rent"
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
      "feedbackIncorrect": "Оберіть Thank you for your help."
    }'::jsonb,
    '{
      "role": "Pharmacist",
      "avatar": "💊"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви описали симптоми, попросили ліки та уточнили дозування й можливі побічні ефекти.',
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
        "sore throat",
        "headache",
        "fever",
        "lozenge",
        "painkiller",
        "side effect"
      ]
    }'::jsonb
  );

end $$;