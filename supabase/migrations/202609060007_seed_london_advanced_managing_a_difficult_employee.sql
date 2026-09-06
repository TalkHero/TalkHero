-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #7: Managing a Difficult Employee
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
  where slug = 'london-advanced';

  if campaign_uuid is null then
    raise exception 'Campaign london-advanced not found';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'advanced-life';

  if episode_uuid is null then
    raise exception 'Episode advanced-life not found';
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
    'managing-a-difficult-employee',
    'Managing a Difficult Employee',
    'Проведіть складну managerial conversation із сильним працівником, чия поведінка шкодить команді. Відокремлюйте performance від behaviour, працюйте з defensiveness, встановлюйте межі та сформуйте конкретний improvement plan.',
    'conversation',
    'C1',
    6,
    24,
    320,
    130,
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
        "campaignSlug": "london-advanced",
        "subtitle": "Feedback, boundaries and behavioural accountability",
        "objectives": [
          "відрізняти performance від behaviour",
          "давати feedback через observable examples",
          "не приписувати motives",
          "пояснювати impact на команду",
          "працювати з defensiveness",
          "зберігати managerial boundary",
          "визнавати сильні результати без виправдання поведінки",
          "формувати measurable behavioural commitments"
        ]
      },
      "location": "london-product-office"
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
    'The Conversation',
    'Проведіть складну розмову з Rebecca, Senior Product Manager, зберігаючи баланс між високими результатами, повагою та командною відповідальністю.',
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
    quest_uuid,
    act_uuid,
    'context',
    0,
    'narration',
    null,
    $txt$Rebecca is one of your strongest Senior Product Managers. Her projects usually ship on time, executives trust her judgement and she is known for very high standards.

However, several team members have raised concerns about how she works with others. In meetings she has repeatedly interrupted colleagues, described proposals as “obviously weak” or “not thought through”, and recently dismissed an engineer's concern before he had finished explaining it.

You have also noticed two occasions where Rebecca agreed to involve another team before making a decision but proceeded without them.

