-- =========================================================
-- TalkHero Campaign #3
-- B1: London Independence
-- Mission #1: Job Interview
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  -- =======================================================
  -- Campaign
  -- =======================================================

  insert into public.quest_campaigns (
    slug,
    title,
    description,
    cefr_level,
    status,
    order_index,
    metadata
  ) values (
    'london-independence',
    'London Independence',
    'Розвивайте впевненість у реальних ситуаціях Лондона: робота, спілкування, подорожі, проблеми та самостійні рішення.',
    'B1',
    'published',
    2,
    '{
      "adventure": {
        "location": "London, United Kingdom",
        "subtitle": "Живи, працюй, вирішуй"
      }
    }'::jsonb
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    cefr_level = excluded.cefr_level,
    status = excluded.status,
    order_index = excluded.order_index,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into campaign_uuid;


  -- =======================================================
  -- Episode
  -- =======================================================

  insert into public.quest_episodes (
    campaign_id,
    slug,
    title,
    description,
    order_index,
    status,
    metadata
  ) values (
    campaign_uuid,
    'independent-life',
    'Independent Life',
    'Використовуйте англійську самостійно у складніших життєвих і професійних ситуаціях.',
    0,
    'published',
    '{
      "adventure": {
        "subtitle": "Наступний рівень життя в Лондоні"
      }
    }'::jsonb
  )
  on conflict (campaign_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into episode_uuid;


  -- =======================================================
  -- Quest
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
  ) values (
    episode_uuid,
    'job-interview',
    'Job Interview',
    'Пройдіть співбесіду англійською: розкажіть про себе, досвід, сильні сторони та поясніть, чому ви підходите на роботу.',
    'conversation',
    'B1',
    0,
    15,
    120,
    45,
    'published',
    '{
      "version": 1,
      "sceneCount": 16
    }'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-independence",
        "subtitle": "Співбесіда на роботу",
        "objectives": [
          "професійно представитися",
          "розповісти про свій досвід",
          "описати сильні сторони",
          "навести приклад вирішення проблеми",
          "пояснити свою мотивацію",
          "поставити власне запитання роботодавцю"
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


  -- =======================================================
  -- Act
  -- =======================================================

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
    'The Interview',
    'Пройдіть повну співбесіду з Victoria, Hiring Manager.',
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


  -- =======================================================
  -- Scenes
  -- =======================================================

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
    quest_uuid,
    act_uuid,
    'arrival',
    0,
    'narration',
    null,
    'Ви прийшли до офісу британської компанії на співбесіду. Це ваша можливість отримати нову роботу в Лондоні.',
    null,
    '[]'::jsonb,
    null,
    'victoria-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "location": "London Office",
      "emotion": "focused"
    }'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victoria-greeting',
    1,
    'dialogue',
    'Victoria',
    'Good morning. I''m Victoria, the hiring manager. Thanks for coming in today. Please, have a seat.',
    null,
    '[]'::jsonb,
    null,
    'professional-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "professional"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'professional-greeting',
    2,
    'choice',
    'Victoria',
    'Start the interview professionally.',
    'Оберіть найкращу відповідь.',
    '[
      {
        "id": "professional",
        "text": "Good morning. Thank you for inviting me. It''s nice to meet you.",
        "value": "professional"
      },
      {
        "id": "casual",
        "text": "Hey! What''s going on?",
        "value": "casual"
      },
      {
        "id": "irrelevant",
        "text": "Can I order a coffee?",
        "value": "irrelevant"
      }
    ]'::jsonb,
    '{"optionId":"professional"}'::jsonb,
    'tell-me-about-yourself',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудовий початок. Відповідь професійна, але природна.",
      "feedbackIncorrect": "На співбесіді краще почати з професійного привітання."
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "start professionally"
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'tell-me-about-yourself',
    3,
    'dialogue',
    'Victoria',
    'Let''s start with something simple. Could you tell me a little about yourself and your professional background?',
    null,
    '[]'::jsonb,
    null,
    'background-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "curious"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'background-answer',
    4,
    'input',
    'Victoria',
    'Tell Victoria about your professional background.',
    'Напишіть 2–3 речення про свій досвід. Наприклад: I have worked in marketing for three years. In my previous job, I managed online advertising campaigns.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I have worked in marketing for three years. In my previous job, I managed online advertising campaigns.",
        "I have experience in marketing and I worked with online advertising.",
        "I have several years of experience in marketing."
      ]
    }'::jsonb,
    'experience-follow-up',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви описали свій професійний досвід повними реченнями.",
      "feedbackIncorrect": "Спробуйте назвати сферу, досвід і хоча б одну відповідальність."
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "describe professional background",
      "grammar": ["present perfect", "past simple"]
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'experience-follow-up',
    5,
    'dialogue',
    'Victoria',
    'That sounds relevant. What was your main responsibility in your previous role?',
    null,
    '[]'::jsonb,
    null,
    'responsibility-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "interested"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'responsibility-answer',
    6,
    'input',
    'Victoria',
    'Describe one responsibility from your previous work.',
    'Дайте повну відповідь. Наприклад: I was responsible for planning and managing advertising campaigns.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I was responsible for planning and managing advertising campaigns.",
        "I was responsible for managing advertising campaigns.",
        "My main responsibility was managing advertising campaigns."
      ]
    }'::jsonb,
    'strength-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Конструкція was responsible for дуже корисна на співбесідах.",
      "feedbackIncorrect": "Спробуйте конструкцію: I was responsible for..."
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "describe responsibility"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'strength-question',
    7,
    'dialogue',
    'Victoria',
    'What would you say is one of your biggest professional strengths?',
    null,
    '[]'::jsonb,
    null,
    'strength-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "evaluating"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'strength-answer',
    8,
    'choice',
    'Victoria',
    'Choose the strongest interview answer.',
    'Яка відповідь звучить найкраще?',
    '[
      {
        "id": "strong",
        "text": "I''m good at solving problems, and I stay calm when something doesn''t go according to plan.",
        "value": "strong"
      },
      {
        "id": "weak",
        "text": "I''m good.",
        "value": "weak"
      },
      {
        "id": "negative",
        "text": "I don''t really know. I don''t think I have any strengths.",
        "value": "negative"
      }
    ]'::jsonb,
    '{"optionId":"strong"}'::jsonb,
    'problem-question',
    '{}'::jsonb,
    '{
      "mode": "exact",
      "points": 10,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Сильна відповідь називає навичку і пояснює її.",
      "feedbackIncorrect": "На B1 варто не просто назвати сильну сторону, а коротко пояснити її."
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "describe a professional strength"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'problem-question',
    9,
    'dialogue',
    'Victoria',
    'Can you give me an example of a difficult problem you had at work and explain how you solved it?',
    null,
    '[]'::jsonb,
    null,
    'problem-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "challenging"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'problem-answer',
    10,
    'input',
    'Victoria',
    'Describe a problem and how you solved it.',
    'Використайте 2–3 речення: проблема → ваша дія → результат.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "We had a campaign that was not performing well, so I analysed the results and changed our strategy. After that, the results improved.",
        "I had a problem with a project deadline, so I reorganised the work and we finished the project on time.",
        "A project was behind schedule, so I changed our plan and helped the team finish it on time."
      ]
    }'::jsonb,
    'motivation-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви пояснили проблему, дію та результат.",
      "feedbackIncorrect": "Побудуйте відповідь як коротку історію: What happened? What did you do? What was the result?"
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "describe problem solving",
      "grammar": ["past simple", "linking words"],
      "skill": "extended-response"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'motivation-question',
    11,
    'dialogue',
    'Victoria',
    'Thank you. Now tell me, why are you interested in this position?',
    null,
    '[]'::jsonb,
    null,
    'motivation-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "attentive"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'motivation-answer',
    12,
    'input',
    'Victoria',
    'Explain why you want this job.',
    'Дайте аргументовану відповідь англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "I''m interested in this position because it would allow me to use my experience and develop new skills.",
        "I want this job because I believe my experience would be useful to the company and I would like to grow professionally.",
        "This position interests me because I can use my current skills while learning new ones."
      ]
    }'::jsonb,
    'candidate-question',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви не просто сказали, що хочете роботу, а пояснили свою мотивацію.",
      "feedbackIncorrect": "Поясніть дві речі: що ви можете дати компанії і чому ця роль цікава вам."
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "explain motivation"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'candidate-question',
    13,
    'dialogue',
    'Victoria',
    'That makes sense. Before we finish, do you have any questions for me about the role or the company?',
    null,
    '[]'::jsonb,
    null,
    'ask-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "emotion": "friendly"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'ask-question',
    14,
    'input',
    'Victoria',
    'Ask Victoria a useful question about the job.',
    'Поставте професійне запитання. Наприклад, про команду, обов’язки або розвиток.',
    '[]'::jsonb,
    '{
      "acceptedAnswers": [
        "Could you tell me more about the team I would be working with?",
        "What would my main responsibilities be?",
        "What opportunities are there for professional development?",
        "What does a typical day in this role look like?"
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode": "case_insensitive",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Хороше запитання наприкінці співбесіди показує вашу зацікавленість.",
      "feedbackIncorrect": "Поставте запитання про саму роботу, команду або можливості розвитку."
    }'::jsonb,
    '{
      "npcId": "london-independence-job-interview-victoria",
      "role": "Hiring Manager",
      "goal": "ask a professional question"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Співбесіду завершено! Ви представили себе, розповіли про досвід, пояснили свої сильні сторони, навели приклад вирішення проблеми та аргументували свою мотивацію.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary": "Job Interview completed",
      "learnedWords": [
        "professional background",
        "responsibility",
        "strength",
        "solve a problem",
        "previous role",
        "position",
        "professional development"
      ]
    }'::jsonb
  );

end $$;