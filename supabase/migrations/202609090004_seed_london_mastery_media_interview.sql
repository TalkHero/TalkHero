-- =========================================================
-- TalkHero Campaign #6
-- C2: London Mastery
-- Mission #2: Media Interview
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
    and slug = 'media-interview';

  if quest_uuid is not null then
    raise exception 'Quest media-interview already exists; refusing to overwrite existing content or progress';
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
    'media-interview',
    'Media Interview',
    'Дайте складне медіаінтерв’ю на рівні C2: працюйте з провокаційними формулюваннями, прихованими припущеннями, тиском на коротку відповідь, цитатними пастками та необхідністю зберегти точність без ухиляння.',
    'conversation',
    'C2',
    1,
    24,
    420,
    170,
    'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $json$
    {
      "adventure": {
        "campaignSlug": "london-mastery",
        "subtitle": "Контроль меседжу під тиском",
        "objectives": [
          "розпізнавати приховані припущення у запитанні",
          "відповідати прямо, не приймаючи хибну рамку",
          "використовувати hedging без розмитості",
          "переформульовувати провокаційні питання",
          "будувати bridge statements природно, без механічного ухилення",
          "уникати цитатних пасток і небезпечної категоричності",
          "керувати тоном під час повторного тиску",
          "завершувати інтерв’ю чітким ключовим меседжем"
        ]
      },
      "location": "london-broadcast-studio",
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
    'Live Studio Interview',
    'Handle a demanding live interview while keeping your message precise and credible.',
    0,
    'published',
    false,
    $json$
    {
      "cefrLevel": "C2",
      "focus": [
        "reframing",
        "hedging",
        "bridging",
        "implicit premises",
        "quote-risk management"
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
    $txt$Ви — керівник компанії, яка щойно оголосила масштабну реструктуризацію. Сьогодні ви даєте пряме телевізійне інтерв’ю. Ваша позиція: зміни необхідні для довгострокової стабільності, але конкретні наслідки ще залежать від консультацій і фінального плану. Журналістка відома тим, що тисне на гостей короткими, категоричними запитаннями.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'naomi-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "location": "London Broadcast Studio",
      "emotion": "live-pressure",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-opening',
    1,
    'dialogue',
    'Naomi',
    $txt$Let us start with the obvious question. You have announced a major restructuring. Is this simply a polite way of saying that substantial job losses are coming?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'reject-false-binary',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "direct",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reject-false-binary',
    2,
    'input',
    'Naomi',
    $txt$Answer directly without accepting the assumption that restructuring automatically means large-scale redundancies. Acknowledge uncertainty, but avoid sounding evasive.$txt$,
    $txt$Ваше завдання — не сказати просто “ні”. Відокремте те, що вже відомо, від того, що ще не вирішено. Збережіть прямоту і контроль рамки.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'naomi-presses-number',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви не прийняли хибну бінарну рамку, але й не сховалися за невизначеністю.",
      "feedbackIncorrect": "Потрібно прямо відповісти на запитання, а потім уточнити межі того, що вже відомо. Уникайте як категоричного заперечення, так і туманної відповіді."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "goal": "reject the false binary while distinguishing confirmed facts from unresolved outcomes",
      "skill": "reframing",
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
    'naomi-presses-number',
    3,
    'dialogue',
    'Naomi',
    $txt$But people watching this will hear that as corporate language. How many jobs are at risk: ten, a hundred, a thousand? Surely you have a number.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'precision-under-pressure',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "pressing"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'precision-under-pressure',
    4,
    'input',
    'Naomi',
    $txt$Explain why giving a number now would be misleading, while still showing that you understand why employees and the public want clarity.$txt$,
    $txt$На C2 важливо поєднати емпатію, епістемічну точність і відповідальність. Не звучіть так, ніби ви просто відмовляєтеся відповідати.$txt$,
    $qjson$[]$qjson$::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand why people want a number, and they are entitled to clarity as soon as we can provide it. The difficulty is that giving a figure before the consultation is complete would create a false sense of certainty and could itself be misleading.",
        "There is a legitimate demand for clarity here. What I do not want to do is manufacture precision before the process has reached the point where any figure would be reliable."
      ]
    }
    $json$::jsonb,
    'naomi-accuses-evasion',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре: ви пояснили межу знання без захисного або бюрократичного тону.",
      "feedbackIncorrect": "Додайте дві речі: визнайте право людей на ясність і поясніть, чому конкретна цифра зараз була б оманливою."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "goal": "explain uncertainty precisely without sounding evasive",
      "skill": "epistemic-precision",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-accuses-evasion',
    5,
    'dialogue',
    'Naomi',
    $txt$Some employees will say that is exactly what executives always say when they know the news is bad but do not want to admit it. Why should they believe you are being transparent?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'credibility-answer',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "skeptical",
      "subtext": "Naomi is testing credibility rather than asking only for facts."
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'credibility-answer',
    6,
    'input',
    'Naomi',
    $txt$Respond to the credibility challenge. Do not demand trust. Explain what concrete behaviour or process should allow people to judge whether the company is being transparent.$txt$,
    $txt$Не кажіть “they should trust us”. Перенесіть довіру з декларацій на перевірювані дії: строки, оновлення, консультації, публічні критерії.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'naomi-quote-trap',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Точно. Ви не просили довіряти вам на слово, а дали критерії, за якими прозорість можна перевірити.",
      "feedbackIncorrect": "Замість заклику до довіри назвіть конкретні дії або процеси, за якими люди зможуть оцінити вашу прозорість."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "goal": "ground credibility in observable actions rather than assertions",
      "skill": "credibility-framing",
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
    'naomi-quote-trap',
    7,
    'dialogue',
    'Naomi',
    $txt$So can I quote you tonight as saying, “There will not be large-scale job losses”? Yes or no?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'avoid-quote-trap',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "insistent",
      "subtext": "She is trying to force a stronger claim than the evidence supports."
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'avoid-quote-trap',
    8,
    'choice',
    'Naomi',
    $txt$Which answer best avoids the quote trap without sounding evasive?$txt$,
    $txt$Оберіть варіант, який прямо відмовляється від надто сильної цитати, але замість цього дає точне формулювання, яке ви готові захищати.$txt$,
    $json$
    [
      {
        "id": "a",
        "text": "No, you cannot quote me on that."
      },
      {
        "id": "b",
        "text": "What you can quote me as saying is that no final figure has been agreed, and that any decisions will follow the consultation rather than precede it."
      },
      {
        "id": "c",
        "text": "Yes, because I do not expect the losses to be large."
      }
    ]
    $json$::jsonb,
    $qjson${"optionId":"b"}$qjson$::jsonb,
    'naomi-bridge-pressure',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Ви не дозволили нав’язати вам сильнішу тезу і водночас дали цитату, яку можна чесно захищати.",
      "feedbackIncorrect": "Найкраща відповідь не просто відмовляється. Вона замінює небезпечну цитату точним формулюванням."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "skill": "quote-risk-management",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-bridge-pressure',
    9,
    'dialogue',
    'Naomi',
    $txt$Let us leave the numbers aside. Critics say this restructuring is really about protecting margins after poor strategic decisions by senior management. Is that criticism fair?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'bridge-without-evading',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 10 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'bridge-without-evading',
    10,
    'input',
    'Naomi',
    $txt$Acknowledge that management decisions should be scrutinised, answer the criticism in substance, and then bridge to the strategic reason for the restructuring.$txt$,
    $txt$Не використовуйте штучний “what I want to talk about is…”. Спочатку дайте змістовну відповідь, а вже потім природно переведіть розмову до ширшої стратегічної картини.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'naomi-personalises',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви відповіли по суті й лише після цього перевели розмову до ключового меседжу.",
      "feedbackIncorrect": "Bridge statement працює лише тоді, коли ви спочатку відповіли на справедливу частину запитання. Не перескакуйте одразу до підготовленого меседжу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "goal": "answer a legitimate criticism before bridging to the broader strategic rationale",
      "skill": "natural-bridging",
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
    'naomi-personalises',
    11,
    'dialogue',
    'Naomi',
    $txt$You are the chief executive. If the strategy has failed badly enough to require restructuring, why should you personally remain in the job?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'personal-accountability',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "confrontational"
    }
    $json$::jsonb
  ),

  -- 12 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'personal-accountability',
    12,
    'input',
    'Naomi',
    $txt$Respond without becoming defensive. Accept appropriate personal accountability while rejecting the simplistic claim that restructuring automatically proves total strategic failure.$txt$,
    $txt$Сильна C2-відповідь повинна містити: accountability, qualification, і критерій, за яким вашу роботу слід оцінювати надалі.$txt$,
    $qjson$[]$qjson$::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I am accountable for the decisions made under my leadership, and I do not intend to distance myself from that. But restructuring is not, by itself, evidence that every strategic judgement was wrong. The relevant test is whether we respond to changing conditions responsibly and whether the plan we are now implementing produces a stronger and more sustainable business.",
        "Responsibility ultimately sits with me, and that includes decisions that have not delivered as expected. What I would challenge is the idea that adapting the organisation is the same as admitting complete strategic failure. I should be judged on whether we address the problems honestly and improve the company from here."
      ]
    }
    $json$::jsonb,
    'naomi-final-question',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви взяли відповідальність без саморуйнівної категоричності та дали зрозумілий критерій оцінки.",
      "feedbackIncorrect": "Не уникайте особистої відповідальності. Визнайте її, але відокремте accountability від надто широкого висновку про повний провал стратегії."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "goal": "accept proportionate accountability while resisting an overgeneralised conclusion",
      "skill": "accountability-and-qualification",
      "cefrLevel": "C2"
    }
    $json$::jsonb
  ),

  -- 13 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-final-question',
    13,
    'dialogue',
    'Naomi',
    $txt$We are almost out of time. Employees watching this are anxious tonight. In one answer, what do you want them to take away from this interview?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'closing-message',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "emotion": "serious"
    }
    $json$::jsonb
  ),

  -- 14 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'closing-message',
    14,
    'input',
    'Naomi',
    $txt$Give a concise closing message that combines empathy, honesty about uncertainty, and a credible commitment to transparency and process.$txt$,
    $txt$Фінальна відповідь має бути короткою, але не порожньою. Не обіцяйте того, чого не можете гарантувати. Дайте людям те, що реально контролюєте: чесність, процес, строки й повагу.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінне завершення: коротко, людяно, точно й без фальшивих гарантій.",
      "feedbackIncorrect": "Уникайте загальних фраз. Поєднайте емпатію, чесність щодо невизначеності та конкретне зобов’язання щодо комунікації й процесу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-mastery-media-interview-naomi-brooks",
      "role": "Senior Broadcast Journalist",
      "goal": "deliver a concise, credible closing message under time pressure",
      "skill": "executive-message-discipline",
      "cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2,
      "learnedWords": [
        "false sense of certainty",
        "manufacture precision",
        "legitimate scrutiny",
        "quote me as saying",
        "strategic rationale",
        "proportionate accountability",
        "overgeneralised conclusion",
        "credible commitment"
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
    'Місію завершено! Ви пройшли C2-медіаінтерв’ю: відбивали хибні рамки, працювали з цитатними пастками, точно кваліфікували твердження, відповідали на критику й завершили інтерв’ю сильним ключовим меседжем.',
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $json$
    {
      "summary": "Media Interview completed",
      "cefrLevel": "C2",
      "skills": [
        "reframing",
        "hedging",
        "quote-risk management",
        "natural bridging",
        "accountability",
        "message discipline"
      ]
    }
    $json$::jsonb
  );

end $$;