You are her manager. This conversation is not about whether Rebecca is talented. It is about whether strong results justify behaviour that is starting to damage trust inside the team.$txt$,
    null,
    '[]'::jsonb,
    null,
    'rebecca-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Product Office","emotion":"tense"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebecca-opening',
    1,
    'dialogue',
    'Rebecca',
    $txt$You said you wanted to talk about team dynamics. I'm assuming this is because someone complained again. If there's a problem with my results, I'm happy to discuss it. Otherwise, I'm not sure what we're solving.$txt$,
    null,
    '[]'::jsonb,
    null,
    'set-frame',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'set-frame',
    2,
    'input',
    'Rebecca',
    $txt$Set the frame for the conversation. Acknowledge Rebecca's strong performance, but make clear that behaviour and team impact are also part of her role.$txt$,
    $txt$Не починайте з accusation. Визнайте results, але не дозволяйте їм закрити тему behaviour.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Your results are strong, and I want to be clear that this conversation isn't questioning that. The issue is how some of your behaviour is affecting the team. At your level, performance includes both what you deliver and how you enable other people to work effectively.",
        "I'm not raising this because your results are weak. They're not. I'm raising it because strong delivery and strong leadership behaviour are both expectations of the role, and I think we need to address a gap in the second area."
      ]
    }
    $json$::jsonb,
    'rebecca-defensive',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви відділили results від behavioural expectations і не знецінили її сильні сторони.",
      "feedbackIncorrect": "Не сперечайтеся з її результатами. Поясніть, що behaviour також входить у performance expectations."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "frame behaviour as part of senior-level performance",
      "skill": "managerial-framing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebecca-defensive',
    3,
    'dialogue',
    'Rebecca',
    $txt$I push people because the standard isn't always high enough. If I interrupt, it's usually because we're wasting time on an argument that doesn't stand up. I don't think lowering the bar to make people comfortable is good management.$txt$,
    null,
    '[]'::jsonb,
    null,
    'observation-vs-judgement',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'observation-vs-judgement',
    4,
    'input',
    'Rebecca',
    $txt$Respond with observable examples rather than labels such as “aggressive” or “difficult”. Explain the difference between high standards and the behaviour you are addressing.$txt$,
    $txt$Use specific observation → impact. Не приписуйте motive.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'm not asking you to lower the standard. In Tuesday's review you interrupted Daniel twice before he'd finished explaining the dependency, and you described the proposal as 'obviously weak' before the team had discussed it. The issue isn't that you challenged the idea; it's that the way you did it reduced the space for others to contribute.",
        "High standards are not the concern. In the last planning meeting you cut off an engineering concern before it had been fully explained and then dismissed the approach publicly. Challenging the substance is appropriate. Preventing the discussion from happening is a different issue."
      ]
    }
    $json$::jsonb,
    'rebecca-sensitive',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви використали observable evidence і не перетворили feedback на характеристику особистості.",
      "feedbackIncorrect": "Уникайте ярликів на кшталт “toxic”, “aggressive” або “difficult”. Назвіть конкретну поведінку та її impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "give evidence-based behavioural feedback",
      "skill": "feedback-precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebecca-sensitive',
    5,
    'dialogue',
    'Rebecca',
    $txt$This is exactly what I mean. People here are too sensitive. If someone has a strong idea, they should be able to defend it. I'm judged on results, and my results are better than most of the team's.$txt$,
    null,
    '[]'::jsonb,
    null,
    'challenge-defence',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'challenge-defence',
    6,
    'input',
    'Rebecca',
    $txt$Do not debate whether colleagues are “too sensitive”. Reframe the issue around observable impact and expectations for a senior leader.$txt$,
    $txt$Avoid getting trapped in whether colleagues should feel differently. Focus on impact and role expectations.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Whether someone should feel more or less sensitive isn't the standard I'm using. The relevant question is whether your behaviour helps the team produce better decisions and raise concerns early. When people stop contributing because they expect to be cut off or dismissed, that becomes a performance risk for the team.",
        "I'm not asking you to agree with everyone's reaction. I'm asking you to recognise the impact. At your level, part of the job is creating an environment where people can challenge you and bring incomplete concerns forward without being dismissed before they've been heard."
      ]
    }
    $json$::jsonb,
    'rebecca-fairness',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не сперечалися про sensitivity, а повернули розмову до impact і leadership expectations.",
      "feedbackIncorrect": "Не сперечайтеся про те, наскільки колеги sensitive. Поверніть розмову до observable impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "reframe defensiveness around observable impact",
      "skill": "managerial-reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebecca-fairness',
    7,
    'dialogue',
    'Rebecca',
    $txt$But is this actually fair? You've given me two examples and you're turning them into a pattern. I can think of plenty of meetings where I've supported people and changed my mind.$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-counterexample',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'handle-counterexample',
    8,
    'input',
    'Rebecca',
    $txt$Acknowledge that positive counterexamples may exist without withdrawing the feedback. Explain why both things can be true at the same time.$txt$,
    $txt$Avoid “always” and “never”. Integrate the counterexample rather than fighting it.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I accept that there are meetings where you've supported people well, and I don't want to suggest this happens every time. That doesn't make the examples irrelevant. Both things can be true: you can be collaborative in many situations and still have a recurring behaviour under pressure that needs to change.",
        "That's a fair challenge, and I wouldn't describe the behaviour as constant. I've also seen you create space for people. My concern is that in several high-pressure discussions the same pattern has appeared, and the impact is significant enough that we need to address it."
      ]
    }
    $json$::jsonb,
    'manager-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна C1-відповідь: ви прийняли counterexample, але не дозволили йому анулювати pattern.",
      "feedbackIncorrect": "Визнайте позитивні counterexamples і водночас поясніть, чому recurring concern залишається."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "integrate counterevidence without abandoning valid feedback",
      "skill": "nuance-and-counterargument",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'manager-choice',
    9,
    'choice',
    'Rebecca',
    $txt$Rebecca says: “So what exactly are you asking me to do — be less direct?” Which response is strongest?$txt$,
    $txt$Directness itself is not the problem. Choose an observable behavioural expectation.$txt$,
    $json$
    [
      {
        "id": "specific",
        "text": "No. I want you to remain direct, but I need you to let people finish, challenge the idea rather than dismiss the person or contribution, and follow agreed consultation steps before making cross-team decisions.",
        "value": "specific"
      },
      {
        "id": "softer",
        "text": "Yes. I think you need to soften your communication and try to be nicer to people.",
        "value": "softer"
      },
      {
        "id": "general",
        "text": "Just try to improve the atmosphere and be more aware of how people feel.",
        "value": "general"
      }
    ]
    $json$::jsonb,
    '{"optionId":"specific"}'::jsonb,
    'rebecca-authority',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Expectation стала behavioural, observable і measurable.",
      "feedbackIncorrect": "Не просіть Rebecca просто бути “nicer”. Визначте конкретну поведінку."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "define precise behavioural expectations",
      "skill": "expectation-setting",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebecca-authority',
    10,
    'dialogue',
    'Rebecca',
    $txt$I'm going to be very direct, then. If you want someone who prioritises harmony over speed, maybe I'm not the right person for this role. I was hired because I make difficult calls quickly.$txt$,
    null,
    '[]'::jsonb,
    null,
    'hold-boundary',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'hold-boundary',
    11,
    'input',
    'Rebecca',
    $txt$Hold the managerial boundary without escalating into a threat. Reject the false choice between speed and respectful, effective collaboration.$txt$,
    $txt$Do not answer with “then maybe you should leave”. Reframe the false binary.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I don't think the choice is between speed and effective collaboration. Your ability to make difficult calls is one of your strengths, and I want you to keep it. The expectation is that you do that without shutting down information or bypassing commitments we've already made to other teams.",
        "I'm not asking you to prioritise harmony over results. I'm asking you to combine decisiveness with the leadership discipline expected at your level. Fast decisions are valuable, but not if people stop surfacing risks or if cross-team commitments become unreliable."
      ]
    }
    $json$::jsonb,
    'rebecca-admission',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви втримали boundary і не прийняли false choice між speed та collaboration.",
      "feedbackIncorrect": "Не погрожуйте роллю. Визнайте strength Rebecca і чітко повторіть behavioural expectation."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "hold a managerial boundary under challenge",
      "skill": "boundary-setting",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebecca-admission',
    12,
    'dialogue',
    'Rebecca',
    $txt$All right. I can see that I probably cut people off more when I'm under time pressure. And I did make that launch decision before the platform team had formally signed off. I still think the decision was right, but I can see why they felt bypassed.$txt$,
    null,
    '[]'::jsonb,
    null,
    'build-accountability',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'build-accountability',
    13,
    'input',
    'Rebecca',
    $txt$Build on Rebecca's partial acknowledgement without overpraising it. Convert insight into specific responsibility and future behaviour.$txt$,
    $txt$Move from recognition → ownership → future behaviour.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That's the distinction I'm looking for. You don't have to conclude that every decision was wrong in order to recognise that the process and behaviour created a problem. Going forward, I need you to let people complete their argument before challenging it, and where cross-team sign-off has been agreed, either obtain it or explicitly escalate before proceeding.",
        "That's useful because it separates the quality of the decision from how the decision was made. The next step is making the behaviour predictable: no cutting people off under pressure, and no treating agreed consultation as optional when speed becomes uncomfortable."
      ]
    }
    $json$::jsonb,
    'final-plan',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви перетворили partial insight на concrete accountability.",
      "feedbackIncorrect": "Не зупиняйтеся на “I'm glad you understand”. Визначте, що Rebecca робитиме інакше."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "turn insight into behavioural accountability",
      "skill": "accountability",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-plan',
    14,
    'input',
    'Rebecca',
    $txt$Close the conversation with a concrete improvement plan. Include what must change, how progress will be observed and when you will review it. Keep the tone developmental, but make the expectation unambiguous.$txt$,
    $txt$C1 synthesis: behaviour + evidence + review point + support + clear standard.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Let's make this concrete. Over the next four weeks, I want you to focus on three things: let colleagues finish before you challenge their position, avoid dismissive language about contributions, and follow agreed cross-team consultation unless you explicitly escalate a time-critical exception. I'll look at feedback from the meetings we're both in and check in with the relevant leads. We'll review progress together in four weeks. I'll support you if speed or decision rights are genuinely unclear, but the behavioural expectation itself isn't optional.",
        "For the next month, the expectation is specific: complete listening before challenge, criticism directed at the substance rather than the person or contribution, and no bypassing agreed consultation without escalation. We'll review this in four weeks using examples from real meetings and cross-team work. If process ambiguity is contributing to the problem, I'll help remove it, but I do need to see a consistent change in behaviour."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 65,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінне C1-закриття: expectations конкретні, review measurable, а тон developmental без розмиття accountability.",
      "feedbackIncorrect": "Не завершуйте загальним “let's communicate better”. Потрібні concrete behaviours, спосіб спостереження та review point."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-employee-rebecca",
      "role": "Senior Product Manager",
      "goal": "close with a measurable behavioural improvement plan",
      "skill": "managerial-synthesis",
      "cefr": "C1"
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
    $txt$Розмову завершено. Ви відокремили strong performance від problematic behaviour, дали evidence-based feedback, витримали defensiveness і встановили чіткі behavioural expectations без переходу до особистих ярликів або погроз.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "observable behaviour",
        "behavioural expectation",
        "team impact",
        "to hold a boundary",
        "counterexample",
        "to bypass a process",
        "accountability",
        "improvement plan"
      ]
    }
    $json$::jsonb
  );

end $$;