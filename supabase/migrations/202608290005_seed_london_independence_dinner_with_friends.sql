-- =========================================================
-- TalkHero London Independence — B1
-- Mission #5: Dinner with Friends
-- NPC: Leo — Friend
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
    'dinner-with-friends',
    'Dinner with Friends',
    'Проведіть вечір із друзями: підтримуйте розмову, розкажіть про свій досвід у Лондоні та висловіть власну думку.',
    'conversation',
    'B1',
    4,
    15,
    160,
    65,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Вечеря з друзями",
        "objectives":[
          "підтримувати неформальну розмову",
          "розповісти про минулий досвід",
          "описати зміни у своєму житті",
          "висловити та пояснити власну думку",
          "ставити природні зустрічні запитання"
        ]
      },
      "location":"friends-flat"
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
    'A Night with Friends',
    'Підтримуйте природну розмову з Leo під час вечері.',
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

  -- 0
  (
    quest_uuid, act_uuid, 'arrival', 0, 'narration', null,
    'Суботній вечір. Leo запросив вас на невелику вечерю у своїй квартирі. Ви вже трохи освоїлися в Лондоні, тому сьогодні спробуєте більше говорити англійською без підготовлених фраз.',
    null, '[]'::jsonb, null, 'leo-welcome',
    '{}'::jsonb, '{}'::jsonb,
    '{"location":"Friends Flat","emotion":"happy"}'::jsonb
  ),

  -- 1
  (
    quest_uuid, act_uuid, 'leo-welcome', 1, 'dialogue', 'Leo',
    'Hey! You made it. Come in! How''s your week been?',
    null, '[]'::jsonb, null, 'week-response',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 2
  (
    quest_uuid, act_uuid, 'week-response', 2, 'input', 'Leo',
    'Tell Leo about your week.',
    'Дайте природну відповідь із двома деталями: як минув тиждень і чим ви займалися.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "It''s been pretty good. I was quite busy at work, but I managed to explore a bit of London after work.",
        "It was a busy week, but a good one. I had a lot to do at work and met some new people.",
        "Pretty good, thanks. Work was busy, but I had some time to explore the city as well."
      ]
    }'::jsonb,
    'leo-london-question',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви дали розгорнуту відповідь замість короткого good або fine.",
      "feedbackIncorrect":"Розкажіть щонайменше дві речі: яким був тиждень і що ви робили."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"maintain informal conversation"
    }'::jsonb
  ),

  -- 3
  (
    quest_uuid, act_uuid, 'leo-london-question', 3, 'dialogue', 'Leo',
    'Sounds like you''re settling in. What''s been the biggest surprise about living in London so far?',
    null, '[]'::jsonb, null, 'london-surprise',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4
  (
    quest_uuid, act_uuid, 'london-surprise', 4, 'input', 'Leo',
    'Describe something that surprised you.',
    'Назвіть одну річ, яка вас здивувала, і поясніть чому.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I was surprised by how multicultural the city is. You can meet people from all over the world.",
        "The biggest surprise has been how busy everything is. Even late in the evening there are people everywhere.",
        "I didn''t expect public transport to be so important. I use it almost every day now."
      ]
    }'::jsonb,
    'leo-before-london',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви висловили спостереження та пояснили його.",
      "feedbackIncorrect":"Назвіть конкретну річ і додайте причину або приклад."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"describe an experience"
    }'::jsonb
  ),

  -- 5
  (
    quest_uuid, act_uuid, 'leo-before-london', 5, 'dialogue', 'Leo',
    'I remember feeling the same when I first moved here. Is your life very different from what it was before you came to London?',
    null, '[]'::jsonb, null, 'compare-life',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6
  (
    quest_uuid, act_uuid, 'compare-life', 6, 'input', 'Leo',
    'Compare your life now with your life before.',
    'Опишіть щонайменше одну зміну у своєму житті.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Yes, it''s quite different. I used to drive everywhere, but now I usually take the Underground.",
        "Definitely. Before I moved here, I spent much more time with people I already knew, but now I''m meeting new people all the time.",
        "My routine has changed a lot. I used to have more free time, but now I''m much busier during the week."
      ]
    }'::jsonb,
    'dinner-topic',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви порівняли минуле й теперішнє.",
      "feedbackIncorrect":"Спробуйте порівняти життя зараз із життям раніше. Корисна конструкція: I used to..."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"compare past and present",
      "grammar":["used to","past vs present"]
    }'::jsonb
  ),

  -- 7
  (
    quest_uuid, act_uuid, 'dinner-topic', 7, 'dialogue', 'Leo',
    'You know what I love about London? There''s always something happening. Although sometimes I think living here is just too expensive.',
    null, '[]'::jsonb, null, 'opinion-choice',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 8
  (
    quest_uuid, act_uuid, 'opinion-choice', 8, 'choice', 'Leo',
    'Respond naturally to Leo''s opinion.',
    'Оберіть відповідь, яка підтримує справжню розмову.',
    '[
      {
        "id":"good",
        "text":"I know what you mean. It''s expensive, but I think the opportunities and things to do make up for it.",
        "value":"good"
      },
      {
        "id":"weak",
        "text":"London is a city.",
        "value":"weak"
      },
      {
        "id":"rude",
        "text":"You''re completely wrong.",
        "value":"rude"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'leo-challenges',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Саме так. Ви відреагували на думку співрозмовника і додали власну.",
      "feedbackIncorrect":"Хороша соціальна відповідь має реагувати на сказане Leo та розвивати тему."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"respond to an opinion"
    }'::jsonb
  ),

  -- 9
  (
    quest_uuid, act_uuid, 'leo-challenges', 9, 'dialogue', 'Leo',
    'True. But if you had the choice, would you rather live in the centre or somewhere quieter outside London?',
    null, '[]'::jsonb, null, 'justify-preference',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 10
  (
    quest_uuid, act_uuid, 'justify-preference', 10, 'input', 'Leo',
    'Give your preference and explain it.',
    'Оберіть один варіант та наведіть щонайменше одну причину.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I''d rather live somewhere quieter because I like having more space, even if the commute is longer.",
        "I''d prefer to live in the centre because everything is close and I wouldn''t need to travel as much.",
        "I think I''d choose somewhere outside the centre. It would probably be cheaper and less stressful."
      ]
    }'::jsonb,
    'leo-weekend',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви висловили перевагу та обґрунтували її.",
      "feedbackIncorrect":"Скажіть, який варіант ви обираєте, і поясніть чому."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"express and justify an opinion",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 11
  (
    quest_uuid, act_uuid, 'leo-weekend', 11, 'dialogue', 'Leo',
    'Fair enough! Anyway, I''m thinking about doing something next weekend. I haven''t decided what yet.',
    null, '[]'::jsonb, null, 'ask-follow-up',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 12
  (
    quest_uuid, act_uuid, 'ask-follow-up', 12, 'input', 'Leo',
    'Keep the conversation going.',
    'Поставте Leo природне зустрічне запитання про його плани.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "What kind of thing are you thinking of doing?",
        "Have you got any ideas about where you''d like to go?",
        "Are you thinking of staying in London or going somewhere else?"
      ]
    }'::jsonb,
    'leo-trip-idea',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви не чекали наступного питання, а самі підтримали розмову.",
      "feedbackIncorrect":"Поставте Leo запитання про його плани на наступні вихідні."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"ask a follow-up question"
    }'::jsonb
  ),

  -- 13
  (
    quest_uuid, act_uuid, 'leo-trip-idea', 13, 'dialogue', 'Leo',
    'Maybe somewhere outside London. Brighton, Oxford... something like that. Actually, you should come with us!',
    null, '[]'::jsonb, null, 'respond-invitation',
    '{}'::jsonb, '{}'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "emotion":"excited"
    }'::jsonb
  ),

  -- 14
  (
    quest_uuid, act_uuid, 'respond-invitation', 14, 'choice', 'Leo',
    'Respond naturally to the invitation.',
    'Прийміть запрошення та покажіть зацікавленість.',
    '[
      {
        "id":"good",
        "text":"That sounds great! I''d love to come. Let me know when you decide where you''re going.",
        "value":"good"
      },
      {
        "id":"weak",
        "text":"Maybe.",
        "value":"weak"
      },
      {
        "id":"wrong",
        "text":"I need to return these headphones.",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Це природна реакція на дружнє запрошення.",
      "feedbackIncorrect":"Покажіть, що вам цікава пропозиція, та природно продовжте тему."
    }'::jsonb,
    '{
      "npcId":"london-independence-dinner-with-friends-leo",
      "role":"Friend",
      "goal":"respond to an invitation"
    }'::jsonb
  ),

  -- 15
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Чудовий вечір! Ви підтримували неформальну розмову, говорили про свій досвід, порівнювали минуле й теперішнє, аргументували власну думку та самостійно ставили зустрічні запитання.',
    null, '[]'::jsonb, null, null,
    '{}'::jsonb, '{}'::jsonb,
    '{
      "summary":"Dinner with Friends completed",
      "learnedWords":[
        "settle in",
        "so far",
        "used to",
        "I know what you mean",
        "make up for",
        "I''d rather",
        "fair enough",
        "come with us"
      ]
    }'::jsonb
  );

end $$;