-- =========================================================
-- TalkHero Campaign #4
-- B2: London Professional
-- Mission #1: Salary Negotiation
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
    'london-professional',
    'London Professional',
    'Розвивайте професійну англійську рівня B2: переговори, презентації, складні робочі розмови, конфлікти та аргументація.',
    'B2',
    'published',
    3,
    $json$
    {
      "adventure": {
        "location": "London, United Kingdom",
        "subtitle": "Говори впевнено. Аргументуй професійно."
      }
    }
    $json$::jsonb
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
    'professional-life',
    'Professional Life',
    'Вирішуйте складні професійні ситуації англійською та вчіться переконувати, домовлятися й захищати свою позицію.',
    0,
    'published',
    $json$
    {
      "adventure": {
        "subtitle": "Кар’єра та професійне спілкування в Лондоні"
      }
    }
    $json$::jsonb
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
    'salary-negotiation',
    'Salary Negotiation',
    'Проведіть переговори про підвищення зарплати: аргументуйте свою цінність, відповідайте на заперечення та знайдіть професійний компроміс.',
    'conversation',
    'B2',
    0,
    18,
    180,
    70,
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
        "subtitle": "Переговори про зарплату",
        "objectives": [
          "професійно розпочати складну розмову",
          "аргументувати свою цінність для компанії",
          "підкріплювати позицію конкретними результатами",
          "реагувати на заперечення менеджера",
          "використовувати дипломатичну мову переговорів",
          "запропонувати компроміс і домовитися про наступний крок"
        ]
      },
      "location": "london-office"
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
    'The Negotiation',
    'Проведіть реальні переговори про зарплату з Richard, Department Manager.',
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
    $txt$Після успішного року в компанії ви домовилися про зустріч із керівником відділу. Ваша мета — обговорити зарплату та переконливо пояснити, чому ваш внесок заслуговує на перегляд компенсації.$txt$,
    null,
    '[]'::jsonb,
    null,
    'richard-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Office",
      "emotion": "focused"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'richard-opening',
    1,
    'dialogue',
    'Richard',
    $txt$Thanks for coming in. You mentioned that you'd like to discuss your salary. What did you have in mind?$txt$,
    null,
    '[]'::jsonb,
    null,
    'open-negotiation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "emotion": "professional"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'open-negotiation',
    2,
    'input',
    'Richard',
    $txt$Open the salary discussion professionally and state what you would like to discuss.$txt$,
    $txt$Почніть переговори самостійно. Будьте прямими, але дипломатичними.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd like to discuss whether my salary could be reviewed in light of my responsibilities and performance.",
        "I was hoping we could discuss my current compensation and whether there is scope for an adjustment."
      ]
    }
    $json$::jsonb,
    'richard-why',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Професійний початок переговорів: ви чітко окреслили тему без ультиматумів.",
      "feedbackIncorrect": "Сформулюйте мету розмови чітко та дипломатично: ви хочете обговорити перегляд компенсації."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "open a salary negotiation professionally",
      "skill": "professional-negotiation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'richard-why',
    3,
    'dialogue',
    'Richard',
    $txt$I see. Before we talk about figures, I'd like to understand your reasoning. Why do you feel a salary review is justified at this point?$txt$,
    null,
    '[]'::jsonb,
    null,
    'justify-review',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "emotion": "evaluating"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'justify-review',
    4,
    'input',
    'Richard',
    $txt$Explain why you believe a salary review is justified.$txt$,
    $txt$Наведіть щонайменше дві причини. Не просіть просто «більше грошей» — аргументуйте свою професійну цінність.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Over the past year, I've taken on additional responsibilities and consistently delivered strong results. I believe my compensation should reflect the scope of my current role.",
        "My responsibilities have increased considerably, and I've also delivered measurable improvements for the team. That's why I think a salary review would be appropriate."
      ]
    }
    $json$::jsonb,
    'evidence-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна аргументація: ви пов’язали запит із відповідальністю та результатами.",
      "feedbackIncorrect": "На B2 позицію потрібно обґрунтувати. Назвіть щонайменше дві професійні причини для перегляду зарплати."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "justify a salary review with multiple professional reasons",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evidence-question',
    5,
    'dialogue',
    'Richard',
    $txt$Those are fair points, but I'd need something more concrete. What specific results can you point to?$txt$,
    null,
    '[]'::jsonb,
    null,
    'evidence-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evidence-answer',
    6,
    'input',
    'Richard',
    $txt$Support your position with a concrete achievement and explain its impact.$txt$,
    $txt$Структура: конкретний результат → ваш внесок → користь для команди або компанії.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I led a project that was delivered ahead of schedule and reduced operating costs by around ten per cent. I coordinated the team and redesigned part of the process.",
        "One example is the client project I took over last quarter. I reorganised the workflow, which helped us meet the deadline and retain the account."
      ]
    }
    $json$::jsonb,
    'budget-objection',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Переконливо. Конкретний результат робить переговорну позицію значно сильнішою.",
      "feedbackIncorrect": "Додайте конкретний приклад: що ви зробили, який був результат і чому він важливий для компанії."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "support a negotiation position with concrete evidence and impact",
      "skill": "supporting-detail",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'budget-objection',
    7,
    'dialogue',
    'Richard',
    $txt$I appreciate what you've achieved. The difficulty is that budgets are quite tight this quarter, so approving an increase may be difficult.$txt$,
    null,
    '[]'::jsonb,
    null,
    'respond-to-objection',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'respond-to-objection',
    8,
    'input',
    'Richard',
    $txt$Respond to Richard's budget objection without abandoning your position.$txt$,
    $txt$Визнайте його аргумент, а потім спокійно поверніться до своєї позиції.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand that budgets are tight. At the same time, given the increase in my responsibilities, I'd still appreciate exploring what might be possible.",
        "I appreciate the budget constraints. However, I think it's worth considering how my role has expanded and whether there is any flexibility."
      ]
    }
    $json$::jsonb,
    'tone-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре: ви визнали обмеження, але не відмовилися від власної позиції.",
      "feedbackIncorrect": "Не ігноруйте заперечення і не здавайте позицію. Спочатку визнайте проблему, потім дипломатично продовжте переговори."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "acknowledge an objection while maintaining a negotiation position",
      "skill": "negotiation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'tone-choice',
    9,
    'choice',
    'Richard',
    $txt$Richard asks what you expect the company to do. Which response keeps the negotiation constructive?$txt$,
    $txt$Оберіть найсильнішу переговорну відповідь.$txt$,
    $json$
    [
      {
        "id": "constructive",
        "text": "I understand the constraints. Could we look at what flexibility there is and discuss an adjustment that works for both sides?",
        "value": "constructive"
      },
      {
        "id": "ultimatum",
        "text": "Either you increase my salary now or I'll leave.",
        "value": "ultimatum"
      },
      {
        "id": "passive",
        "text": "That's fine. Forget I mentioned it.",
        "value": "passive"
      }
    ]
    $json$::jsonb,
    '{"optionId":"constructive"}'::jsonb,
    'salary-expectation',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Ви зберігаєте свою позицію і водночас запрошуєте до пошуку рішення.",
      "feedbackIncorrect": "Сильні переговори — це не ультиматум і не відступ. Шукайте простір для взаємоприйнятного рішення."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "maintain a constructive negotiation tone"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'salary-expectation',
    10,
    'input',
    'Richard',
    $txt$Richard asks: "What sort of adjustment did you have in mind?" State your expectation and justify it.$txt$,
    $txt$Назвіть реалістичне очікування та коротко поясніть, на чому воно ґрунтується.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Based on my expanded responsibilities and performance, I was hoping we could consider an increase of around ten per cent.",
        "I believe an adjustment in the region of eight to ten per cent would fairly reflect the responsibilities I've taken on."
      ]
    }
    $json$::jsonb,
    'counter-offer',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви назвали очікування і пов’язали його з професійним обґрунтуванням.",
      "feedbackIncorrect": "Дайте конкретне очікування та поясніть, чому вважаєте його обґрунтованим."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "state and justify a salary expectation",
      "skill": "negotiation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'counter-offer',
    11,
    'dialogue',
    'Richard',
    $txt$I don't think we could reach that figure immediately. I might be able to support a smaller increase now, with another review in six months.$txt$,
    null,
    '[]'::jsonb,
    null,
    'evaluate-counter-offer',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evaluate-counter-offer',
    12,
    'input',
    'Richard',
    $txt$Respond to the counter-offer. Do not simply accept or reject it: clarify the proposal and negotiate one condition.$txt$,
    $txt$Покажіть B2-рівень: оцініть пропозицію, уточніть деталь і запропонуйте умову або компроміс.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That could be a reasonable starting point. Could you clarify what increase would be possible now? If we agree on clear performance targets, I'd be comfortable reviewing the figure again in six months.",
        "I'm open to that approach, although I'd like to understand the initial increase. Could we also agree in writing on the objectives for the six-month review?"
      ]
    }
    $json$::jsonb,
    'benefits-option',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна B2-відповідь: ви не просто погодилися або відмовилися, а уточнили умови та продовжили переговори.",
      "feedbackIncorrect": "Не обмежуйтеся yes/no. Уточніть пропозицію та додайте одну конкретну умову або компроміс."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "evaluate a counter-offer, seek clarification and negotiate a condition",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'benefits-option',
    13,
    'choice',
    'Richard',
    $txt$Richard says there is very little room in the salary budget. What is the best next move?$txt$,
    $txt$Оберіть відповідь, яка розширює переговори замість повторення тієї самої вимоги.$txt$,
    $json$
    [
      {
        "id": "alternative",
        "text": "If there isn't much flexibility on salary, could we discuss other parts of the package, such as additional leave or professional development?",
        "value": "alternative"
      },
      {
        "id": "repeat",
        "text": "I already told you I want more money.",
        "value": "repeat"
      },
      {
        "id": "end",
        "text": "Never mind. Let's stop talking about it.",
        "value": "end"
      }
    ]
    $json$::jsonb,
    '{"optionId":"alternative"}'::jsonb,
    'final-negotiation',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. На B2 ви можете розширити переговори на весь компенсаційний пакет.",
      "feedbackIncorrect": "Якщо одна частина пропозиції обмежена, шукайте інші переговорні змінні."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "identify alternative negotiation options"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-negotiation',
    14,
    'input',
    'Richard',
    $txt$Bring the negotiation to a professional conclusion. Summarise what you want, acknowledge the company's position, and propose a concrete next step.$txt$,
    $txt$Фінальне завдання: позиція → визнання обмежень → компроміс або наступний крок. Сформулюйте відповідь самостійно.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I appreciate the budget constraints, and I understand that the full increase may not be possible immediately. I'd be happy to discuss a smaller adjustment now, provided we agree on clear targets and a formal salary review in six months.",
        "I understand the company's position. My preference would still be an adjustment that reflects my expanded responsibilities, but I'm open to a staged increase if we can agree on a clear review date and objectives."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви підсумували позицію, врахували інтереси іншої сторони та запропонували конкретний шлях уперед.",
      "feedbackIncorrect": "Фінальна відповідь має поєднати три елементи: вашу позицію, визнання обмежень компанії та конкретний наступний крок."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-salary-negotiation-richard",
      "role": "Department Manager",
      "goal": "synthesise a negotiation position and propose a concrete agreement",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Переговори завершено! Ви аргументували свою цінність, підкріпили позицію результатами, відповіли на заперечення, обговорили компроміс і професійно завершили переговори.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Salary Negotiation completed",
      "learnedWords": [
        "salary review",
        "compensation",
        "expanded responsibilities",
        "budget constraints",
        "salary adjustment",
        "counter-offer",
        "performance targets",
        "compensation package"
      ]
    }
    $json$::jsonb
  );

end $$;