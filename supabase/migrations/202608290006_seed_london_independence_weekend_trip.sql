-- =========================================================
-- TalkHero London Independence — B1
-- Mission #6: Planning a Weekend Trip
-- NPC: Megan — Friend
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
    'planning-a-weekend-trip',
    'Planning a Weekend Trip',
    'Сплануйте поїздку на вихідні: запропонуйте напрямок, порівняйте варіанти, врахуйте бюджет і домовтеся про остаточний план.',
    'conversation',
    'B1',
    5,
    15,
    170,
    70,
    'published',
    '{
      "version":1,
      "sceneCount":16
    }'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Плануємо вихідні за межами Лондона",
        "objectives":[
          "запропонувати ідею для поїздки",
          "порівняти два варіанти",
          "обговорити переваги та недоліки",
          "ввічливо не погодитися",
          "врахувати бюджет та час",
          "запропонувати компроміс",
          "підтвердити остаточний план"
        ]
      },
      "location":"cafe"
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
    'Where Should We Go?',
    'Разом із Megan сплануйте поїздку на вихідні.',
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
    quest_uuid, act_uuid, 'cafe-start', 0, 'narration', null,
    'П’ятниця після роботи. Ви зустрілися з Megan у кафе. Наступні вихідні вільні, і ви вирішили кудись поїхати з Лондона на два дні.',
    null,
    '[]'::jsonb,
    null,
    'megan-opens',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Cafe","emotion":"happy"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'megan-opens', 1, 'dialogue', 'Megan',
    'We definitely need to get out of London next weekend. Any ideas where we could go?',
    null,
    '[]'::jsonb,
    null,
    'suggest-destination',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"excited"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'suggest-destination', 2, 'input', 'Megan',
    'Suggest a destination and give a reason.',
    'Запропонуйте Brighton і поясніть, чому це хороший варіант.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "How about Brighton? It''s not too far from London and we could spend some time by the sea.",
        "We could go to Brighton. It''s quite close and there''s plenty to do there.",
        "What about Brighton? We could visit the beach and it wouldn''t take too long to get there."
      ]
    }'::jsonb,
    'megan-oxford',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви запропонували конкретний варіант і одразу пояснили його перевагу.",
      "feedbackIncorrect":"Запропонуйте Brighton та додайте хоча б одну причину."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"make and justify a suggestion"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'megan-oxford', 3, 'dialogue', 'Megan',
    'Brighton could be fun. I was also thinking about Oxford. It might be more interesting if the weather isn''t great.',
    null,
    '[]'::jsonb,
    null,
    'compare-options',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'compare-options', 4, 'input', 'Megan',
    'Compare Brighton and Oxford.',
    'Порівняйте обидва варіанти. Згадайте хоча б одну перевагу кожного.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Brighton would be better if the weather is nice because we could spend time outside, but Oxford has more things to do indoors.",
        "Brighton is probably more relaxing, while Oxford might be better for sightseeing and museums.",
        "Oxford has more historical places to visit, but Brighton would be more fun if we want to relax by the sea."
      ]
    }'::jsonb,
    'megan-budget',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви порівняли два варіанти, а не просто назвали свій улюблений.",
      "feedbackIncorrect":"Порівняйте Brighton та Oxford, назвавши перевагу кожного.",
      "hint":"Спробуйте використати but, while або whereas."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"compare alternatives",
      "grammar":["comparatives","while","but"]
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'megan-budget', 5, 'dialogue', 'Megan',
    'Good point. I checked the hotels though. Brighton is about £110 a night, but I found a place in Oxford for £75. I''m trying not to spend too much this month.',
    null,
    '[]'::jsonb,
    null,
    'respond-budget',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'respond-budget', 6, 'choice', 'Megan',
    'Respond to Megan''s concern.',
    'Покажіть, що ви врахували її бюджет.',
    '[
      {
        "id":"good",
        "text":"That''s a fair point. £110 is quite a lot for one night, so Oxford might make more sense.",
        "value":"good"
      },
      {
        "id":"rude",
        "text":"That''s your problem. I want to go to Brighton.",
        "value":"rude"
      },
      {
        "id":"ignore",
        "text":"The sea is blue.",
        "value":"ignore"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'travel-time',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви відреагували на аргумент співрозмовника та скоригували свою позицію.",
      "feedbackIncorrect":"Врахуйте те, що Megan хоче витратити менше грошей."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"respond to a practical concern"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'travel-time', 7, 'dialogue', 'Megan',
    'The only problem is the train. The cheap one to Oxford takes nearly two hours, while Brighton is only about an hour away.',
    null,
    '[]'::jsonb,
    null,
    'weigh-priorities',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'weigh-priorities', 8, 'input', 'Megan',
    'Decide what matters more: money or travel time.',
    'Висловіть свою думку та поясніть її.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I think saving money is more important. Two hours isn''t too bad if we''re staying for the whole weekend.",
        "I''d rather spend less money even if the journey takes longer.",
        "For me, the shorter journey is more important because we only have two days and I don''t want to waste too much time travelling."
      ]
    }'::jsonb,
    'weather-problem',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви визначили пріоритет і пояснили свою логіку.",
      "feedbackIncorrect":"Оберіть, що важливіше — ціна чи час у дорозі — і поясніть чому."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"weigh priorities",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'weather-problem', 9, 'dialogue', 'Megan',
    'There''s one more thing. The forecast says it might rain on Saturday. Maybe we should just forget Brighton this time.',
    null,
    '[]'::jsonb,
    null,
    'polite-disagreement',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'polite-disagreement', 10, 'input', 'Megan',
    'You do not want to rule Brighton out completely.',
    'Ввічливо не погодьтеся і запропонуйте не приймати рішення лише через прогноз.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I see what you mean, but I wouldn''t rule it out yet. The forecast could change before next weekend.",
        "That''s true, but maybe we shouldn''t decide based only on the weather forecast.",
        "I understand, but the weather might change. We could wait another day before deciding."
      ]
    }'::jsonb,
    'megan-compromise',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви ввічливо не погодилися та запропонували раціональний підхід.",
      "feedbackIncorrect":"Спочатку визнайте думку Megan, а потім поясніть, чому ще рано відмовлятися від Brighton."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"disagree politely"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'megan-compromise', 11, 'dialogue', 'Megan',
    'Okay, how about this: we check the forecast again on Thursday. If it looks dry, we go to Brighton. If it''s going to rain all weekend, we book Oxford instead.',
    null,
    '[]'::jsonb,
    null,
    'improve-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'improve-plan', 12, 'input', 'Megan',
    'Add one practical detail to the plan.',
    'Погодьтеся та запропонуйте також перевірити ціни на готелі перед бронюванням.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "That sounds good. We should also check the hotel prices again before we book anything.",
        "I like that plan. Let''s check both the weather and the hotel prices on Thursday.",
        "That works for me. We could compare the hotel prices again before making the final booking."
      ]
    }'::jsonb,
    'megan-booking',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви не просто погодилися, а покращили спільний план.",
      "feedbackIncorrect":"Погодьтеся з планом і додайте перевірку цін на готелі."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"build a compromise",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'megan-booking', 13, 'dialogue', 'Megan',
    'Perfect. I''ll check the trains, and you can look at hotels. Shall we make the final decision on Thursday evening?',
    null,
    '[]'::jsonb,
    null,
    'confirm-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'confirm-plan', 14, 'choice', 'Megan',
    'Confirm the final arrangement.',
    'Підтвердьте, хто що робить і коли ви приймете рішення.',
    '[
      {
        "id":"good",
        "text":"Sounds good. You''ll check the trains, I''ll compare the hotels, and we''ll decide on Thursday evening.",
        "value":"good"
      },
      {
        "id":"weak",
        "text":"Okay, something like that.",
        "value":"weak"
      },
      {
        "id":"wrong",
        "text":"I''d like to return these headphones.",
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
      "feedbackCorrect":"Чудово. Ви чітко підсумували спільний план.",
      "feedbackIncorrect":"Підтвердьте три речі: Megan перевіряє поїзди, ви — готелі, рішення приймаєте в четвер."
    }'::jsonb,
    '{
      "npcId":"london-independence-weekend-trip-megan",
      "role":"Friend",
      "goal":"confirm arrangements"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Поїздку сплановано! Ви запропонували напрямок, порівняли альтернативи, врахували бюджет, час і погоду, ввічливо висловили незгоду та разом із Megan знайшли компроміс.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Planning a Weekend Trip completed",
      "learnedWords":[
        "How about",
        "while",
        "make more sense",
        "I''d rather",
        "even if",
        "rule out",
        "forecast",
        "That works for me",
        "final decision",
        "compare prices"
      ]
    }'::jsonb
  );

end $$;