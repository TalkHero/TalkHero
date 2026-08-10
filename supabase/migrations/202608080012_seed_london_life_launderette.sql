-- =========================================================
-- TalkHero London Life
-- Mission #11: At the Launderette
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
    'at-the-launderette',
    'At the Launderette',
    'Виперіть одяг у пральні самообслуговування: оберіть машину, уточніть оплату та правильно використайте сушарку.',
    'conversation',
    'A2',
    10,
    11,
    130,
    55,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Прання у пральні самообслуговування",
        "objectives": [
          "запитати, яка пральна машина вільна",
          "уточнити вартість одного прання",
          "дізнатися, куди додавати пральний засіб",
          "запитати, скільки триває цикл",
          "правильно скористатися сушаркою"
        ]
      },
      "location": "launderette"
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
    'Doing the Laundry',
    'Поговоріть із працівницею пральні та виперіть і висушіть свій одяг.',
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
    'У вас накопичилося багато одягу для прання. Ви заходите до місцевої пральні самообслуговування.',
    null,
    '[]'::jsonb,
    null,
    'assistant-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🧺",
      "emotion": "encouraging"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'assistant-greeting',
    1,
    'dialogue',
    'Maya',
    'Hi there. Do you need any help with the machines?',
    null,
    '[]'::jsonb,
    null,
    'ask-machine',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺",
      "emotion": "friendly"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'ask-machine',
    2,
    'choice',
    'Maya',
    'Ask which washing machine is available.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "machine",
        "text": "Which washing machine is available?",
        "value": "machine"
      },
      {
        "id": "account",
        "text": "Which bank account is available?",
        "value": "account"
      },
      {
        "id": "doctor",
        "text": "Which doctor is available?",
        "value": "doctor"
      }
    ]'::jsonb,
    '{
      "optionId": "machine"
    }'::jsonb,
    'machine-info',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви правильно запитали про вільну пральну машину.",
      "feedbackIncorrect": "Оберіть запитання про washing machine."
    }'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'machine-info',
    3,
    'dialogue',
    'Maya',
    'Machine number six is free. It can take up to eight kilograms.',
    null,
    '[]'::jsonb,
    null,
    'price-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-question',
    4,
    'input',
    'Maya',
    'Ask how much one wash costs.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How much does one wash cost?",
        "How much is one wash?",
        "How much does a wash cost?",
        "How much does it cost to use the washing machine?"
      ]
    }'::jsonb,
    'price-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви правильно запитали про вартість прання.",
      "feedbackIncorrect": "Спробуйте: How much does one wash cost?"
    }'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'price-answer',
    5,
    'dialogue',
    'Maya',
    'It''s five pounds for a standard wash. You can pay by card on the machine.',
    null,
    '[]'::jsonb,
    null,
    'detergent-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'detergent-question',
    6,
    'translate',
    null,
    'Куди мені додати пральний засіб?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Where should I put the detergent?",
        "Where do I put the detergent?",
        "Where should the detergent go?"
      ]
    }'::jsonb,
    'detergent-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви запитали, куди додавати пральний засіб.",
      "feedbackIncorrect": "Спробуйте: Where should I put the detergent?"
    }'::jsonb,
    '{
      "role": "Ваш наставник",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'detergent-answer',
    7,
    'dialogue',
    'Maya',
    'Put it in the compartment marked number two. Fabric softener goes in the smaller compartment.',
    null,
    '[]'::jsonb,
    null,
    'cycle-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'cycle-question',
    8,
    'input',
    'Maya',
    'Ask how long the wash cycle takes.',
    'Напишіть запитання англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "How long does the wash cycle take?",
        "How long does the washing cycle take?",
        "How long will the wash take?",
        "How long does it take?"
      ]
    }'::jsonb,
    'cycle-answer',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Ви правильно запитали про тривалість прання.",
      "feedbackIncorrect": "Спробуйте: How long does the wash cycle take?"
    }'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'cycle-answer',
    9,
    'dialogue',
    'Maya',
    'The standard programme takes about forty minutes.',
    null,
    '[]'::jsonb,
    null,
    'dryer-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'dryer-choice',
    10,
    'choice',
    'Maya',
    'Your washing is finished. Say that you would like to use a dryer.',
    'Оберіть відповідь.',
    '[
      {
        "id": "dryer",
        "text": "I''d like to use a dryer now, please.",
        "value": "dryer"
      },
      {
        "id": "bank",
        "text": "I''d like to open a bank account.",
        "value": "bank"
      },
      {
        "id": "medicine",
        "text": "I''d like some medicine, please.",
        "value": "medicine"
      }
    ]'::jsonb,
    '{
      "optionId": "dryer"
    }'::jsonb,
    'dryer-info',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви попросили скористатися сушаркою.",
      "feedbackIncorrect": "Оберіть фразу про dryer."
    }'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'dryer-info',
    11,
    'dialogue',
    'Maya',
    'Dryer number three is available. Ten minutes costs two pounds.',
    null,
    '[]'::jsonb,
    null,
    'dryer-time',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'dryer-time',
    12,
    'input',
    'Maya',
    'Say that you would like twenty minutes.',
    'Напишіть відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''d like twenty minutes, please.",
        "I would like twenty minutes, please.",
        "Twenty minutes, please.",
        "I''ll take twenty minutes."
      ]
    }'::jsonb,
    'dryer-warning',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви обрали час сушіння.",
      "feedbackIncorrect": "Спробуйте: I''d like twenty minutes, please."
    }'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'dryer-warning',
    13,
    'dialogue',
    'Maya',
    'No problem. Just check that there are no delicate clothes that shouldn''t go in the dryer.',
    null,
    '[]'::jsonb,
    null,
    'final-thanks',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'final-thanks',
    14,
    'choice',
    'Maya',
    'Thank Maya for her help.',
    'Оберіть відповідь.',
    '[
      {
        "id": "thanks",
        "text": "Thanks for your help. I know what to do now.",
        "value": "thanks"
      },
      {
        "id": "doctor",
        "text": "Can I see a doctor now?",
        "value": "doctor"
      },
      {
        "id": "rent",
        "text": "How much is the rent?",
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
      "feedbackIncorrect": "Оберіть відповідь, яка дякує за допомогу."
    }'::jsonb,
    '{
      "role": "Launderette Assistant",
      "avatar": "🧺"
    }'::jsonb
  ),

  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви успішно скористалися пральною машиною та сушаркою у пральні самообслуговування.',
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
        "launderette",
        "washing machine",
        "wash",
        "detergent",
        "fabric softener",
        "wash cycle",
        "dryer",
        "delicate clothes"
      ]
    }'::jsonb
  );

end $$;