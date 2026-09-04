-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #12: The Promotion
-- Final B2 Capstone
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
  where slug = 'london-professional';

  if campaign_uuid is null then
    raise exception 'Campaign london-professional not found';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'professional-life';

  if episode_uuid is null then
    raise exception 'Episode professional-life not found';
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
    'the-promotion',
    'The Promotion',
    'Пройдіть фінальний B2 promotion review: доведіть свій impact через evidence, покажіть leadership, професійно працюйте з критикою, обговоріть areas for growth і сформулюйте переконливий case for promotion.',
    'conversation',
    'B2',
    11,
    24,
    280,
    110,
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
        "subtitle": "Доведіть, що готові до наступного рівня",
        "objectives": [
          "будувати promotion case навколо impact, а не tenure",
          "підкріплювати achievements конкретними evidence",
          "пояснювати leadership через поведінку та результати",
          "чесно говорити про areas for development",
          "відповідати на критичний feedback без defensive tone",
          "професійно не погоджуватися зі stakeholder",
          "відрізняти effort від measurable impact",
          "обговорювати compensation без ультиматумів",
          "формулювати expectations наступного рівня",
          "створювати concrete development plan",
          "синтезувати сильний final promotion case"
        ]
      },
      "location": "london-promotion-review",
      "capstone": true
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
    'Making the Case',
    'Покажіть не лише те, що ви вже зробили, а й те, що готові працювати на наступному рівні відповідальності.',
    0,
    'published',
    false,
    '{"adventure":true,"capstone":true}'::jsonb
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
    quest_uuid, act_uuid, 'briefing', 0, 'narration', null,
    $txt$Минув рік відтоді, як ви приєдналися до компанії. Ви подали заявку на підвищення до senior-level position. Сьогодні відбувається фінальний cross-functional promotion review. Панель уже бачила ваші performance notes, але тепер хоче зрозуміти не лише що ви виконували, а який business impact створили, як поводитеся в складних ситуаціях і чи готові працювати на ширшому рівні відповідальності. Laura, Client Success Manager, представляє stakeholder perspective на panel.$txt$,
    null,
    '[]'::jsonb,
    null,
    'laura-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Promotion Review",
      "capstone": true
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'laura-opening', 1, 'dialogue', 'Laura',
    $txt$Thanks for joining us. Let's start with the most important question. Why do you believe you're ready for the next level now?$txt$,
    null,
    '[]'::jsonb,
    null,
    'promotion-case',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'promotion-case', 2, 'input', 'Laura',
    $txt$Make an initial promotion case. Focus on increased scope, measurable impact and behaviour that already reflects the next level. Do not argue that you deserve promotion simply because you have worked hard or waited long enough.$txt$,
    $txt$Поясніть readiness через scope → impact → next-level behaviour. Не використовуйте tenure або effort як головний аргумент.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I believe I'm ready because my role has expanded beyond delivering my own work. Over the last year I've taken ownership of cross-functional problems, helped teams make clearer decisions and contributed to outcomes that affected customers and the wider business. I'm already operating with more independence and broader responsibility, and I'd like the role to reflect that level of contribution.",
        "My case isn't based on how long I've been here. It's based on the scope I'm already handling. I've moved from executing assigned work to owning outcomes across teams, supporting decisions with evidence and taking responsibility when projects become difficult. I believe those behaviours are consistent with the expectations of the next level."
      ]
    }
    $json$::jsonb,
    'laura-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви будуєте promotion case навколо scope, impact і next-level behaviour, а не просто стажу або effort.",
      "feedbackIncorrect": "Не аргументуйте promotion через 'я давно працюю' або 'я дуже стараюся'. Покажіть, як змінилися ваш scope, ownership та impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "make an evidence-oriented case for readiness at the next professional level",
      "skill": "argumentation",
      "cefr": "B2",
      "capstoneCompetencies": [
        "clarity",
        "professional-appropriateness",
        "self-advocacy"
      ]
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'laura-evidence', 3, 'dialogue', 'Laura',
    $txt$That's a reasonable overview, but it's still quite broad. Give me one example where your contribution produced a result that wouldn't have happened in the same way without you.$txt$,
    null,
    '[]'::jsonb,
    null,
    'prove-impact',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'prove-impact', 4, 'input', 'Laura',
    $txt$Give a concrete achievement. Explain the situation, your specific contribution and the resulting business or customer impact. Avoid claiming credit for the entire team's work.$txt$,
    $txt$Дайте evidence-based example: situation → your contribution → measurable or observable impact. Не привласнюйте результат усієї команди.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "One example was a project where customer onboarding was generating repeated support issues. I analysed where users were dropping out, brought product and support together around the same evidence and proposed simplifying two steps in the flow. The wider team implemented the solution, and support contacts related to onboarding fell by roughly 20% over the following month. My contribution was identifying the pattern and creating alignment around the change, rather than delivering the whole outcome alone.",
        "During a difficult launch, different teams were working from conflicting priorities. I created a shared decision framework, clarified which customer outcomes mattered most and helped the group reduce the scope before the deadline. The project launched on time with the critical functionality protected. It was a team result, but my specific contribution was helping the team reach and execute the trade-off."
      ]
    }
    $json$::jsonb,
    'laura-leadership',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви відділили власний contribution від team result і показали concrete impact.",
      "feedbackIncorrect": "Потрібен конкретний приклад. Поясніть situation, вашу особисту дію та результат, не кажучи, що весь командний успіх належить вам."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "demonstrate professional impact with specific evidence without overstating personal credit",
      "skill": "evidence-based-communication",
      "cefr": "B2",
      "capstoneCompetencies": [
        "supporting-detail",
        "naturalness",
        "credibility"
      ]
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'laura-leadership', 5, 'dialogue', 'Laura',
    $txt$At the next level, we expect people to influence outcomes even when nobody formally reports to them. Tell me about a situation where you had to lead without authority.$txt$,
    null,
    '[]'::jsonb,
    null,
    'leadership-example',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'leadership-example', 6, 'input', 'Laura',
    $txt$Explain how you influenced people without relying on title or authority. Show listening, alignment and ownership rather than simply telling others what to do.$txt$,
    $txt$Опишіть leadership without authority: disagreement/context → how you created alignment → action → result.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "On one project, product wanted to add scope while operations wanted to protect the deadline. I didn't have authority over either team, so I started by making each side's constraints explicit. I brought the discussion back to the customer outcome we all agreed mattered most, then helped the group compare the trade-offs against that outcome. We agreed to protect the critical launch and move two lower-priority items into the next phase. I led the decision process rather than directing the people.",
        "I had to coordinate a response across support, product and engineering during an issue that didn't have a clear owner. Rather than assigning tasks myself, I clarified what each team knew, proposed a common priority and asked people to take ownership of specific actions. That gave the group enough structure to move quickly without pretending I had authority I didn't have."
      ]
    }
    $json$::jsonb,
    'laura-weakness',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви показали leadership як influence, alignment і ownership, а не як накази без формальної влади.",
      "feedbackIncorrect": "Не описуйте leadership лише як 'я сказав усім, що робити'. Покажіть listening, alignment, influence і shared ownership."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "demonstrate leadership through influence rather than formal authority",
      "skill": "leadership-communication",
      "cefr": "B2",
      "capstoneCompetencies": [
        "perspective-taking",
        "problem-solving",
        "professional-communication"
      ]
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'laura-weakness', 7, 'dialogue', 'Laura',
    $txt$The feedback I've read is positive overall, but one theme appears more than once: when you're under pressure, you sometimes move into solution mode before you've fully heard other people's concerns. How do you respond to that?$txt$,
    null,
    '[]'::jsonb,
    null,
    'discuss-weakness',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'discuss-weakness', 8, 'input', 'Laura',
    $txt$Respond to the weakness credibly. Acknowledge the behaviour, explain its impact and describe what you are doing differently. Do not disguise a strength as a fake weakness.$txt$,
    $txt$Сильна відповідь: acknowledge → impact → concrete change → evidence of progress. Не використовуйте «I care too much» або «I'm a perfectionist». $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think that's fair. When I see a problem developing quickly, my instinct is to start solving it, and that can mean I move ahead before everyone feels heard. The risk is that I solve the wrong part of the problem or lose useful context. I've been working on summarising what I've heard before proposing a solution and explicitly asking whether I've missed any constraints. I still need to practise that under pressure, but it has improved the quality of some recent discussions.",
        "I recognise that pattern. Speed is useful in a crisis, but I've sometimes treated speed as more important than understanding. I'm trying to create a short pause between diagnosis and solution by checking the assumptions with the people closest to the issue. That has helped me avoid jumping to a solution too early."
      ]
    }
    $json$::jsonb,
    'laura-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не заперечили feedback і не перетворили weakness на fake strength. Є awareness, impact і конкретна behavioural change.",
      "feedbackIncorrect": "Не захищайтеся і не використовуйте cliché weakness. Визнайте поведінку, її impact та конкретну зміну, яку практикуєте."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "respond constructively to developmental feedback with self-awareness and a concrete improvement plan",
      "skill": "self-reflection",
      "cefr": "B2",
      "capstoneCompetencies": [
        "critical-evaluation",
        "appropriateness",
        "naturalness"
      ]
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'laura-challenge', 9, 'dialogue', 'Laura',
    $txt$Let me challenge your promotion case. Some of the examples you've described sound like strong performance at your current level, not necessarily evidence that you're already operating at the next one. Why should the panel interpret them differently?$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-disagreement',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'handle-disagreement', 10, 'input', 'Laura',
    $txt$Disagree professionally if appropriate. Do not become defensive. Explain the distinction between performing strongly within your current scope and consistently taking responsibility beyond it.$txt$,
    $txt$Відповідь має: acknowledge concern → clarify distinction → evidence → no entitlement.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand the concern, and I agree that doing my current role well wouldn't be enough on its own. The distinction I'd make is that several of these examples involved ownership beyond my formal scope: aligning teams I didn't manage, making cross-functional trade-offs and being accountable for outcomes rather than only my assigned tasks. I don't think one example proves readiness, but I believe the pattern across multiple situations does.",
        "That's a fair challenge. Strong execution at my current level should be expected, not rewarded automatically with promotion. My argument is that the nature of the work has changed: I'm increasingly being asked to resolve ambiguous cross-team problems and influence decisions beyond my own deliverables. That's the pattern I believe demonstrates next-level scope."
      ]
    }
    $json$::jsonb,
    'laura-future',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви не стали defensive і не заявили entitlement, а пояснили різницю між strong current-level performance та next-level scope.",
      "feedbackIncorrect": "Не відповідайте «я заслуговую» або «ви недооцінюєте мене». Визнайте concern і покажіть pattern of broader ownership."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "respond professionally to a challenge about readiness and distinguish performance from scope",
      "skill": "argumentation",
      "cefr": "B2",
      "capstoneCompetencies": [
        "handling-criticism",
        "clarification",
        "evidence"
      ]
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'laura-future', 11, 'dialogue', 'Laura',
    $txt$Suppose the panel approves the promotion. What would you need to do differently over the next six months to succeed at that level rather than simply continue doing more of the same work?$txt$,
    null,
    '[]'::jsonb,
    null,
    'next-level-plan',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'next-level-plan', 12, 'input', 'Laura',
    $txt$Describe a six-month next-level plan. Focus on changed behaviour and wider impact, not simply doing more tasks. Include priorities, development and how success would be measured.$txt$,
    $txt$Побудуйте concrete plan: 2–3 priorities → changed behaviour → measure of success.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "My first priority would be to shift from solving individual problems to improving how the team makes decisions repeatedly. I'd document and improve one cross-functional decision process rather than becoming the person who personally resolves every issue. Second, I'd spend more time coaching colleagues through ambiguous problems so ownership scales beyond me. Third, I'd keep working on listening before solutioning, particularly under pressure. After six months, I'd want to see clearer team ownership, fewer decisions depending on me personally and evidence that the processes I've influenced are improving customer or business outcomes.",
        "I wouldn't define success as simply handling more projects. I'd focus on creating leverage. Over six months I'd take ownership of one important cross-team outcome, help at least one less experienced colleague grow into greater responsibility and build a more consistent way of using customer evidence in decisions. I'd measure success by the quality of the outcomes and by whether the team becomes less dependent on my direct involvement."
      ]
    }
    $json$::jsonb,
    'promotion-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви описали next level як зміну leverage, behaviour та organisational impact, а не просто більший workload.",
      "feedbackIncorrect": "Не кажіть лише, що будете працювати більше або брати більше задач. Покажіть, як зміняться ваша поведінка, leverage та wider impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "define a concrete development plan for success at the next professional level",
      "skill": "strategic-planning",
      "cefr": "B2",
      "capstoneCompetencies": [
        "problem-solving",
        "future-planning",
        "synthesis"
      ]
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'promotion-choice', 13, 'choice', 'Laura',
    $txt$The panel asks about compensation. Which response is strongest?$txt$,
    $txt$Оберіть варіант, який впевнено обговорює compensation без entitlement або ultimatum.$txt$,
    $json$
    [
      {
        "id": "professional",
        "text": "If the promotion is approved, I'd like the compensation to reflect the scope and market level of the new role. I'm happy to discuss the range and understand how the company benchmarks it.",
        "value": "professional"
      },
      {
        "id": "ultimatum",
        "text": "If I don't get at least a 30% increase, I don't see any point in accepting the promotion.",
        "value": "ultimatum"
      },
      {
        "id": "avoid",
        "text": "Salary doesn't matter to me, so whatever you think is fine.",
        "value": "avoid"
      }
    ]
    $json$::jsonb,
    '{"optionId":"professional"}'::jsonb,
    'final-case',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви пов'язали compensation зі scope та market level і залишили простір для професійного обговорення.",
      "feedbackIncorrect": "Уникайте ультиматуму або повної пасивності. Compensation можна обговорювати впевнено через scope, role level і market benchmark."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "handle compensation discussion assertively and professionally",
      "skill": "negotiation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-case', 14, 'input', 'Laura',
    $txt$This is your final opportunity to address the panel. Make your complete promotion case: readiness, evidence of impact, leadership, an area you still need to develop and how you would create greater value at the next level.$txt$,
    $txt$Фінальний B2 capstone: readiness → evidence → leadership → honest development area → next-level impact. Побудуйте balanced, confident і evidence-based case.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I believe I'm ready for the next level because the scope of my contribution has already moved beyond strong execution of my own work. Over the past year I've increasingly taken ownership of ambiguous cross-functional problems, helped teams make difficult trade-offs and focused decisions on customer and business outcomes. One example was the onboarding issue where I identified the pattern behind repeated support contacts, aligned product and support around the evidence and helped shape a change that contributed to roughly a 20% reduction in those contacts. I don't claim that as an individual result, but my contribution was creating the insight and alignment that helped the team act. I've also learned to lead without relying on authority by making constraints visible, listening to different perspectives and helping groups reach shared decisions. I still need to improve how quickly I move into solution mode under pressure. I'm working on that by checking my understanding and assumptions before proposing action. At the next level, I want to create more leverage: improve how teams make decisions, develop other people and take responsibility for wider outcomes rather than simply doing more tasks myself. I don't think promotion is something I'm entitled to because I've worked hard. I believe the pattern of my current scope and the way I plan to grow from it show that I'm ready for that responsibility.",
        "My promotion case is based on a consistent change in scope rather than tenure. I'm now regularly working across team boundaries, influencing decisions where I don't have formal authority and taking responsibility for outcomes rather than only deliverables. I've supported measurable improvements, including helping identify and address customer problems, while being careful to distinguish my contribution from the team's result. I've also become more aware of a weakness in my approach: under pressure I can move toward solutions before fully understanding other perspectives. I'm actively changing that behaviour because stronger leadership requires better judgement, not simply faster action. If promoted, my goal would be to create leverage by improving decision processes, developing others and owning broader customer and business outcomes. I believe I'm already demonstrating important parts of that level, while still being clear about where I need to grow."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 75,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Це завершений B2 promotion case: confidence без entitlement, evidence без exaggeration, leadership, self-awareness і чітке бачення next-level impact.",
      "feedbackIncorrect": "Фінальна відповідь має поєднати конкретний evidence of impact, leadership, чесну development area, readiness і те, як саме зміниться ваш contribution на наступному рівні."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-promotion-laura",
      "role": "Client Success Manager",
      "goal": "synthesise evidence, leadership, self-awareness and future impact into a persuasive final promotion case",
      "skill": "synthesis",
      "cefr": "B2",
      "capstone": true,
      "capstoneCompetencies": [
        "clarity",
        "argumentation",
        "supporting-detail",
        "critical-evaluation",
        "perspective-taking",
        "professional-appropriateness",
        "naturalness",
        "synthesis"
      ]
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$London Professional завершено. Ви пройшли фінальний B2 promotion review: аргументували через evidence, показали leadership without authority, професійно працювали з критичним feedback, визнали власну development area та сформулювали next-level plan. Ви завершили B2-кампанію.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "The Promotion completed",
      "campaignCompletion": true,
      "capstone": true,
      "learnedWords": [
        "promotion",
        "scope",
        "impact",
        "ownership",
        "leadership",
        "stakeholder",
        "development",
        "leverage",
        "readiness",
        "compensation"
      ]
    }
    $json$::jsonb
  );

end $$;