-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #5: Client Meeting
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
    'client-meeting',
    'Client Meeting',
    'Проведіть складну зустріч із клієнтом: уточніть нечіткі вимоги, визначте бізнес-ціль, керуйте змінами scope, пояснюйте trade-offs та домовтеся про реалістичний план.',
    'conversation',
    'B2',
    4,
    20,
    220,
    90,
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
        "subtitle": "Складна зустріч із клієнтом",
        "objectives": [
          "уточнювати нечіткі вимоги клієнта",
          "визначати справжню бізнес-ціль запиту",
          "ставити професійні probing questions",
          "дипломатично перевіряти припущення клієнта",
          "розпізнавати розширення scope",
          "не давати нереалістичних обіцянок",
          "пояснювати trade-offs між scope, часом і ресурсами",
          "пропонувати альтернативні рішення",
          "узгоджувати конкретні наступні кроки"
        ]
      },
      "location": "london-client-office"
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
    'Managing Expectations',
    'Уточніть потреби клієнта та домовтеся про реалістичний scope.',
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
    $txt$Ваша команда готує оновлення цифрової платформи для важливого клієнта. Основний scope уже погоджено, а запуск запланований через чотири тижні. На сьогоднішній зустрічі Arjun, Client Partner, хоче обговорити нову ідею клієнта. Запит звучить просто, але його вплив на проєкт поки незрозумілий.$txt$,
    null,
    '[]'::jsonb,
    null,
    'arjun-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Client Office"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'arjun-opening',
    1,
    'dialogue',
    'Arjun',
    $txt$Thanks for joining. The client has asked if we can make the new platform more personalised. They want users to see content that's more relevant to them. It sounds like a fairly small change. Can we add that?$txt$,
    null,
    '[]'::jsonb,
    null,
    'clarify-request',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'clarify-request',
    2,
    'input',
    'Arjun',
    $txt$Do not accept or reject the request yet. Ask focused questions to clarify what "more personalised" actually means.$txt$,
    $txt$Поставте щонайменше два конкретні запитання, щоб перетворити нечіткий запит на зрозумілі вимоги.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Before we decide, could we clarify what the client means by personalised? Are they thinking about different content based on user profiles, previous behaviour or something else? And which parts of the platform would need to change?",
        "I'd like to understand the request in more detail first. What information would determine which content a user sees, and does the client want personalisation across the whole platform or only on specific pages?"
      ]
    }
    $json$::jsonb,
    'arjun-business-goal',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не погодилися з нечітким scope автоматично, а спочатку перетворили запит на конкретні питання.",
      "feedbackIncorrect": "Не поспішайте пропонувати рішення. Спочатку уточніть, що саме означає personalisation і де вона має працювати."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "clarify an ambiguous client request using multiple focused questions",
      "skill": "clarification",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'arjun-business-goal',
    3,
    'dialogue',
    'Arjun',
    $txt$They haven't defined all of that yet. What they keep saying is that users aren't engaging enough with the platform, and they think personalisation will improve engagement.$txt$,
    null,
    '[]'::jsonb,
    null,
    'probe-goal',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'probe-goal',
    4,
    'input',
    'Arjun',
    $txt$Move from the proposed solution to the underlying business problem. Ask how success would be measured and what evidence supports the assumption.$txt$,
    $txt$Не обговорюйте лише feature. З'ясуйте, яку проблему клієнт намагається вирішити і як він зрозуміє, що рішення спрацювало.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "If engagement is the main problem, could we define what improvement the client actually wants to see? For example, are they trying to increase return visits, time on the platform or conversions? And do we know that lack of personalisation is the main reason engagement is low?",
        "Before choosing personalisation as the solution, I'd like to understand the target outcome. Which engagement metric needs to improve, and what evidence suggests personalisation is the factor currently limiting it?"
      ]
    }
    $json$::jsonb,
    'arjun-assumption',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви перевели розмову з feature на бізнес-результат і перевірили припущення, що саме personalisation вирішить проблему.",
      "feedbackIncorrect": "Потрібно з'ясувати дві речі: який бізнес-результат потрібен клієнту і чому він вважає personalisation правильним рішенням."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "identify the business outcome and test the assumption behind a proposed solution",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'arjun-assumption',
    5,
    'dialogue',
    'Arjun',
    $txt$That's fair. We don't actually know that personalisation is the main issue. The client saw a competitor doing it and liked the idea. But they still want something personalised in the launch.$txt$,
    null,
    '[]'::jsonb,
    null,
    'challenge-assumption',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'challenge-assumption',
    6,
    'input',
    'Arjun',
    $txt$Challenge the assumption diplomatically. Do not dismiss the client's idea; explain why copying the competitor may not automatically solve the client's problem.$txt$,
    $txt$Поставте під сумнів рішення, але не саму компетентність клієнта. Запропонуйте перевірити ідею через їхню власну бізнес-ціль.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Personalisation may still be worth exploring, but I'd be careful about assuming that what works for a competitor will produce the same result here. Their users and business model may be different. Could we test a smaller version against the engagement metric the client actually wants to improve?",
        "I can see why the competitor example is attractive, but it doesn't necessarily mean the same feature will solve our client's engagement problem. I'd suggest we define the outcome first and test a focused version before committing to a larger implementation."
      ]
    }
    $json$::jsonb,
    'arjun-scope-change',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви поставили припущення під сумнів без конфронтації та прив'язали рішення до бізнес-результату.",
      "feedbackIncorrect": "Не відкидайте ідею клієнта повністю. Визнайте її потенціал, але поясніть, чому конкурентний приклад ще не доводить її цінність."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "challenge a client's assumption diplomatically using business reasoning",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'arjun-scope-change',
    7,
    'dialogue',
    'Arjun',
    $txt$Let's say we keep it simple. They want personalised recommendations on the home page, based on each user's previous activity. They'd still like to keep the launch date four weeks from now. Can we just add it without changing the deadline?$txt$,
    null,
    '[]'::jsonb,
    null,
    'manage-expectations',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'manage-expectations',
    8,
    'input',
    'Arjun',
    $txt$Respond without making an unsupported promise. Explain what must be assessed before confirming the same deadline.$txt$,
    $txt$Не кажіть просто yes або no. Покажіть залежність між новим scope, технічною складністю, ресурсами та дедлайном.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I wouldn't want to promise the same deadline before we assess the impact. Recommendations based on user activity add new data and technical requirements, so we'd need to estimate the work and see what it does to the current plan. Once we've done that, we can confirm whether four weeks is realistic or discuss what needs to change.",
        "Potentially, but I don't think we should commit yet. We first need to understand the technical effort, dependencies and available capacity. Then we can decide whether the feature fits within four weeks or whether we need to adjust the scope, resources or timeline."
      ]
    }
    $json$::jsonb,
    'arjun-pressure',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви не дали непідтвердженої обіцянки та пояснили, що deadline залежить від оцінки нового scope.",
      "feedbackIncorrect": "Не обіцяйте результат без оцінки. Поясніть, що спочатку потрібно перевірити effort, dependencies і capacity."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "manage client expectations without making an unsupported delivery commitment",
      "skill": "expectation-management",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'arjun-pressure',
    9,
    'dialogue',
    'Arjun',
    $txt$I understand, but the client really doesn't want to hear that the date might move. Couldn't we just commit to it now and work out the details afterwards?$txt$,
    null,
    '[]'::jsonb,
    null,
    'resist-pressure',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'resist-pressure',
    10,
    'input',
    'Arjun',
    $txt$Resist the pressure professionally. Protect trust with the client while offering a constructive next step.$txt$,
    $txt$Не погоджуйтеся на свідомо неперевірену обіцянку. Поясніть ризик і запропонуйте спосіб швидко отримати відповідь.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd rather give the client a reliable answer than make a commitment we may have to reverse later. That could damage trust more than being transparent now. We can prioritise the impact assessment and come back with options tomorrow, including what we can deliver within the existing date.",
        "I don't think committing before we understand the impact would be responsible. If we later discover the work can't fit, we'd put the client in a worse position. Let's assess it immediately and give them a clear set of options based on what is actually achievable."
      ]
    }
    $json$::jsonb,
    'arjun-tradeoff',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь. Ви захистили довіру клієнта, відмовившись від неперевіреної обіцянки, але запропонували швидкий конструктивний наступний крок.",
      "feedbackIncorrect": "Не достатньо просто відмовити. Поясніть ризик для довіри клієнта та запропонуйте конкретний спосіб швидко рухатися далі."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "resist pressure to make an unsupported commitment while preserving client trust",
      "skill": "professional-judgement",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'arjun-tradeoff',
    11,
    'dialogue',
    'Arjun',
    $txt$All right. Suppose the team estimates that full personalisation would add three weeks, but a simpler version could still fit into the current launch. How would you present those options to the client?$txt$,
    null,
    '[]'::jsonb,
    null,
    'present-tradeoffs',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'present-tradeoffs',
    12,
    'input',
    'Arjun',
    $txt$Present at least two realistic options and make the trade-off between scope and timeline explicit.$txt$,
    $txt$Не шукайте магічного рішення без компромісів. Дайте клієнту реальний вибір із наслідками кожного варіанта.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We could offer two options. If the four-week launch date is the priority, we can deliver a simpler version of personalisation now and evaluate its impact after launch. If the client wants the full recommendation system, we'd need approximately three additional weeks. The choice is essentially between keeping the date with reduced scope or extending the timeline for the complete feature.",
        "One option is to keep the existing launch and introduce a limited recommendation feature that we can expand later. The second is to implement the full solution, but that would move the launch by around three weeks. I'd explain the benefits and risks of each and ask which objective matters more to the client."
      ]
    }
    $json$::jsonb,
    'decision-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви зробили trade-off явним і дали клієнту реальний вибір між scope та timeline.",
      "feedbackIncorrect": "Потрібно представити щонайменше два реалістичні варіанти та чітко пояснити наслідки кожного."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "present realistic delivery options with explicit scope and timeline trade-offs",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'decision-choice',
    13,
    'choice',
    'Arjun',
    $txt$The client says the launch date is fixed because of a marketing campaign. Which response best manages the constraint?$txt$,
    $txt$Оберіть відповідь, яка поважає fixed deadline, але не приховує його вплив на scope.$txt$,
    $json$
    [
      {
        "id": "reduce-scope",
        "text": "If the launch date is fixed, let's agree on the smaller version for launch and define the full personalisation as a follow-up phase.",
        "value": "reduce-scope"
      },
      {
        "id": "promise-full",
        "text": "We'll keep the date and deliver the full feature. The team will find a way.",
        "value": "promise-full"
      },
      {
        "id": "reject-request",
        "text": "Then personalisation isn't possible and we should remove it completely.",
        "value": "reject-request"
      }
    ]
    $json$::jsonb,
    '{"optionId":"reduce-scope"}'::jsonb,
    'final-agreement',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Fixed deadline стає явним constraint, тому scope адаптується замість нереалістичної обіцянки.",
      "feedbackIncorrect": "Якщо deadline справді fixed, рішення має враховувати це через зміну scope або phased delivery."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "apply a scope-time trade-off under a fixed deadline"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-agreement',
    14,
    'input',
    'Arjun',
    $txt$Summarise what you would confirm with the client: their business objective, what will be delivered for the fixed launch, what will happen later, and the immediate next steps.$txt$,
    $txt$Фінальна B2-відповідь: business goal → agreed launch scope → deferred scope → next steps / ownership.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Our goal is to improve user engagement, and we'll measure whether the new experience actually supports that objective. Because the launch date is fixed, we'll deliver a focused version of personalisation at launch rather than the full recommendation system. The more advanced functionality will be planned as a second phase. We'll confirm the exact launch requirements with the client, complete the technical estimate and agree how we'll measure the result before development begins.",
        "We've agreed that improving engagement is the business objective and that the marketing launch date cannot move. For that release, we'll implement the smaller personalisation option that fits the current timeline. Full behavioural recommendations will move to a later phase. Our next steps are to document the reduced scope, confirm it with the client and define the success metric and follow-up plan."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви перетворили нечіткий запит на конкретну домовленість із бізнес-ціллю, scope, constraint та наступними кроками.",
      "feedbackIncorrect": "Підсумок має зафіксувати чотири речі: бізнес-ціль, launch scope, відкладений scope і конкретні наступні кроки."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-client-meeting-arjun",
      "role": "Client Partner",
      "goal": "synthesise business objective, agreed scope, constraints and next steps",
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
    $txt$Зустріч завершено. Ви уточнили нечіткий запит, визначили бізнес-ціль, перевірили припущення клієнта, не дали непідтвердженої обіцянки та перетворили конфлікт між scope і deadline на конкретний план.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Client Meeting completed",
      "learnedWords": [
        "scope",
        "trade-off",
        "constraint",
        "assumption",
        "engagement",
        "dependency",
        "capacity",
        "phased delivery"
      ]
    }
    $json$::jsonb
  );

end $$;