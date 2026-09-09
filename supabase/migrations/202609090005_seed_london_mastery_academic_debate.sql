-- =========================================================
-- TalkHero Campaign #6
-- C2: London Mastery
-- Mission #3: Academic Debate
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  -- =======================================================
  -- Campaign / Episode
  -- =======================================================

  select id
  into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-mastery';

  if campaign_uuid is null then
    raise exception 'Campaign london-mastery not found';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'mastery-and-influence';

  if episode_uuid is null then
    raise exception 'Episode mastery-and-influence not found';
  end if;


  -- =======================================================
  -- Quest
  -- =======================================================

  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'academic-debate';

  if quest_uuid is not null then
    raise exception 'Quest academic-debate already exists; refusing to overwrite existing content or progress';
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
    'academic-debate',
    'Academic Debate',
    'Візьміть участь у складній академічній дискусії рівня C2: відокремлюйте доказ від припущення, кваліфікуйте твердження, визнавайте сильні контраргументи, аналізуйте причинність і синтезуйте суперечливі позиції.',
    'conversation',
    'C2',
    2,
    25,
    440,
    180,
    'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $json$
    {
      "adventure": {
        "campaignSlug": "london-mastery",
        "subtitle": "Аргументуйте без спрощень",
        "objectives": [
          "формулювати тезу з доречною кваліфікацією",
          "відокремлювати кореляцію від причинності",
          "розрізняти доказ, інтерпретацію та припущення",
          "визнавати сильний контраргумент без відмови від позиції",
          "уточнювати межі узагальнення",
          "оцінювати альтернативні пояснення",
          "синтезувати суперечливі аргументи",
          "формулювати фінальний висновок із належним ступенем упевненості"
        ]
      },
      "location": "london-policy-seminar",
      "difficulty": "C2",
      "premiumMission": true
    }
    $json$::jsonb
  )
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
    'Policy Seminar',
    'Defend a nuanced position in an advanced academic seminar.',
    0,
    'published',
    false,
    $json$
    {
      "cefrLevel": "C2",
      "focus": [
        "academic hedging",
        "causal reasoning",
        "counterargument",
        "qualification",
        "synthesis"
      ]
    }
    $json$::jsonb
  )
  returning id into act_uuid;



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
    $txt$Ви берете участь у семінарі з державної політики. Тема дискусії: чи повинні великі міста вводити плату за в’їзд автомобілів у центральні райони як інструмент зменшення заторів і забруднення. Ваша стартова позиція: така політика може бути ефективною, але лише за певних умов і не повинна оцінюватися ізольовано від якості громадського транспорту, дизайну винятків і соціального впливу.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'marcus-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "location": "London School of Public Policy",
      "emotion": "analytical",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-opening',
    1,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$Let us begin with your central claim. Are you arguing that congestion charging is, on balance, an effective urban policy?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'qualified-thesis',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "neutral",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'qualified-thesis',
    2,
    'input',
    'Dr. Marcus Ellwood',
    $txt$State a clear but qualified thesis. Explain that congestion charging can be effective under specific institutional and transport conditions, rather than presenting it as universally successful.$txt$,
    $txt$Сформулюйте академічну тезу без надмірної категоричності. Використайте доречний hedging: can, tends to, appears to, under certain conditions, provided that.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'marcus-evidence-challenge',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре: теза чітка, але не абсолютна. Це відповідає C2-рівню академічної аргументації.",
      "feedbackIncorrect": "Уникайте універсальних тверджень. Скажіть не лише, що політика працює, а й за яких умов ваш висновок є обґрунтованим."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "goal": "state a clear but appropriately qualified thesis",
      "skill": "academic-hedging",
      "cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-evidence-challenge',
    3,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$Supporters often point to lower traffic volumes after such schemes are introduced. But a decline after implementation does not, by itself, establish causation. How would you deal with that problem?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'causality-answer',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "probing"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'causality-answer',
    4,
    'input',
    'Dr. Marcus Ellwood',
    $txt$Explain how you would distinguish correlation from causation in evaluating the policy.$txt$,
    $txt$Назвіть щонайменше два елементи сильної оцінки: comparison group, before-and-after trend, alternative explanations, concurrent policy changes, long-term data.$txt$,
    $qjson$[]$qjson$::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would not infer causation from a simple before-and-after comparison. We would need to examine pre-existing trends, compare the city with relevant control areas, and account for concurrent changes such as fuel prices, public transport investment or remote-working patterns.",
        "The timing is suggestive, but not sufficient. A stronger evaluation would compare observed changes with a plausible counterfactual and test whether other factors could explain the reduction in traffic."
      ]
    }
    $json$::jsonb,
    'marcus-equity-objection',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви відокремили часовий збіг від причинного висновку і назвали способи перевірки альтернативних пояснень.",
      "feedbackIncorrect": "Не обмежуйтеся фразою 'correlation is not causation'. Поясніть, які дані або порівняння дозволили б зробити причинний висновок сильнішим."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "goal": "distinguish correlation from causation using robust evaluation logic",
      "skill": "causal-reasoning",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-equity-objection',
    5,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$Let us turn to equity. A flat charge may be a minor inconvenience for a high-income commuter but a substantial burden for a lower-income worker. Does that not make the policy inherently regressive?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'concede-without-surrender',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'concede-without-surrender',
    6,
    'input',
    'Dr. Marcus Ellwood',
    $txt$Concede the strongest part of the equity objection, but argue that the distributional effect depends on design choices such as exemptions, revenue use and transport alternatives.$txt$,
    $txt$Визнайте реальну силу контраргументу. Потім обмежте його висновок: “that concern is valid, but it does not necessarily follow that…”$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'marcus-generalisation',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре: ви не применшили проблему нерівності, але показали, що регресивність не є автоматичним наслідком будь-якої моделі.",
      "feedbackIncorrect": "Спочатку визнайте сильну частину заперечення. Потім поясніть, чому кінцевий соціальний ефект залежить від конкретного дизайну політики."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "goal": "concede a strong equity objection while limiting the scope of its conclusion",
      "skill": "concession-without-surrender",
      "cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-generalisation',
    7,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$Suppose one city reports lower congestion, cleaner air and stable retail activity after introducing the charge. How far can we generalise from that case?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'scope-of-inference',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "analytical"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'scope-of-inference',
    8,
    'choice',
    'Dr. Marcus Ellwood',
    $txt$Which response best reflects appropriate C2-level caution about generalisation?$txt$,
    $txt$Оберіть відповідь, яка визнає цінність кейсу, але не перетворює його на універсальний доказ.$txt$,
    $json$
    [
      {
        "id": "a",
        "text": "The evidence proves that congestion charging works in cities generally."
      },
      {
        "id": "b",
        "text": "The case provides useful evidence that the policy can work, but its external validity depends on whether other cities share relevant features such as transport capacity, travel patterns and enforcement conditions."
      },
      {
        "id": "c",
        "text": "One city tells us almost nothing, so the evidence should be ignored."
      }
    ]
    $json$::jsonb,
    $qjson${"optionId":"b"}$qjson$::jsonb,
    'marcus-alternative-explanation',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Ви визнали доказову цінність кейсу й одночасно обмежили сферу узагальнення.",
      "feedbackIncorrect": "На C2 потрібно уникати як надмірного узагальнення, так і повного відкидання одиничного кейсу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "skill": "scope-of-inference",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-alternative-explanation',
    9,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$There is another possibility. Perhaps the real driver of reduced traffic is not the charge itself but the simultaneous expansion of public transport. In that case, are we attributing too much effect to pricing?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'alternative-explanation',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "skeptical"
    }
    $json$::jsonb
  ),

  -- 10 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'alternative-explanation',
    10,
    'input',
    'Dr. Marcus Ellwood',
    $txt$Evaluate the alternative explanation rather than dismissing it. Explain how the charge and public transport improvements may interact rather than operate as isolated causes.$txt$,
    $txt$Спробуйте перейти від “either/or” до взаємодії факторів. На C2 варто показати, що політичні інструменти можуть мати complementary effects.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'marcus-strongest-counterargument',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви не відкинули альтернативне пояснення і показали можливу взаємодію інструментів.",
      "feedbackIncorrect": "Не намагайтеся довести, що лише один фактор має значення. Поясніть, як ці політики можуть взаємно посилювати ефект."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "goal": "evaluate an alternative explanation and identify interacting causal mechanisms",
      "skill": "alternative-explanations",
      "cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2
    }
    $json$::jsonb
  ),

  -- 11 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-strongest-counterargument',
    11,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$What, in your view, is the strongest argument against your own position?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'steelman-counterargument',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "expectant"
    }
    $json$::jsonb
  ),

  -- 12 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'steelman-counterargument',
    12,
    'input',
    'Dr. Marcus Ellwood',
    $txt$Present the strongest version of the opposing argument, then explain why it changes the conditions of your support rather than completely overturning your position.$txt$,
    $txt$Не створюйте слабкий straw man. Сформулюйте контраргумент так, щоб опонент погодився, що ви представили його чесно.$txt$,
    $qjson$[]$qjson$::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The strongest objection is that a poorly designed charge can impose substantial costs on people who have limited alternatives, while producing benefits that are unevenly distributed. That does not lead me to reject the policy altogether, but it does mean my support depends on credible transport alternatives, targeted exemptions and transparent use of the revenue.",
        "A serious concern is that pricing road access may be efficient in aggregate while still being unfair to specific groups. For me, that weakens the case for a simple universal charge, rather than the case for congestion pricing under any circumstances."
      ]
    }
    $json$::jsonb,
    'marcus-synthesis-request',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний steelman. Ви чесно представили найкращий контраргумент і показали, як він змінює межі вашої позиції.",
      "feedbackIncorrect": "Контраргумент має бути справді сильним. Після цього поясніть не просто чому він 'неправильний', а як він уточнює умови вашої підтримки."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "goal": "steelman the strongest opposing argument and integrate it into a refined position",
      "skill": "steelman-and-refinement",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 13 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-synthesis-request',
    13,
    'dialogue',
    'Dr. Marcus Ellwood',
    $txt$Then let us end by making the position as precise as possible. Given the evidence, uncertainty and equity concerns we have discussed, what conclusion are you actually prepared to defend?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'final-synthesis',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "emotion": "focused"
    }
    $json$::jsonb
  ),

  -- 14 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-synthesis',
    14,
    'input',
    'Dr. Marcus Ellwood',
    $txt$Give a concise final synthesis that states what the evidence supports, what remains uncertain, and the conditions under which you would support the policy.$txt$,
    $txt$Фінальний висновок має містити три рівні: supported conclusion, remaining uncertainty, policy conditions. Уникайте як “it definitely works”, так і “we cannot know anything”.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 65,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінний C2-синтез: ви поєднали доказ, невизначеність і практичні умови в одну захищувану позицію.",
      "feedbackIncorrect": "Не завершуйте лише тезою 'я підтримую' або 'я не підтримую'. Покажіть, що саме підтримує доказова база, де залишаються межі знання і за яких умов позиція залишається чинною."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-academic-debate-marcus-ellwood",
      "role": "Senior Lecturer in Public Policy",
      "goal": "synthesise evidence, uncertainty and policy conditions into a defensible conclusion",
      "skill": "academic-synthesis",
      "cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2,
      "learnedWords": [
        "on balance",
        "establish causation",
        "plausible counterfactual",
        "distributional effect",
        "external validity",
        "alternative explanation",
        "complementary effects",
        "qualified conclusion"
      ]
    }
    $json$::jsonb
  ),

  -- 15 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви провели C2-академічну дискусію: кваліфікували тезу, аналізували причинність, працювали з альтернативними поясненнями, чесно формулювали контраргументи та завершили дискусію точним синтезом.',
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "summary": "Academic Debate completed",
      "cefrLevel": "C2",
      "skills": [
        "academic hedging",
        "causal reasoning",
        "scope of inference",
        "alternative explanations",
        "steelman",
        "synthesis"
      ]
    }
    $json$::jsonb
  );

end $$;
