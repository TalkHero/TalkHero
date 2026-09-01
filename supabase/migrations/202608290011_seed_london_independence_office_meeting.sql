-- =========================================================
-- TalkHero London Independence — B1
-- Mission #11: Office Meeting
-- NPC: Monica — Project Manager
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
    'office-meeting',
    'Office Meeting',
    'Візьміть участь у робочій зустрічі: поясніть затримку проєкту, запропонуйте рішення та домовтеся про новий дедлайн.',
    'conversation',
    'B1',
    10,
    15,
    220,
    95,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Робоча зустріч команди",
        "objectives":[
          "дати короткий статус проєкту",
          "пояснити причину затримки",
          "описати поточні ризики",
          "запропонувати рішення",
          "відреагувати на критику",
          "аргументувати пріоритети",
          "домовитися про новий дедлайн"
        ]
      },
      "location":"office-meeting-room"
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
    'The Delayed Project',
    'Поясніть Monica, чому проєкт затримується, та запропонуйте реалістичний план.',
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
    quest_uuid, act_uuid, 'meeting-start', 0, 'narration', null,
    'Понеділок, 10:00. Команда зібралася на щотижневу зустріч. Ваш проєкт мав перейти до фінального тестування цього тижня, але частина роботи ще не завершена.',
    null,
    '[]'::jsonb,
    null,
    'monica-opens',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Meeting Room","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-opens', 1, 'dialogue', 'Monica',
    'Let''s start with your project. Can you give us a quick update on where things stand?',
    null,
    '[]'::jsonb,
    null,
    'give-status',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'give-status', 2, 'input', 'Monica',
    'Give a short project update.',
    'Скажіть, що основна частина роботи завершена, але інтеграція з новою системою ще не готова.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Most of the work is finished, but the integration with the new system still isn''t complete.",
        "We''ve completed the main part of the project, but we''re still working on the integration with the new system.",
        "The project is mostly finished. The main issue is that the new system integration hasn''t been completed yet."
      ]
    }'::jsonb,
    'monica-asks-delay',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви коротко дали статус і одразу назвали незавершену частину.",
      "feedbackIncorrect":"Скажіть, що основна робота завершена, але integration ще не готова."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"give a concise project update"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-asks-delay', 3, 'dialogue', 'Monica',
    'We expected that to be ready by Friday. What caused the delay?',
    null,
    '[]'::jsonb,
    null,
    'explain-delay',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-delay', 4, 'input', 'Monica',
    'Explain the reason for the delay.',
    'Поясніть, що зовнішня команда змінила API наприкінці минулого тижня, тому частину інтеграції довелося переробити.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "The external team changed the API at the end of last week, so we had to redo part of the integration.",
        "There was an unexpected API change from the external team last week, which meant we had to rework some of the integration.",
        "The delay happened because the external team changed the API, and that created extra work for us."
      ]
    }'::jsonb,
    'monica-asks-risk',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви пояснили конкретну причину та її наслідок.",
      "feedbackIncorrect":"Згадайте API change і те, що через це довелося переробляти integration."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"explain cause and consequence"
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-asks-risk', 5, 'dialogue', 'Monica',
    'Okay. What''s the biggest risk now? Is there anything else that could delay us?',
    null,
    '[]'::jsonb,
    null,
    'describe-risk',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'describe-risk', 6, 'input', 'Monica',
    'Describe the main project risk.',
    'Поясніть, що найбільший ризик — не встигнути повністю протестувати систему, якщо поспішити з завершенням інтеграції.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "The biggest risk is that we won''t have enough time to test everything properly if we rush the integration.",
        "If we try to finish the integration too quickly, we may not have enough time for proper testing.",
        "My main concern is testing. Rushing the remaining work could leave us without enough time to check the system properly."
      ]
    }'::jsonb,
    'monica-pushes',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви визначили ризик і пояснили, чому він виникає.",
      "feedbackIncorrect":"Поясніть зв’язок між rushing the integration і недостатнім testing time."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"identify and explain a risk",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-pushes', 7, 'dialogue', 'Monica',
    'I understand, but we really need to keep the original deadline if possible. Couldn''t we just reduce the amount of testing?',
    null,
    '[]'::jsonb,
    null,
    'respond-criticism',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"serious"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'respond-criticism', 8, 'choice', 'Monica',
    'Respond professionally.',
    'Не погодьтеся з ідеєю скоротити тестування, але зробіть це професійно.',
    '[
      {
        "id":"good",
        "text":"I understand the deadline is important, but I don''t think reducing the testing would be a good idea. It could create bigger problems after launch.",
        "value":"good"
      },
      {
        "id":"rude",
        "text":"That''s a terrible idea and I won''t do it.",
        "value":"rude"
      },
      {
        "id":"accept",
        "text":"Sure, we can skip most of the testing.",
        "value":"accept"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'monica-asks-solution',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви визнали важливість дедлайну, але пояснили ризик скорочення тестування.",
      "feedbackIncorrect":"Ввічливо не погодьтеся та поясніть, що слабке testing може створити більші проблеми."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"respond to pressure professionally"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-asks-solution', 9, 'dialogue', 'Monica',
    'Fair enough. So what would you suggest instead?',
    null,
    '[]'::jsonb,
    null,
    'propose-solution',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'propose-solution', 10, 'input', 'Monica',
    'Suggest a realistic solution.',
    'Запропонуйте завершити integration до середи, провести основне тестування в четвер і перенести реліз на п’ятницю.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I suggest we finish the integration by Wednesday, do the main testing on Thursday and move the release to Friday.",
        "We could aim to complete the integration by Wednesday, test everything on Thursday and release on Friday instead.",
        "My suggestion would be to finish the remaining work by Wednesday, use Thursday for testing and move the launch to Friday."
      ]
    }'::jsonb,
    'monica-challenges-plan',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви запропонували конкретний план із чіткими етапами.",
      "feedbackIncorrect":"Назвіть три етапи: Wednesday integration, Thursday testing, Friday release."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"propose an actionable solution",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-challenges-plan', 11, 'dialogue', 'Monica',
    'That gives us only one full day of testing. Why do you think that''s enough?',
    null,
    '[]'::jsonb,
    null,
    'justify-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"serious"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'justify-plan', 12, 'input', 'Monica',
    'Defend your proposed plan.',
    'Поясніть, що більшість системи вже протестована, а в четвер потрібно перевірити тільки нову інтеграцію та основні сценарії.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Most of the system has already been tested. On Thursday we would mainly need to test the new integration and the most important user flows.",
        "I think one day is enough because the rest of the product has already been tested. We would focus on the integration and the key scenarios.",
        "We''ve already tested most of the system, so Thursday could be focused on the new integration and the critical user journeys."
      ]
    }'::jsonb,
    'monica-decision',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна аргументація. Ви пояснили, чому запропонований час тестування може бути достатнім.",
      "feedbackIncorrect":"Скажіть, що більша частина вже протестована, а Thursday буде сфокусований на integration і key scenarios."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"justify a proposed plan",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'monica-decision', 13, 'dialogue', 'Monica',
    'All right. Let''s go with that plan. Integration finished by Wednesday evening, testing on Thursday, and release Friday morning. I want a short progress update on Wednesday afternoon.',
    null,
    '[]'::jsonb,
    null,
    'confirm-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'confirm-plan', 14, 'input', 'Monica',
    'Confirm the final agreement.',
    'Підсумуйте дедлайн integration, день тестування, реліз і проміжний update.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Just to confirm, we''ll finish the integration by Wednesday evening, I''ll send you an update on Wednesday afternoon, we''ll test on Thursday and release on Friday morning.",
        "So the plan is: progress update Wednesday afternoon, integration complete by Wednesday evening, testing Thursday and release Friday morning.",
        "Understood. I''ll update you on Wednesday afternoon, finish the integration that evening, then we''ll test Thursday and release Friday morning."
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви чітко підсумували всі етапи та дедлайни.",
      "feedbackIncorrect":"Підтвердьте Wednesday update + integration, Thursday testing і Friday release."
    }'::jsonb,
    '{
      "npcId":"london-independence-office-meeting-monica",
      "role":"Project Manager",
      "goal":"confirm project commitments"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Зустріч завершено! Ви дали чіткий статус проєкту, пояснили затримку, визначили ризик, професійно відреагували на тиск, запропонували рішення та домовилися про новий план релізу.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Office Meeting completed",
      "learnedWords":[
        "project update",
        "integration",
        "deadline",
        "unexpected",
        "rework",
        "main concern",
        "reduce testing",
        "I suggest",
        "key scenarios",
        "progress update",
        "release"
      ]
    }'::jsonb
  );

end $$;