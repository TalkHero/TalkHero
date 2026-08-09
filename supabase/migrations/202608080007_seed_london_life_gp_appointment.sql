-- =========================================================
-- TalkHero London Life
-- Mission #6: Booking a GP Appointment
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
    'booking-a-gp-appointment',
    'Booking a GP Appointment',
    'Зателефонуйте до медичного центру, поясніть причину звернення та домовтеся про прийом у лікаря.',
    'conversation',
    'A2',
    5,
    10,
    105,
    40,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Запис до сімейного лікаря",
        "objectives": [
          "пояснити, що вам потрібен прийом у лікаря",
          "коротко описати причину звернення",
          "уточнити доступний час",
          "повідомити свої контактні дані",
          "підтвердити запис"
        ]
      },
      "location": "gp-surgery"
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
    'Calling the GP Surgery',
    'Зателефонуйте до медичного центру та домовтеся про прийом.',
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
    'Після візиту до аптеки вам порадили звернутися до лікаря. Ви телефонуєте до місцевого GP surgery.',
    null,
    '[]'::jsonb,
    null,
    'reception-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🩺",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'reception-greeting',
    1,
    'dialogue',
    'Sarah',
    'Good morning, Riverside Medical Centre. How can I help?',
    null,
    '[]'::jsonb,
    null,
    'request-appointment',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'request-appointment',
    2,
    'choice',
    'Sarah',
    'Tell the receptionist why you are calling.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "appointment",
        "text": "I''d like to book an appointment with a doctor.",
        "value": "appointment"
      },
      {
        "id": "hotel",
        "text": "I''d like to book a hotel room.",
        "value": "hotel"
      },
      {
        "id": "train",
        "text": "I need a ticket to Manchester.",
        "value": "train"
      }
    ]'::jsonb,
    '{
      "optionId": "appointment"
    }'::jsonb,
    'reason-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко пояснили мету дзвінка.",
      "feedbackIncorrect": "Оберіть фразу про запис до лікаря."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'reason-question',
    3,
    'dialogue',
    'Sarah',
    'Certainly. Can I ask what the appointment is for?',
    null,
    '[]'::jsonb,
    null,
    'reason-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'reason-input',
    4,
    'input',
    'Sarah',
    'Say that you have had a sore throat and a headache for two days.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''ve had a sore throat and a headache for two days.",
        "I have had a sore throat and a headache for two days.",
        "I''ve had a sore throat and headache for two days.",
        "I have had a sore throat and headache for two days."
      ]
    }'::jsonb,
    'urgent-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви коротко й зрозуміло описали проблему.",
      "feedbackIncorrect": "Спробуйте: I''ve had a sore throat and a headache for two days."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️",
      "goal": "describe the reason for appointment"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'urgent-question',
    5,
    'dialogue',
    'Sarah',
    'Are you having any difficulty breathing or any severe symptoms?',
    null,
    '[]'::jsonb,
    null,
    'urgent-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'urgent-answer',
    6,
    'input',
    'Sarah',
    'Say that you do not have any severe symptoms.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "No, I don''t have any severe symptoms.",
        "No, I do not have any severe symptoms.",
        "No, nothing severe.",
        "No, I don''t have any serious symptoms."
      ]
    }'::jsonb,
    'availability',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко відповіли на важливе запитання.",
      "feedbackIncorrect": "Спробуйте: No, I don''t have any severe symptoms."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'availability',
    7,
    'dialogue',
    'Sarah',
    'We have an appointment available tomorrow at 10:30 a.m. or 3:15 p.m.',
    null,
    '[]'::jsonb,
    null,
    'choose-time',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'choose-time',
    8,
    'choice',
    'Sarah',
    'Choose the morning appointment.',
    'Оберіть відповідь.',
    '[
      {
        "id": "morning",
        "text": "10:30 tomorrow morning works for me.",
        "value": "morning"
      },
      {
        "id": "restaurant",
        "text": "I''d like a table for two.",
        "value": "restaurant"
      },
      {
        "id": "bank",
        "text": "What is the exchange rate?",
        "value": "bank"
      }
    ]'::jsonb,
    '{
      "optionId": "morning"
    }'::jsonb,
    'details-request',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Ви чітко підтвердили зручний час.",
      "feedbackIncorrect": "Оберіть відповідь про 10:30 tomorrow morning."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'details-request',
    9,
    'dialogue',
    'Sarah',
    'Great. Can I take your full name, please?',
    null,
    '[]'::jsonb,
    null,
    'name-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'name-input',
    10,
    'input',
    'Sarah',
    'Give your name as Alex Petrenko.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "My name is Alex Petrenko.",
        "I''m Alex Petrenko.",
        "I am Alex Petrenko.",
        "Alex Petrenko."
      ]
    }'::jsonb,
    'phone-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви повідомили своє ім''я.",
      "feedbackIncorrect": "Спробуйте: My name is Alex Petrenko."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'phone-question',
    11,
    'dialogue',
    'Sarah',
    'And what is the best phone number to contact you on?',
    null,
    '[]'::jsonb,
    null,
    'phone-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'phone-input',
    12,
    'input',
    'Sarah',
    'Say that your number is 07123 456789.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "My number is 07123 456789.",
        "It''s 07123 456789.",
        "My phone number is 07123 456789.",
        "07123 456789."
      ]
    }'::jsonb,
    'confirmation',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно повідомили контактний номер.",
      "feedbackIncorrect": "Спробуйте: My number is 07123 456789."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'confirmation',
    13,
    'dialogue',
    'Sarah',
    'Thank you. You are booked for tomorrow at 10:30 a.m. with Dr Harris.',
    null,
    '[]'::jsonb,
    null,
    'final-confirmation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️",
      "emotion": "helpful"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-confirmation',
    14,
    'choice',
    'Sarah',
    'Confirm that you understand and thank the receptionist.',
    'Оберіть відповідь.',
    '[
      {
        "id": "confirm",
        "text": "Great, thank you very much.",
        "value": "confirm"
      },
      {
        "id": "coffee",
        "text": "Can I have a coffee, please?",
        "value": "coffee"
      },
      {
        "id": "taxi",
        "text": "Please take me to the airport.",
        "value": "taxi"
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
      "feedbackCorrect": "Чудово. Ви успішно завершили запис.",
      "feedbackIncorrect": "Оберіть фразу, яка підтверджує запис і дякує."
    }'::jsonb,
    '{
      "role": "Receptionist",
      "avatar": "☎️"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви зателефонували до GP surgery, пояснили причину звернення та успішно записалися на прийом.',
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
        "appointment",
        "GP surgery",
        "severe symptoms",
        "available",
        "contact number",
        "booked"
      ]
    }'::jsonb
  );

end $$;