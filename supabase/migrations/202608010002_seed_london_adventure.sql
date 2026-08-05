-- =========================================================
-- TalkHero: продовження пригоди «Перший день у Лондоні»
-- Додає місії:
--   1. London Underground
--   2. Hotel Check-in
--   3. At the Airport
--
-- Навчальний контент залишається англійською.
-- Службова логіка та коментарі — українською.
-- Міграція безпечна для повторного запуску.
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;

  underground_quest_uuid uuid;
  underground_act_uuid uuid;

  hotel_quest_uuid uuid;
  hotel_act_uuid uuid;

  airport_quest_uuid uuid;
  airport_act_uuid uuid;
begin
  select id
  into campaign_uuid
  from public.quest_campaigns
  where slug = 'english-basics';

  if campaign_uuid is null then
    raise exception
      'Не знайдено кампанію english-basics. Спочатку застосуйте демо-сид Coffee Shop.';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'first-contact';

  if episode_uuid is null then
    raise exception
      'Не знайдено епізод first-contact. Спочатку застосуйте демо-сид Coffee Shop.';
  end if;

  -- =======================================================
  -- Місія 2: London Underground
  -- =======================================================

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
  )
  values (
    episode_uuid,
    'underground',
    'London Underground',
    'Buy a ticket and ask how to reach the correct station.',
    'conversation',
    'A1',
    1,
    5,
    30,
    12,
    'published',
    '{"version":1}'::jsonb,
    '{"adventure":"london-first-day","location":"underground"}'::jsonb
  )
  on conflict (episode_id, slug)
  do update set
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
  returning id into underground_quest_uuid;

  insert into public.quest_acts (
    quest_id,
    act_code,
    title,
    description,
    order_index,
    status,
    checkpoint,
    metadata
  )
  values (
    underground_quest_uuid,
    'main',
    'At the ticket machine',
    'Buy a ticket and ask for directions.',
    0,
    'published',
    false,
    '{"adventure":"london-first-day"}'::jsonb
  )
  on conflict (quest_id, act_code)
  do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    checkpoint = excluded.checkpoint,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into underground_act_uuid;

  delete from public.quest_scenes
  where quest_id = underground_quest_uuid;

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
  )
  values
  (
    underground_quest_uuid,
    underground_act_uuid,
    'welcome',
    0,
    'dialogue',
    'Oliver',
    'Hello! Where would you like to go?',
    null,
    '[]'::jsonb,
    null,
    'ticket-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Station assistant","avatar":"🚇"}'::jsonb
  ),
  (
    underground_quest_uuid,
    underground_act_uuid,
    'ticket-choice',
    1,
    'choice',
    'Oliver',
    'Choose the clearest request.',
    'What do you say?',
    '[
      {"id":"ticket","text":"A ticket to Oxford Circus, please.","value":"ticket"},
      {"id":"coffee","text":"A coffee, please.","value":"coffee"},
      {"id":"hotel","text":"I have a hotel reservation.","value":"hotel"}
    ]'::jsonb,
    '{"optionId":"ticket"}'::jsonb,
    'direction-input',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Correct — that is a clear and polite request.",
      "feedbackIncorrect":"Choose the sentence used to buy a metro ticket."
    }'::jsonb,
    '{"role":"Station assistant","avatar":"🚇"}'::jsonb
  ),
  (
    underground_quest_uuid,
    underground_act_uuid,
    'direction-input',
    2,
    'input',
    'Oliver',
    'Ask which platform you need.',
    'Ask for the correct platform in English.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Which platform do I need",
        "Which platform should I use",
        "What platform do I need",
        "Which platform, please"
      ]
    }'::jsonb,
    'success',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Excellent — now you know where to go.",
      "feedbackIncorrect":"Try: Which platform do I need?"
    }'::jsonb,
    '{"role":"Station assistant","avatar":"🚇"}'::jsonb
  ),
  (
    underground_quest_uuid,
    underground_act_uuid,
    'success',
    3,
    'dialogue',
    'Oliver',
    'Platform two. The next train arrives in three minutes. Have a good journey!',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Station assistant","avatar":"🚇"}'::jsonb
  );

  -- =======================================================
  -- Місія 3: Hotel Check-in
  -- =======================================================

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
  )
  values (
    episode_uuid,
    'hotel',
    'Hotel Check-in',
    'Confirm your reservation and ask about your room.',
    'conversation',
    'A1',
    2,
    6,
    35,
    15,
    'published',
    '{"version":1}'::jsonb,
    '{"adventure":"london-first-day","location":"hotel"}'::jsonb
  )
  on conflict (episode_id, slug)
  do update set
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
  returning id into hotel_quest_uuid;

  insert into public.quest_acts (
    quest_id,
    act_code,
    title,
    description,
    order_index,
    status,
    checkpoint,
    metadata
  )
  values (
    hotel_quest_uuid,
    'main',
    'At reception',
    'Check in and ask a simple question about the room.',
    0,
    'published',
    false,
    '{"adventure":"london-first-day"}'::jsonb
  )
  on conflict (quest_id, act_code)
  do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    checkpoint = excluded.checkpoint,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into hotel_act_uuid;

  delete from public.quest_scenes
  where quest_id = hotel_quest_uuid;

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
  )
  values
  (
    hotel_quest_uuid,
    hotel_act_uuid,
    'welcome',
    0,
    'dialogue',
    'Sophie',
    'Good afternoon. Welcome to the Riverside Hotel. How can I help you?',
    null,
    '[]'::jsonb,
    null,
    'reservation-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Receptionist","avatar":"🏨"}'::jsonb
  ),
  (
    hotel_quest_uuid,
    hotel_act_uuid,
    'reservation-choice',
    1,
    'choice',
    'Sophie',
    'Choose the correct sentence for checking in.',
    'What do you say?',
    '[
      {"id":"reservation","text":"I have a reservation.","value":"reservation"},
      {"id":"station","text":"Which platform do I need?","value":"station"},
      {"id":"menu","text":"Can I see the menu?","value":"menu"}
    ]'::jsonb,
    '{"optionId":"reservation"}'::jsonb,
    'breakfast-input',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Correct — the receptionist can now find your booking.",
      "feedbackIncorrect":"Choose the sentence used when you already booked a room."
    }'::jsonb,
    '{"role":"Receptionist","avatar":"🏨"}'::jsonb
  ),
  (
    hotel_quest_uuid,
    hotel_act_uuid,
    'breakfast-input',
    2,
    'input',
    'Sophie',
    'Ask what time breakfast starts.',
    'Ask about breakfast time in English.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "What time does breakfast start",
        "When does breakfast start",
        "What time is breakfast",
        "When is breakfast"
      ]
    }'::jsonb,
    'success',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Perfect — breakfast starts at seven.",
      "feedbackIncorrect":"Try: What time does breakfast start?"
    }'::jsonb,
    '{"role":"Receptionist","avatar":"🏨"}'::jsonb
  ),
  (
    hotel_quest_uuid,
    hotel_act_uuid,
    'success',
    3,
    'dialogue',
    'Sophie',
    'Breakfast starts at seven. Here is your key. Your room is on the third floor.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Receptionist","avatar":"🏨"}'::jsonb
  );

  -- =======================================================
  -- Місія 4: At the Airport
  -- =======================================================

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
  )
  values (
    episode_uuid,
    'airport',
    'At the Airport',
    'Check in for your flight and answer a simple travel question.',
    'conversation',
    'A2',
    3,
    7,
    40,
    18,
    'published',
    '{"version":1}'::jsonb,
    '{"adventure":"london-first-day","location":"airport"}'::jsonb
  )
  on conflict (episode_id, slug)
  do update set
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
  returning id into airport_quest_uuid;

  insert into public.quest_acts (
    quest_id,
    act_code,
    title,
    description,
    order_index,
    status,
    checkpoint,
    metadata
  )
  values (
    airport_quest_uuid,
    'main',
    'At the check-in desk',
    'Check in and answer a question about your luggage.',
    0,
    'published',
    false,
    '{"adventure":"london-first-day"}'::jsonb
  )
  on conflict (quest_id, act_code)
  do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    checkpoint = excluded.checkpoint,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into airport_act_uuid;

  delete from public.quest_scenes
  where quest_id = airport_quest_uuid;

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
  )
  values
  (
    airport_quest_uuid,
    airport_act_uuid,
    'welcome',
    0,
    'dialogue',
    'Daniel',
    'Good morning. May I see your passport and booking confirmation?',
    null,
    '[]'::jsonb,
    null,
    'document-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Check-in agent","avatar":"✈️"}'::jsonb
  ),
  (
    airport_quest_uuid,
    airport_act_uuid,
    'document-choice',
    1,
    'choice',
    'Daniel',
    'Choose the most suitable reply.',
    'What do you say?',
    '[
      {"id":"documents","text":"Of course. Here you are.","value":"documents"},
      {"id":"coffee","text":"A latte, please.","value":"coffee"},
      {"id":"hotel","text":"What time is breakfast?","value":"hotel"}
    ]'::jsonb,
    '{"optionId":"documents"}'::jsonb,
    'luggage-input',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Correct — polite and natural.",
      "feedbackIncorrect":"Choose the reply used when handing over documents."
    }'::jsonb,
    '{"role":"Check-in agent","avatar":"✈️"}'::jsonb
  ),
  (
    airport_quest_uuid,
    airport_act_uuid,
    'luggage-input',
    2,
    'input',
    'Daniel',
    'Tell the agent that you have one suitcase.',
    'Answer in English.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I have one suitcase",
        "I have one bag",
        "I only have one suitcase",
        "One suitcase"
      ]
    }'::jsonb,
    'success',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Excellent — your luggage is checked in.",
      "feedbackIncorrect":"Try: I have one suitcase."
    }'::jsonb,
    '{"role":"Check-in agent","avatar":"✈️"}'::jsonb
  ),
  (
    airport_quest_uuid,
    airport_act_uuid,
    'success',
    3,
    'dialogue',
    'Daniel',
    'Thank you. Your gate is B12. Boarding begins at ten thirty. Have a pleasant flight!',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Check-in agent","avatar":"✈️"}'::jsonb
  );
end $$;

-- =========================================================
-- Відкриття наступної місії для вже завершених проходжень
-- =========================================================

insert into public.user_quest_progress (
  user_id,
  quest_id,
  status,
  unlocked_at
)
select
  completed_progress.user_id,
  next_quest.id,
  'available',
  coalesce(
    completed_progress.last_completed_at,
    now()
  )
from public.user_quest_progress completed_progress
join public.quests current_quest
  on current_quest.id = completed_progress.quest_id
join lateral (
  select candidate.id
  from public.quests candidate
  where candidate.episode_id = current_quest.episode_id
    and candidate.status = 'published'
    and (
      candidate.order_index > current_quest.order_index
      or (
        candidate.order_index = current_quest.order_index
        and candidate.id > current_quest.id
      )
    )
  order by candidate.order_index, candidate.id
  limit 1
) next_quest on true
where completed_progress.status = 'completed'
on conflict (user_id, quest_id)
do update set
  status = case
    when public.user_quest_progress.status in (
      'in_progress',
      'completed'
    )
      then public.user_quest_progress.status
    else 'available'
  end,
  unlocked_at = coalesce(
    public.user_quest_progress.unlocked_at,
    excluded.unlocked_at
  ),
  updated_at = now();
