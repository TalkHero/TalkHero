-- =========================================================
-- TalkHero London Independence — B1
-- Mission #2: First Day at Work
-- NPC: Nathan — Team Lead
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
  where slug = 'london-independence'
    and status = 'published';

  if campaign_uuid is null then
    raise exception 'Campaign not found: london-independence';
  end if;

  select id
  into episode_uuid
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
    'first-day-at-work',
    'First Day at Work',
    'Проведіть перший день у британській компанії: познайомтеся з керівником, уточніть завдання, попросіть допомогу та вирішіть першу робочу проблему.',
    'conversation',
    'B1',
    1,
    15,
    130,
    50,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-independence",
        "subtitle": "Перший день на роботі",
        "objectives": [
          "познайомитися з керівником",
          "підтримати професійний small talk",
          "зрозуміти перше робоче завдання",
          "уточнити незрозумілу інформацію",
          "повідомити про проблему",
          "запропонувати власне рішення"
        ]
      },
      "location": "london-office"
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
    'Welcome to the Team',
    'Пройдіть свій перший робочий день разом із Nathan, Team Lead.',
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

  -- 0: Arrival
  (
    quest_uuid,
    act_uuid,
    'arrival',
    0,
    'narration',
    null,
    'Сьогодні ваш перший день на новій роботі. Ви заходите до офісу, де на вас уже чекає керівник команди.',
    null,
    '[]'::jsonb,
    null,
    'nathan-welcome',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Office","emotion":"focused"}'::jsonb
  ),

  -- 1: Nathan welcomes the learner
  (
    quest_uuid,
    act_uuid,
    'nathan-welcome',
    1,
    'dialogue',
    'Nathan',
    'Morning! You must be our new team member. I''m Nathan, the team lead. Welcome aboard!',
    null,
    '[]'::jsonb,
    null,
    'reply-to-welcome',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 2: Professional response
  (
    quest_uuid,
    act_uuid,
    'reply-to-welcome',
    2,
    'choice',
    'Nathan',
    'Respond naturally to Nathan.',
    'Оберіть найбільш природну відповідь.',
    '[
      {
        "id":"good",
        "text":"Thanks, Nathan. It''s great to be here. I''m looking forward to working with the team.",
        "value":"good"
      },
      {
        "id":"cold",
        "text":"Yes. I am the new person.",
        "value":"cold"
      },
      {
        "id":"wrong",
        "text":"Could I have the bill, please?",
        "value":"wrong"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'small-talk',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Це дружня та професійна відповідь для першого робочого дня.",
      "feedbackIncorrect":"Спробуйте відповісти дружньо та показати, що ви раді приєднатися до команди."
    }'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "goal":"respond professionally"
    }'::jsonb
  ),

  -- 3: Small talk
  (
    quest_uuid,
    act_uuid,
    'small-talk',
    3,
    'dialogue',
    'Nathan',
    'How was your journey into the office this morning? Did you find the place easily?',
    null,
    '[]'::jsonb,
    null,
    'small-talk-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"friendly"
    }'::jsonb
  ),

  -- 4: Open small-talk answer
  (
    quest_uuid,
    act_uuid,
    'small-talk-answer',
    4,
    'input',
    'Nathan',
    'Tell Nathan how your journey to work was.',
    'Дайте природну відповідь у 1–2 реченнях.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "It was fine, thanks. I found the office quite easily.",
        "The journey was good, thanks. I didn''t have any trouble finding the office.",
        "It was a little busy, but I got here without any problems."
      ]
    }'::jsonb,
    'first-task',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви природно підтримали коротку розмову з колегою.",
      "feedbackIncorrect":"Скажіть, якою була дорога, і чи легко ви знайшли офіс."
    }'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "goal":"professional small talk",
      "grammar":["past simple"]
    }'::jsonb
  ),

  -- 5: Task explanation
  (
    quest_uuid,
    act_uuid,
    'first-task',
    5,
    'dialogue',
    'Nathan',
    'Great. Your first task is to prepare a short summary of last month''s campaign results. I''d like to have it by three o''clock.',
    null,
    '[]'::jsonb,
    null,
    'confirm-deadline',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6: Clarify deadline
  (
    quest_uuid,
    act_uuid,
    'confirm-deadline',
    6,
    'input',
    'Nathan',
    'Make sure you understood the deadline correctly.',
    'Уточніть, чи Nathan потрібен звіт до 15:00 сьогодні.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Just to confirm, you need the summary by three o''clock today, right?",
        "Do you need the summary by three o''clock today?",
        "So, you''d like me to finish it by three o''clock today?"
      ]
    }'::jsonb,
    'deadline-confirmed',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Just to confirm — дуже природна фраза для уточнення на роботі.",
      "feedbackIncorrect":"Спробуйте ввічливо підтвердити завдання та час: Just to confirm..."
    }'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "goal":"clarify a deadline"
    }'::jsonb
  ),

  -- 7: More information
  (
    quest_uuid,
    act_uuid,
    'deadline-confirmed',
    7,
    'dialogue',
    'Nathan',
    'Exactly. You''ll find the campaign data in the shared folder. Focus on the main results and anything unusual.',
    null,
    '[]'::jsonb,
    null,
    'ask-about-template',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"helpful"
    }'::jsonb
  ),

  -- 8: Ask for clarification
  (
    quest_uuid,
    act_uuid,
    'ask-about-template',
    8,
    'choice',
    'Nathan',
    'You are not sure what format to use. What should you say?',
    'Оберіть професійний спосіб попросити уточнення.',
    '[
      {
        "id":"clarify",
        "text":"Is there a template I should use for the summary?",
        "value":"clarify"
      },
      {
        "id":"guess",
        "text":"I''ll just do something.",
        "value":"guess"
      },
      {
        "id":"refuse",
        "text":"I don''t want to do this task.",
        "value":"refuse"
      }
    ]'::jsonb,
    '{"optionId":"clarify"}'::jsonb,
    'template-answer',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Саме так. На роботі краще уточнити очікування, ніж здогадуватися.",
      "feedbackIncorrect":"Попросіть Nathan уточнити формат завдання."
    }'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "goal":"ask for clarification"
    }'::jsonb
  ),

  -- 9: Template response
  (
    quest_uuid,
    act_uuid,
    'template-answer',
    9,
    'dialogue',
    'Nathan',
    'Yes, there is. I''ll send you the template now. Actually, let me know if you can open the shared folder first.',
    null,
    '[]'::jsonb,
    null,
    'access-problem',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 10: Problem appears
  (
    quest_uuid,
    act_uuid,
    'access-problem',
    10,
    'narration',
    null,
    'Ви відкриваєте посилання, але система показує повідомлення Access denied. У вас немає доступу до спільної папки.',
    null,
    '[]'::jsonb,
    null,
    'report-problem',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Office","emotion":"thinking"}'::jsonb
  ),

  -- 11: Report the problem
  (
    quest_uuid,
    act_uuid,
    'report-problem',
    11,
    'input',
    'Nathan',
    'Explain the problem clearly to Nathan.',
    'Скажіть, що ви спробували відкрити папку, але не маєте доступу.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I tried to open the shared folder, but it says I don''t have access.",
        "I''ve tried to open the shared folder, but I can''t access it.",
        "I can open the link, but I don''t seem to have permission to view the folder."
      ]
    }'::jsonb,
    'nathan-solution',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви чітко описали, що зробили і в чому полягає проблема.",
      "feedbackIncorrect":"Опишіть дві речі: що ви спробували зробити і що саме не працює."
    }'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "goal":"report a workplace problem",
      "grammar":["past simple","present perfect"]
    }'::jsonb
  ),

  -- 12: Nathan asks for initiative
  (
    quest_uuid,
    act_uuid,
    'nathan-solution',
    12,
    'dialogue',
    'Nathan',
    'Thanks for letting me know. IT may take a while to update your permissions. What could you work on while we wait?',
    null,
    '[]'::jsonb,
    null,
    'suggest-solution',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 13: Suggest own solution
  (
    quest_uuid,
    act_uuid,
    'suggest-solution',
    13,
    'input',
    'Nathan',
    'Suggest something useful you could do while waiting.',
    'Запропонуйте власне рішення. Наприклад, ознайомитися з шаблоном або попередніми звітами.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I could look at some previous reports while I''m waiting.",
        "Perhaps I could review the template and previous reports while IT fixes the problem.",
        "I could start by reading some previous reports so I understand the format."
      ]
    }'::jsonb,
    'nathan-feedback',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна B1-відповідь. Ви не просто повідомили про проблему, а запропонували корисне рішення.",
      "feedbackIncorrect":"Запропонуйте конкретну корисну дію, яку можете виконати, поки чекаєте."
    }'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "goal":"suggest a solution",
      "skill":"problem-solving"
    }'::jsonb
  ),

  -- 14: Closing dialogue
  (
    quest_uuid,
    act_uuid,
    'nathan-feedback',
    14,
    'dialogue',
    'Nathan',
    'That''s exactly what I was going to suggest. Have a look at last week''s report first. And don''t hesitate to ask if you need anything. You''re off to a good start.',
    null,
    '[]'::jsonb,
    null,
    'complete',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-independence-first-day-at-work-nathan",
      "role":"Team Lead",
      "emotion":"encouraging"
    }'::jsonb
  ),

  -- 15: Completion
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Перший робочий день завершено! Ви познайомилися з керівником, уточнили завдання, попросили додаткову інформацію, повідомили про проблему та запропонували власне рішення.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"First Day at Work completed",
      "learnedWords":[
        "welcome aboard",
        "team lead",
        "deadline",
        "shared folder",
        "template",
        "permission",
        "access",
        "just to confirm",
        "let me know",
        "don''t hesitate"
      ]
    }'::jsonb
  );

end $$;