-- =========================================================
-- TalkHero London Independence — B1
-- Mission #12: Making New Friends
-- NPC: Callum — Graphic Designer
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
    'making-new-friends',
    'Making New Friends',
    'Познайомтеся з новою людиною в Лондоні, підтримайте природну розмову та домовтеся зустрітися знову.',
    'conversation',
    'B1',
    11,
    15,
    230,
    100,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Нові знайомства в Лондоні",
        "objectives":[
          "самостійно почати розмову",
          "представитися",
          "поставити природне follow-up question",
          "розповісти про життя в Лондоні",
          "знайти спільний інтерес",
          "висловити власну думку",
          "відреагувати на запрошення",
          "домовитися про наступну зустріч"
        ]
      },
      "location":"london-pub"
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
    'A New Friend',
    'Почніть розмову з Callum і перетворіть випадкове знайомство на новий контакт.',
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
    'П’ятниця ввечері. Колега запросив вас на невелику зустріч у лондонському пабі, але ще не прийшов. Поруч стоїть чоловік приблизно вашого віку. Він теж чекає на когось і виглядає доброзичливо.',
    null,
    '[]'::jsonb,
    null,
    'start-conversation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Pub","emotion":"relaxed"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'start-conversation', 1, 'choice', 'Callum',
    'You decide to start the conversation.',
    'Оберіть найбільш природний спосіб почати розмову з незнайомою людиною.',
    '[
      {
        "id":"good",
        "text":"Hi. Are you here for the meetup as well?",
        "value":"good"
      },
      {
        "id":"strange",
        "text":"Hello. Tell me about yourself.",
        "value":"strange"
      },
      {
        "id":"too-personal",
        "text":"Hi. How much money do you make?",
        "value":"too-personal"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'callum-introduction',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Саме так. Контекстне питання — природний спосіб почати small talk.",
      "feedbackIncorrect":"Почніть із простого питання про ситуацію, в якій ви обоє перебуваєте."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"start a natural conversation"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-introduction', 2, 'dialogue', 'Callum',
    'Yeah, I am! I know a couple of people here, but not many. I''m Callum, by the way.',
    null,
    '[]'::jsonb,
    null,
    'introduce-yourself',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'introduce-yourself', 3, 'input', 'Callum',
    'Introduce yourself naturally.',
    'Представтеся, скажіть, що ви теж знаєте тут небагато людей, і що недавно переїхали до Лондона.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Nice to meet you, Callum. I''m new here too. I don''t know many people yet because I moved to London quite recently.",
        "Nice to meet you. I''m still quite new to London, so I don''t really know many people here either.",
        "I''m new here as well. I moved to London recently, so I''m still getting to know people."
      ]
    }'::jsonb,
    'callum-asks-london',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Представлення звучить природно й одразу дає Callum тему для продовження розмови.",
      "feedbackIncorrect":"Представтеся та скажіть, що недавно переїхали до Лондона і ще мало кого знаєте."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"introduce yourself and add context"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-asks-london', 4, 'dialogue', 'Callum',
    'Oh, really? How are you finding London so far?',
    null,
    '[]'::jsonb,
    null,
    'talk-about-london',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'talk-about-london', 5, 'input', 'Callum',
    'Share your experience and opinion.',
    'Скажіть, що вам подобається Лондон, бо тут завжди є чим зайнятися, але вам досі важко звикнути до транспорту та цін.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I really like it because there''s always something to do, but I''m still getting used to the transport and the prices.",
        "So far I''m enjoying it. There are loads of things to do, although I still find the transport and the cost of living difficult.",
        "I like living here because there''s so much going on, but I haven''t completely got used to the transport or the prices yet."
      ]
    }'::jsonb,
    'callum-agrees',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви поєднали позитивну думку з контрастом — дуже корисна B1 структура.",
      "feedbackIncorrect":"Скажіть, що London подобається через кількість можливостей, але transport і prices поки складні."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"express a balanced opinion"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-agrees', 6, 'dialogue', 'Callum',
    'Definitely. I''ve lived here for six years and the prices still shock me sometimes! What do you usually do at weekends?',
    null,
    '[]'::jsonb,
    null,
    'share-interests',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'share-interests', 7, 'input', 'Callum',
    'Talk about your interests.',
    'Скажіть, що на вихідних любите гуляти новими районами, фотографувати та іноді їздити за місто.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "At weekends I like exploring new parts of the city and taking photos. Sometimes I also go somewhere outside London for the day.",
        "I usually explore different neighbourhoods and do some photography. I also enjoy taking day trips outside London.",
        "I like walking around areas I haven''t seen before and taking photos, and sometimes I go out of London for a day trip."
      ]
    }'::jsonb,
    'callum-common-interest',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви дали достатньо деталей, щоб співрозмовник міг знайти спільну тему.",
      "feedbackIncorrect":"Згадайте exploring London, photography та occasional day trips."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"talk about hobbies naturally"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-common-interest', 8, 'dialogue', 'Callum',
    'No way, I''m into photography too. Mostly street photography. I sometimes spend Sunday mornings walking around East London with my camera.',
    null,
    '[]'::jsonb,
    null,
    'follow-up-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"excited"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'follow-up-question', 9, 'choice', 'Callum',
    'Keep the conversation going.',
    'Оберіть природне follow-up question.',
    '[
      {
        "id":"good",
        "text":"That sounds great. Do you have a favourite area for street photography?",
        "value":"good"
      },
      {
        "id":"change",
        "text":"Interesting. What time do you go to work?",
        "value":"change"
      },
      {
        "id":"dead-end",
        "text":"Okay.",
        "value":"dead-end"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'callum-shoreditch',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Follow-up question розвиває саме ту тему, яку щойно підняв співрозмовник.",
      "feedbackIncorrect":"Не змінюйте тему. Поставте питання про його photography."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"ask a relevant follow-up question"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-shoreditch', 10, 'dialogue', 'Callum',
    'Probably Shoreditch. There''s always something interesting happening there. Actually, a few of us are going there next Sunday morning to take photos.',
    null,
    '[]'::jsonb,
    null,
    'show-interest',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'show-interest', 11, 'input', 'Callum',
    'React and show interest.',
    'Скажіть, що це звучить цікаво, ви ще мало бували в Shoreditch і хотіли б краще дослідити цей район.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "That sounds really interesting. I haven''t spent much time in Shoreditch yet, and I''d love to explore the area properly.",
        "That sounds like fun. I''ve only been to Shoreditch a couple of times, so I''d like to see more of it.",
        "I''d definitely be interested. I don''t know Shoreditch very well yet, and I''ve been meaning to explore it."
      ]
    }'::jsonb,
    'callum-invites',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви показали інтерес і природно підготували ґрунт для запрошення.",
      "feedbackIncorrect":"Покажіть інтерес і скажіть, що хотіли б краще explore Shoreditch."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"show genuine interest"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-invites', 12, 'dialogue', 'Callum',
    'You should come with us! We''re meeting outside Shoreditch High Street station at about ten.',
    null,
    '[]'::jsonb,
    null,
    'accept-invitation',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"excited"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'accept-invitation', 13, 'input', 'Callum',
    'Accept the invitation and clarify the plan.',
    'Прийміть запрошення та уточніть, чи йдеться про наступну неділю о 10:00 біля Shoreditch High Street station.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I''d love to. Just to check, you mean next Sunday at ten outside Shoreditch High Street station?",
        "That would be great. So it''s next Sunday at 10 outside Shoreditch High Street station, right?",
        "Sounds good! Just to confirm, we''re talking about next Sunday at ten at Shoreditch High Street station?"
      ]
    }'::jsonb,
    'callum-confirms',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви прийняли запрошення та перевірили ключові деталі.",
      "feedbackIncorrect":"Прийміть invitation і підтвердьте Sunday + 10:00 + Shoreditch High Street station."
    }'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "goal":"accept and clarify an invitation"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'callum-confirms', 14, 'dialogue', 'Callum',
    'Exactly. Here, let''s exchange numbers and I''ll add you to the group chat. I''ll message you if anything changes.',
    null,
    '[]'::jsonb,
    null,
    'complete',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-making-new-friends-callum",
      "role":"Graphic Designer",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Нове знайомство! Ви самостійно почали розмову, представилися, розповіли про життя в Лондоні, знайшли спільний інтерес, ставили доречні follow-up questions і домовилися про наступну зустріч.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Making New Friends completed",
      "learnedWords":[
        "meetup",
        "get to know people",
        "How are you finding...?",
        "get used to",
        "cost of living",
        "explore",
        "day trip",
        "be into something",
        "street photography",
        "I''d love to",
        "Just to check",
        "exchange numbers",
        "group chat"
      ]
    }'::jsonb
  );

end $$;