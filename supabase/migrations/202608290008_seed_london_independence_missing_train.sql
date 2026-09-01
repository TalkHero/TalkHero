-- =========================================================
-- TalkHero London Independence — B1
-- Mission #8: Missing a Train
-- NPC: Aisha — Station Supervisor
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
    'missing-a-train',
    'Missing a Train',
    'Ви запізнилися на поїзд через проблеми в метро. Поясніть ситуацію, дізнайтеся про альтернативи та домовтеся про новий маршрут.',
    'conversation',
    'B1',
    7,
    15,
    190,
    80,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Запізнення на поїзд",
        "objectives":[
          "пояснити причину запізнення",
          "описати послідовність подій",
          "уточнити правила квитка",
          "запитати про альтернативні варіанти",
          "порівняти ціну та час",
          "ввічливо попросити виняток",
          "підтвердити новий маршрут"
        ]
      },
      "location":"railway-station"
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
    'The Train Has Gone',
    'Поговоріть з Aisha та знайдіть найкращий спосіб продовжити подорож.',
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
    quest_uuid, act_uuid, 'station-arrival', 0, 'narration', null,
    'Ви прибігаєте на вокзал і бачите, що ваш поїзд уже поїхав. Через серйозну затримку на лінії метро ви запізнилися приблизно на десять хвилин. Ваш квиток був придбаний на конкретний рейс.',
    null,
    '[]'::jsonb,
    null,
    'aisha-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Railway Station","emotion":"stressed"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'aisha-greeting', 1, 'dialogue', 'Aisha',
    'Hello. You look like you''re in a hurry. What seems to be the problem?',
    null,
    '[]'::jsonb,
    null,
    'explain-missed-train',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-missed-train', 2, 'input', 'Aisha',
    'Explain what happened.',
    'Скажіть, що ви мали їхати поїздом о 18:30, але через серйозну затримку метро запізнилися приблизно на десять хвилин.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I was supposed to catch the 6:30 train, but there was a serious delay on the Underground and I arrived about ten minutes late.",
        "I had a ticket for the 6:30 train, but my Underground line was badly delayed, so I missed it by about ten minutes.",
        "My train left at 6:30, but there were major delays on the Underground and I got here around ten minutes too late."
      ]
    }'::jsonb,
    'aisha-ticket',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви пояснили заплановану подію, причину та результат.",
      "feedbackIncorrect":"Назвіть час поїзда, затримку метро та приблизний час вашого запізнення."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"explain a travel disruption"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'aisha-ticket', 3, 'dialogue', 'Aisha',
    'I see. Let me check your ticket. Unfortunately, this is an Advance ticket, so it''s normally only valid for the train you booked.',
    null,
    '[]'::jsonb,
    null,
    'clarify-rule',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'clarify-rule', 4, 'input', 'Aisha',
    'Clarify what this means.',
    'Уточніть, чи це означає, що ви взагалі не можете використати цей квиток на наступний поїзд.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Does that mean I can''t use this ticket on the next train at all?",
        "So does that mean this ticket isn''t valid for any later train?",
        "Just to make sure I understand, I can''t simply take the next train with this ticket?"
      ]
    }'::jsonb,
    'aisha-options',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви перевірили своє розуміння правила.",
      "feedbackIncorrect":"Уточніть, чи можна використати цей самий квиток на наступний поїзд."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"clarify a ticket restriction"
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'aisha-options', 5, 'dialogue', 'Aisha',
    'Normally, no. You have two options. There''s another direct train in forty minutes, but you''d need a new ticket for £48. Or there''s a slower service in about an hour that I may be able to transfer you onto for £12.',
    null,
    '[]'::jsonb,
    null,
    'compare-options',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'compare-options', 6, 'input', 'Aisha',
    'Compare the two alternatives.',
    'Порівняйте прямий поїзд за £48 і повільніший варіант за £12.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "The direct train is faster, but £48 is quite expensive. The slower train is much cheaper, although I''d have to wait longer.",
        "I''d get there sooner on the direct train, but it costs four times as much as the slower option.",
        "The £12 option would save me a lot of money, but the journey would take longer and I''d have to wait about an hour."
      ]
    }'::jsonb,
    'important-arrival',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви порівняли альтернативи за двома критеріями: часом і ціною.",
      "feedbackIncorrect":"Порівняйте швидкість і вартість обох варіантів."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"compare travel alternatives",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'important-arrival', 7, 'dialogue', 'Aisha',
    'It depends on how important your arrival time is. Do you need to be there by a particular time?',
    null,
    '[]'::jsonb,
    null,
    'explain-constraint',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-constraint', 8, 'input', 'Aisha',
    'Explain why time matters.',
    'Поясніть, що вас мають забрати зі станції о 20:30 і ви не хочете змушувати людину чекати надто довго.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Someone is picking me up at the station at 8:30, so I''d rather not make them wait too long.",
        "I''m supposed to meet someone at the station at 8:30, and I don''t want to keep them waiting for too long.",
        "A friend is meeting me there at 8:30, so arriving much later would be inconvenient for them."
      ]
    }'::jsonb,
    'aisha-direct-option',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви пояснили практичне обмеження та його вплив на іншу людину.",
      "feedbackIncorrect":"Скажіть, що вас зустрічають о 20:30 і ви не хочете змушувати людину довго чекати."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"explain a practical constraint"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'aisha-direct-option', 9, 'dialogue', 'Aisha',
    'In that case, the direct train would probably be better, but I understand £48 is a lot to pay because of a delay that wasn''t really your fault.',
    null,
    '[]'::jsonb,
    null,
    'request-exception',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"concerned"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'request-exception', 10, 'input', 'Aisha',
    'Politely ask whether an exception is possible.',
    'Поясніть, що затримка була поза вашим контролем, і запитайте, чи можна зменшити доплату.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Since the delay was completely outside my control, would it be possible to reduce the extra charge at all?",
        "I understand the ticket rules, but as the Underground delay wasn''t my fault, is there any chance you could reduce the fare?",
        "I realise this ticket is restricted, but would you be able to make an exception because the delay was beyond my control?"
      ]
    }'::jsonb,
    'aisha-checks',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна B1-відповідь. Ви визнали правило, аргументували свою позицію та ввічливо попросили виняток.",
      "feedbackIncorrect":"Визнайте правило, поясніть, що затримка була поза вашим контролем, і ввічливо попросіть зменшити доплату."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"negotiate an exception",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'aisha-checks', 11, 'dialogue', 'Aisha',
    'Let me check the disruption report... Yes, I can see there was a major delay on your Underground line. I can endorse your ticket for the next direct train for an additional £15 instead of £48.',
    null,
    '[]'::jsonb,
    null,
    'evaluate-offer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evaluate-offer', 12, 'choice', 'Aisha',
    'Respond to the new offer.',
    'Прийміть компроміс і поясніть, чому він вам підходить.',
    '[
      {
        "id":"good",
        "text":"That sounds much better. £15 is reasonable, and the direct train means I should still arrive close to the time we arranged.",
        "value":"good"
      },
      {
        "id":"rude",
        "text":"You should let me travel for free.",
        "value":"rude"
      },
      {
        "id":"wrong",
        "text":"I think the hotel room is too cold.",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'aisha-details',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви оцінили компроміс з урахуванням і ціни, і часу.",
      "feedbackIncorrect":"Прийміть £15 доплати та поясніть, чому прямий поїзд вирішує проблему."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"evaluate and accept a compromise",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'aisha-details', 13, 'dialogue', 'Aisha',
    'Perfect. The next direct train leaves at 7:20 from platform six. I''ve updated your ticket, so you won''t need to buy another one. Just pay the £15 difference at the machine beside the gate.',
    null,
    '[]'::jsonb,
    null,
    'confirm-details',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'confirm-details', 14, 'input', 'Aisha',
    'Confirm the important details before leaving.',
    'Підтвердьте час, платформу та доплату.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Just to confirm, the train leaves at 7:20 from platform six, and I only need to pay the £15 difference. Is that right?",
        "So it''s the 7:20 train from platform six, and I pay an extra £15 at the machine?",
        "Let me make sure I''ve got everything: 7:20, platform six, and a £15 additional charge."
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви перевірили всі ключові деталі перед завершенням розмови.",
      "feedbackIncorrect":"Підтвердьте три деталі: 7:20, platform six і £15."
    }'::jsonb,
    '{
      "npcId":"london-independence-missing-train-aisha",
      "role":"Station Supervisor",
      "goal":"confirm travel arrangements"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Ви врятували поїздку! Ви пояснили причину запізнення, уточнили правила квитка, порівняли альтернативи, аргументовано попросили виняток і домовилися про прямий поїзд із доплатою лише £15.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Missing a Train completed",
      "learnedWords":[
        "miss a train",
        "delay",
        "Advance ticket",
        "valid",
        "direct train",
        "slower service",
        "outside my control",
        "make an exception",
        "additional charge",
        "platform"
      ]
    }'::jsonb
  );

end $$;