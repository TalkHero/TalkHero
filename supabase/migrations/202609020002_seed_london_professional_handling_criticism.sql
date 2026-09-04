-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #3: Handling Criticism
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
  where slug = 'london-professional';

  if campaign_uuid is null then
    raise exception 'Campaign london-professional not found';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'professional-life';

  if episode_uuid is null then
    raise exception 'Episode professional-life not found';
  end if;


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
    'handling-criticism',
    'Handling Criticism',
    'Отримайте складний професійний feedback, уточніть критику, визнайте справедливі зауваження, аргументовано захистіть свою позицію та домовтеся про конкретні зміни.',
    'conversation',
    'B2',
    2,
    19,
    200,
    80,
    'published',
    $json$
    {
      "version": 1,
      "sceneCount": 16
    }
    $json$::jsonb,
    $json$
    {
      "adventure": {
        "campaignSlug": "london-professional",
        "subtitle": "Професійна реакція на складний feedback",
        "objectives": [
          "спокійно реагувати на професійну критику",
          "просити конкретні приклади замість загальних оцінок",
          "визнавати справедливу частину критики",
          "пояснювати контекст без виправдань",
          "коректно не погоджуватися з несправедливою оцінкою",
          "відокремлювати намір від результату",
          "перетворювати feedback на конкретний план дій",
          "підсумовувати домовленості професійною мовою"
        ]
      },
      "location": "london-project-office"
    }
    $json$::jsonb
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
    'The Review',
    'Обговоріть із Daniel результати останнього проєкту та професійно відреагуйте на складний feedback.',
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
    'briefing',
    0,
    'narration',
    null,
    $txt$Ви щойно завершили важливий клієнтський проєкт. Результат загалом позитивний, але під час роботи виникли затримки та проблеми з комунікацією. Daniel, Senior Project Lead, запросив вас на review. Вам потрібно вислухати критику, зрозуміти її суть і домовитися про те, що змінити наступного разу.$txt$,
    null,
    '[]'::jsonb,
    null,
    'daniel-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Project Office"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'daniel-opening',
    1,
    'dialogue',
    'Daniel',
    $txt$Thanks for coming in. The client was happy with the final result, but getting there was harder than it should have been. I want to talk about how the project was managed.$txt$,
    null,
    '[]'::jsonb,
    null,
    'initial-response',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'initial-response',
    2,
    'input',
    'Daniel',
    $txt$Respond professionally to Daniel's opening criticism and show that you are ready to discuss it.$txt$,
    $txt$Відреагуйте спокійно. Не захищайтеся одразу і не погоджуйтеся автоматично з усією критикою.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Thanks for raising it. I'm happy to go through what happened and understand where you think the process could have been better.",
        "I appreciate the feedback. I'd like to understand the concerns in more detail so we can look at what should change next time."
      ]
    }
    $json$::jsonb,
    'vague-criticism',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви прийняли розмову професійно, не переходячи ні до захисту, ні до безумовної згоди.",
      "feedbackIncorrect": "Покажіть готовність вислухати feedback. Уникайте агресивного захисту або автоматичного визнання провини."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "respond calmly and invite specific professional feedback",
      "skill": "professional-communication",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'vague-criticism',
    3,
    'dialogue',
    'Daniel',
    $txt$The main issue is that your communication wasn't good enough. At several points, I wasn't sure what was happening.$txt$,
    null,
    '[]'::jsonb,
    null,
    'ask-for-specifics',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'ask-for-specifics',
    4,
    'input',
    'Daniel',
    $txt$Ask Daniel for specific examples so you can understand the criticism properly.$txt$,
    $txt$Не сперечайтеся із загальною оцінкою. Попросіть конкретний приклад або ситуацію.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Could you give me a specific example of when the communication wasn't clear? That would help me understand exactly what I need to improve.",
        "I understand the concern. Could you point to one or two situations where you felt you didn't have enough information?"
      ]
    }
    $json$::jsonb,
    'specific-example',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви перетворили загальну критику на конкретну інформацію, з якою можна працювати.",
      "feedbackIncorrect": "Попросіть конкретний приклад. На B2 важливо вміти уточнювати нечіткий feedback, а не лише погоджуватися або заперечувати."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "request specific evidence behind vague criticism",
      "skill": "clarification",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'specific-example',
    5,
    'dialogue',
    'Daniel',
    $txt$Sure. When the supplier told you on Tuesday that delivery might be late, you waited until Thursday to tell the rest of us. By then, we had very little time to adjust the schedule.$txt$,
    null,
    '[]'::jsonb,
    null,
    'acknowledge-valid-point',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'acknowledge-valid-point',
    6,
    'input',
    'Daniel',
    $txt$Acknowledge the valid part of Daniel's criticism and explain briefly what you should have done differently.$txt$,
    $txt$Визнайте конкретну помилку без довгих виправдань і назвіть кращу дію.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That's fair. I should have told the team as soon as I knew there was a serious risk of delay, even though the supplier hadn't confirmed it yet.",
        "I agree with that point. Waiting for confirmation meant the team had less time to react. I should have flagged the risk earlier."
      ]
    }
    $json$::jsonb,
    'context-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна реакція: ви визнали конкретну проблему та назвали кращу альтернативну дію.",
      "feedbackIncorrect": "Визнайте саме обґрунтовану частину критики та поясніть, що варто було зробити інакше."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "acknowledge valid criticism and identify a better action",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'context-question',
    7,
    'dialogue',
    'Daniel',
    $txt$There's another issue. I felt you spent too much time trying to solve problems yourself instead of involving the team.$txt$,
    null,
    '[]'::jsonb,
    null,
    'explain-context',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'explain-context',
    8,
    'input',
    'Daniel',
    $txt$Explain your reasoning without turning it into an excuse. Acknowledge the impact of your decision.$txt$,
    $txt$Поясніть, чому ви діяли саме так, але покажіть, що розумієте негативний результат цього рішення.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "My intention was to avoid distracting the team with issues I thought I could resolve quickly myself. However, I can see that this reduced visibility and made it harder for others to support the project.",
        "I was trying to protect the team's time by handling smaller problems independently. Looking back, I can see that I kept too much information to myself and should have involved people earlier."
      ]
    }
    $json$::jsonb,
    'unfair-criticism',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви пояснили намір, але не використали його як виправдання і визнали наслідок свого рішення.",
      "feedbackIncorrect": "Пояснення контексту не повинно звучати як виправдання. Покажіть і вашу логіку, і негативний вплив рішення."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "explain context without becoming defensive or avoiding responsibility",
      "skill": "perspective-taking",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'unfair-criticism',
    9,
    'dialogue',
    'Daniel',
    $txt$To be honest, I also think the deadline problem was mainly your responsibility. You were managing the project, after all.$txt$,
    null,
    '[]'::jsonb,
    null,
    'respectful-disagreement',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'respectful-disagreement',
    10,
    'input',
    'Daniel',
    $txt$Disagree professionally with the idea that the deadline problem was mainly your responsibility. Accept your part, but explain the wider context.$txt$,
    $txt$Не погоджуйтеся автоматично. Визнайте свою частину відповідальності, але аргументовано поясніть інші фактори.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I accept that I should have communicated the risk earlier, but I don't think the delay was mainly caused by my project management. The supplier changed the delivery date unexpectedly, and the client also requested additional work late in the process.",
        "I agree that I could have managed the communication better. However, I'd distinguish that from the cause of the delay itself, because both the supplier issue and the client's late changes affected the schedule."
      ]
    }
    $json$::jsonb,
    'daniel-response',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна B2-відповідь: ви взяли відповідальність за свою частину, але професійно відокремили її від інших причин проблеми.",
      "feedbackIncorrect": "Потрібен баланс: визнайте власну частину відповідальності, але аргументовано поясніть, чому проблема мала й інші причини."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "disagree respectfully while accepting appropriate responsibility",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'daniel-response',
    11,
    'dialogue',
    'Daniel',
    $txt$That's a fair distinction. I'm not saying you caused every problem. What I need is confidence that risks will become visible earlier next time. What would you change?$txt$,
    null,
    '[]'::jsonb,
    null,
    'action-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'action-plan',
    12,
    'input',
    'Daniel',
    $txt$Propose a concrete plan for improving communication and risk management on the next project.$txt$,
    $txt$Запропонуйте щонайменше дві конкретні зміни в поведінці або процесі. Уникайте абстрактного «I will communicate better».$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "On the next project, I'll flag significant risks as soon as they appear instead of waiting for confirmation. I'd also add a short weekly risk update so the team can see potential issues and decide together when action is needed.",
        "I'd introduce two changes: first, I'll report possible schedule risks immediately, and second, I'll use our weekly project meeting to review open risks, owners and next actions with the team."
      ]
    }
    $json$::jsonb,
    'priority-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви перетворили criticism на конкретні зміни, які можна реально застосувати.",
      "feedbackIncorrect": "План поки занадто загальний. Назвіть щонайменше дві конкретні зміни в комунікації або управлінні ризиками."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "turn feedback into a concrete improvement plan with multiple actions",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'priority-choice',
    13,
    'choice',
    'Daniel',
    $txt$Daniel asks what you would do if a new risk appeared but you did not yet know whether it would become a real problem. Which response best reflects what you have learned?$txt$,
    $txt$Оберіть найкращу професійну реакцію на невизначений ризик.$txt$,
    $json$
    [
      {
        "id": "flag-risk",
        "text": "I'd flag it as a potential risk, explain what we know and don't know yet, and update the team when more information becomes available.",
        "value": "flag-risk"
      },
      {
        "id": "wait-confirmation",
        "text": "I'd wait until I was certain it would cause a problem before mentioning it.",
        "value": "wait-confirmation"
      },
      {
        "id": "escalate-everything",
        "text": "I'd immediately escalate every possible issue to senior management.",
        "value": "escalate-everything"
      }
    ]
    $json$::jsonb,
    '{"optionId":"flag-risk"}'::jsonb,
    'final-summary',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Професійне risk communication не вимагає чекати повної впевненості — важливо чітко позначити рівень невизначеності.",
      "feedbackIncorrect": "Не потрібно ні приховувати невизначений ризик, ні негайно ескалувати кожну дрібницю. Потрібна прозора та пропорційна комунікація."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "communicate uncertain risks proportionately"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-summary',
    14,
    'input',
    'Daniel',
    $txt$Summarise what you have taken from the feedback, where you agree or disagree, and what you will do differently on the next project.$txt$,
    $txt$Фінальна B2-відповідь: справедлива критика → ваш контекст → коректна незгода → конкретні зміни.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I agree that I should have communicated risks earlier and involved the team sooner when problems appeared. My intention was to resolve issues without creating unnecessary distractions, but I can see that this reduced visibility. I don't think I was solely responsible for the deadline because the supplier delay and late client changes also affected the schedule. On the next project, I'll flag risks earlier and introduce regular risk reviews with the team.",
        "The main thing I've taken from this is that I need to make potential problems visible earlier, even when I don't have all the information yet. I accept the criticism about communication, although I think the deadline itself had several causes rather than being mainly my responsibility. Next time I'll report risks sooner and review them regularly with the team."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви показали зрілу реакцію на criticism: прийняли справедливу частину, зберегли власну позицію та сформували конкретний план змін.",
      "feedbackIncorrect": "Підсумуйте всі ключові частини розмови: що ви приймаєте, де бачите ширший контекст або не погоджуєтесь і що конкретно зміните."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-handling-criticism-daniel",
      "role": "Senior Project Lead",
      "goal": "synthesise criticism, responsibility, disagreement and an improvement plan",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Review завершено. Ви уточнили нечітку критику, визнали справедливі зауваження, пояснили контекст без виправдань, професійно не погодилися з надмірною оцінкою відповідальності та перетворили feedback на конкретний план дій.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Handling Criticism completed",
      "learnedWords": [
        "feedback",
        "specific example",
        "visibility",
        "responsibility",
        "context",
        "risk",
        "flag an issue",
        "action plan"
      ]
    }
    $json$::jsonb
  );

end $$;