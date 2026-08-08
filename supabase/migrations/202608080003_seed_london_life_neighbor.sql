-- =========================================================
-- TalkHero London Life
-- Mission #2: Meeting a Neighbor
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
    'meeting-a-neighbor',
    'Meeting a Neighbor',
    'Познайомтеся із сусідом, розкажіть трохи про себе та дізнайтеся корисну інформацію про будинок.',
    'conversation',
    'A2',
    1,
    10,
    85,
    30,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Знайомство із сусідом",
        "objectives": [
          "представитися новому сусідові",
          "сказати, звідки ви приїхали",
          "розповісти, як давно ви живете в будинку",
          "запитати про найближчий супермаркет",
          "ввічливо завершити розмову"
        ]
      },
      "location": "apartment-building"
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
    'Meeting Your Neighbor',
    'Познайомтеся з новим сусідом у вашому будинку.',
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
    'Ви щойно повернулися до своєї нової квартири. У коридорі ви зустрічаєте сусіда з квартири навпроти.',
    null,
    '[]'::jsonb,
    null,
    'neighbor-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🙂",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'neighbor-greeting',
    1,
    'dialogue',
    'Daniel',
    'Hi! I don''t think we''ve met before. I''m Daniel. I live across the hall.',
    null,
    '[]'::jsonb,
    null,
    'introduce-yourself',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'introduce-yourself',
    2,
    'choice',
    'Daniel',
    'Introduce yourself politely.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "intro",
        "text": "Nice to meet you. I''m your new neighbor.",
        "value": "intro"
      },
      {
        "id": "coffee",
        "text": "I would like a coffee, please.",
        "value": "coffee"
      },
      {
        "id": "station",
        "text": "Which platform is it?",
        "value": "station"
      }
    ]'::jsonb,
    '{
      "optionId": "intro"
    }'::jsonb,
    'welcome',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Це природне й ввічливе знайомство.",
      "feedbackIncorrect": "Оберіть фразу, якою ви представляєтеся сусідові."
    }'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "goal": "introduce yourself"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'welcome',
    3,
    'dialogue',
    'Daniel',
    'Nice to meet you too! Welcome to the building. Where are you from?',
    null,
    '[]'::jsonb,
    null,
    'country-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "emotion": "curious"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'country-input',
    4,
    'input',
    'Daniel',
    'Tell Daniel that you are from Ukraine.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''m from Ukraine.",
        "I am from Ukraine.",
        "I''m from Ukraine",
        "I am from Ukraine"
      ]
    }'::jsonb,
    'london-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко сказали, звідки ви.",
      "feedbackIncorrect": "Спробуйте: I''m from Ukraine."
    }'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "goal": "say where you are from"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'london-question',
    5,
    'dialogue',
    'Daniel',
    'Oh, nice! How long have you been in London?',
    null,
    '[]'::jsonb,
    null,
    'duration-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'duration-input',
    6,
    'input',
    'Daniel',
    'Say that you have been in London for one week.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''ve been in London for one week.",
        "I have been in London for one week.",
        "I''ve been here for one week.",
        "I have been here for one week."
      ]
    }'::jsonb,
    'building-info',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно використали for one week.",
      "feedbackIncorrect": "Спробуйте: I''ve been in London for one week."
    }'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "goal": "talk about duration"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'building-info',
    7,
    'dialogue',
    'Daniel',
    'If you need anything, just let me know. The people in this building are quite friendly.',
    null,
    '[]'::jsonb,
    null,
    'supermarket-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "emotion": "helpful"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'supermarket-question',
    8,
    'translate',
    null,
    'Де знаходиться найближчий супермаркет?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Where is the nearest supermarket?",
        "Where''s the nearest supermarket?",
        "Where is the closest supermarket?",
        "Where''s the closest supermarket?"
      ]
    }'::jsonb,
    'supermarket-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Це дуже корисне запитання після переїзду.",
      "feedbackIncorrect": "Спробуйте: Where is the nearest supermarket?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🙂",
      "goal": "ask for local information"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'supermarket-answer',
    9,
    'dialogue',
    'Daniel',
    'There''s a supermarket at the end of this street, next to the pharmacy.',
    null,
    '[]'::jsonb,
    null,
    'distance-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'distance-question',
    10,
    'choice',
    'Daniel',
    'You want to know if the supermarket is far away.',
    'Що варто запитати?',
    '[
      {
        "id": "far",
        "text": "Is it far from here?",
        "value": "far"
      },
      {
        "id": "rent",
        "text": "How much is the rent?",
        "value": "rent"
      },
      {
        "id": "medicine",
        "text": "Do I need a prescription?",
        "value": "medicine"
      }
    ]'::jsonb,
    '{
      "optionId": "far"
    }'::jsonb,
    'distance-answer',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Це природне запитання про відстань.",
      "feedbackIncorrect": "Оберіть фразу Is it far from here?"
    }'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "goal": "ask about distance"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'distance-answer',
    11,
    'dialogue',
    'Daniel',
    'Not at all. It''s about a five-minute walk.',
    null,
    '[]'::jsonb,
    null,
    'thanks-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "emotion": "helpful"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'thanks-input',
    12,
    'input',
    'Daniel',
    'Thank Daniel for the information.',
    'Напишіть коротку ввічливу відповідь.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Thanks for the information.",
        "Thank you for the information.",
        "Thanks, that''s really helpful.",
        "Thank you, that''s really helpful."
      ]
    }'::jsonb,
    'invitation',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ввічливо й природно.",
      "feedbackIncorrect": "Спробуйте: Thanks for the information."
    }'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "goal": "thank someone"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'invitation',
    13,
    'dialogue',
    'Daniel',
    'A few neighbors are having coffee downstairs on Saturday. You''re welcome to join us.',
    null,
    '[]'::jsonb,
    null,
    'accept-invitation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'accept-invitation',
    14,
    'choice',
    'Daniel',
    'Accept the invitation politely.',
    'Оберіть відповідь.',
    '[
      {
        "id": "accept",
        "text": "That sounds great. Thank you!",
        "value": "accept"
      },
      {
        "id": "ticket",
        "text": "I need a return ticket.",
        "value": "ticket"
      },
      {
        "id": "bill",
        "text": "Could I have the bill, please?",
        "value": "bill"
      }
    ]'::jsonb,
    '{
      "optionId": "accept"
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви ввічливо прийняли запрошення.",
      "feedbackIncorrect": "Оберіть відповідь, яка приймає запрошення."
    }'::jsonb,
    '{
      "role": "Neighbor",
      "avatar": "👋",
      "goal": "accept an invitation"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви познайомилися із сусідом, розповіли про себе та дізналися корисну інформацію про район.',
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
        "neighbor",
        "across the hall",
        "nearest",
        "five-minute walk",
        "helpful",
        "join us"
      ]
    }'::jsonb
  );

end $$;