-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #9: Public Debate
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
    'public-debate',
    'Public Debate',
    'Візьміть участь у публічних дебатах про прозорість використання AI. Сформулюйте позицію, працюйте з evidence, concessions, counterarguments, rebuttals і завершіть переконливим closing statement.',
    'conversation',
    'C1',
    8,
    24,
    340,
    140,
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
        "subtitle": "Argue with nuance under public scrutiny",
        "objectives": [
          "формулювати чітку, але nuanced position",
          "відрізняти claims від evidence",
          "визнавати сильні counterarguments",
          "робити meaningful concessions",
          "будувати rebuttal без straw man",
          "reframe дискусію",
          "використовувати hedging і precise language",
          "завершувати strong closing statement"
        ]
      },
      "location": "london-debate-studio"
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
    'Live Debate',
    'Захистіть свою позицію перед Amelia, Debate Moderator, і публічною аудиторією.',
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
    $txt$You are taking part in a live public debate in London.

Tonight's motion is:

"Large companies should be legally required to disclose when artificial intelligence is used in decisions that materially affect customers or employees."

Examples include:
• automated hiring and promotion decisions;
• credit or pricing decisions;
• fraud detection;
• performance evaluation;
• customer account restrictions;
• automated recommendations that significantly affect access to services.

Supporters of disclosure argue that people have a right to understand when automated systems influence important outcomes.

Critics argue that broad disclosure rules could create unnecessary bureaucracy, expose commercially sensitive processes and encourage people to distrust tools simply because AI is involved.

There is no single correct position.

Your goal is to argue clearly, respond fairly to opposing views and show C1-level control of nuance, evidence and register.

Amelia, the Debate Moderator, will challenge your reasoning in front of the audience.$txt$,
    null,
    '[]'::jsonb,
    null,
    'amelia-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Debate Studio","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-opening',
    1,
    'dialogue',
    'Amelia',
    $txt$Let's begin with your position. Do you support mandatory disclosure when AI materially affects customers or employees, or do you oppose it? Give us your argument, not just your conclusion.$txt$,
    null,
    '[]'::jsonb,
    null,
    'opening-position',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'opening-position',
    2,
    'input',
    'Amelia',
    $txt$State a clear position and support it with a reason. You may support the motion, oppose it or take a qualified position.$txt$,
    $txt$C1: clear stance + rationale + qualification. Avoid absolute claims such as “AI is always unfair” or “disclosure solves everything”. $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I support disclosure when AI has a material influence on consequential decisions, but I would not require companies to disclose every automated tool they use. The key issue is whether the system affects a person's opportunities, access or treatment. In those cases, transparency gives people a meaningful basis to question or appeal a decision.",
        "I support a limited disclosure requirement. The public does not need a technical inventory of every algorithm, but people should know when automated systems substantially influence decisions such as hiring, pricing or access to services. That creates accountability without requiring companies to reveal proprietary details."
      ]
    }
    $json$::jsonb,
    'amelia-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний старт. Є clear position, rationale і qualification.",
      "feedbackIncorrect": "Потрібна не лише думка, а аргумент. Сформулюйте позицію, причину і межі своєї позиції."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "state a nuanced position",
      "skill": "argumentation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-evidence',
    3,
    'dialogue',
    'Amelia',
    $txt$You have made a principled argument. But principles are easy. What evidence would actually strengthen your case? What would you want to know before claiming that disclosure improves outcomes?$txt$,
    null,
    '[]'::jsonb,
    null,
    'evidence-standard',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evidence-standard',
    4,
    'input',
    'Amelia',
    $txt$Explain what evidence would support your position and distinguish evidence from assumption.$txt$,
    $txt$Не вигадуйте статистику. Назвіть what you would want to measure or compare.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would want evidence showing whether disclosure changes people's ability to challenge incorrect decisions, whether appeal rates improve and whether companies become more careful about high-impact automated systems. My assumption is that transparency improves accountability, but that should be tested rather than treated as self-evident.",
        "Useful evidence would compare outcomes before and after disclosure requirements: for example, the rate of successful appeals, error detection and whether affected users understand the decision process better. Without that evidence, I can defend disclosure as a rights-based principle, but I should be cautious about claiming that it automatically improves accuracy."
      ]
    }
    $json$::jsonb,
    'amelia-bureaucracy',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви відокремили normative argument від empirical claim.",
      "feedbackIncorrect": "Не підмінюйте evidence переконанням. Скажіть, які outcomes потрібно виміряти."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "distinguish evidence from assumption",
      "skill": "evidence-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-bureaucracy',
    5,
    'dialogue',
    'Amelia',
    $txt$Critics say your proposal sounds reasonable until thousands of companies have to comply with it. They argue that disclosure rules would create paperwork, legal risk and compliance costs without necessarily helping anyone. Isn't that a serious objection?$txt$,
    null,
    '[]'::jsonb,
    null,
    'concede-bureaucracy',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'concede-bureaucracy',
    6,
    'input',
    'Amelia',
    $txt$Acknowledge the strongest part of that objection, then explain how your position would respond to it.$txt$,
    $txt$Meaningful concession ≠ surrender. Покажіть, що ви реально зрозуміли objection.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Yes, that is a serious concern. A badly designed rule could generate large compliance costs while providing users with meaningless notices. That is why I would limit the requirement to decisions with material consequences and require concise, relevant disclosure rather than technical documentation for every automated process.",
        "I accept that transparency can become performative bureaucracy if the rule is too broad. The answer is not necessarily to reject disclosure, but to define a threshold. Companies should disclose AI involvement when it materially contributes to decisions affecting rights, opportunities or access, not whenever software happens to assist an employee."
      ]
    }
    $json$::jsonb,
    'amelia-trade-secret',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна concession: objection визнаний, але позиція стала точнішою.",
      "feedbackIncorrect": "Не відповідайте “that is wrong”. Спочатку визнайте legitimate concern, потім обмежте або уточніть policy."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "make a meaningful concession",
      "skill": "concession",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-trade-secret',
    7,
    'dialogue',
    'Amelia',
    $txt$Another objection: companies may have legitimate trade secrets. If you force them to explain AI systems, aren't you asking them to reveal commercially sensitive information?$txt$,
    null,
    '[]'::jsonb,
    null,
    'rebut-trade-secret',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rebut-trade-secret',
    8,
    'input',
    'Amelia',
    $txt$Respond without creating a straw man. Distinguish disclosure of AI involvement from disclosure of proprietary technical details.$txt$,
    $txt$Strong rebuttal: represent their concern fairly, then narrow the disputed claim.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The trade-secret concern is legitimate, but disclosure does not have to mean publishing source code, model architecture or proprietary data. A company could state that AI materially influenced a decision, identify the type of factors considered and explain the appeal process without exposing the underlying technology.",
        "I would distinguish transparency about the existence and role of automation from technical disclosure. The public needs enough information to understand how a consequential decision was made and how to challenge it. That does not require companies to disclose commercially sensitive implementation details."
      ]
    }
    $json$::jsonb,
    'amelia-trust',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви відповіли на реальний objection і не спотворили позицію опонента.",
      "feedbackIncorrect": "Не приписуйте critics позицію, якої вони не висловлювали. Розділіть transparency і publication of proprietary technology."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "rebut without straw man",
      "skill": "rebuttal",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-trust',
    9,
    'choice',
    'Amelia',
    $txt$A member of the audience says: “If people see the words AI was used, they may distrust a perfectly fair decision. Doesn't disclosure itself create bias against automation?” Which response is strongest?$txt$,
    $txt$Choose the response that recognises the concern but avoids assuming either that AI is inherently trustworthy or inherently untrustworthy.$txt$,
    $json$
    [
      {
        "id": "balanced",
        "text": "That risk exists, so disclosure should provide context rather than a warning label. The aim should be to explain the role AI played, not imply that the decision is automatically unreliable.",
        "value": "balanced"
      },
      {
        "id": "dismiss",
        "text": "People should simply learn to trust AI because automated systems are usually more objective than humans.",
        "value": "dismiss"
      },
      {
        "id": "alarm",
        "text": "If people distrust AI after disclosure, that is probably justified because automated decisions are inherently risky.",
        "value": "alarm"
      }
    ]
    $json$::jsonb,
    '{"optionId":"balanced"}'::jsonb,
    'amelia-reframe',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Disclosure має давати context, а не працювати як warning label.",
      "feedbackIncorrect": "Уникайте абсолютів. AI не є автоматично ні trustworthy, ні untrustworthy."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "choose a balanced public-facing response",
      "skill": "nuance",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-reframe',
    10,
    'dialogue',
    'Amelia',
    $txt$So far, this debate has been framed as transparency versus innovation. Is that actually the right framing?$txt$,
    null,
    '[]'::jsonb,
    null,
    'reframe-debate',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-debate',
    11,
    'input',
    'Amelia',
    $txt$Reframe the debate in a way that reveals a deeper issue or false binary.$txt$,
    $txt$C1 skill: change the frame without dodging the question.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think transparency versus innovation is too simplistic. The deeper question is what level of accountability should accompany systems that exercise significant influence over people. Innovation can continue, but when automated tools affect important outcomes, companies should be able to explain the role those systems play.",
        "I would reframe it as proportional accountability rather than transparency versus innovation. The relevant question is not whether AI should be disclosed everywhere, but when its influence becomes significant enough that the affected person deserves information and a route to challenge the outcome."
      ]
    }
    $json$::jsonb,
    'amelia-edge-case',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви прибрали false binary і дали точніший frame.",
      "feedbackIncorrect": "Не просто повторіть свою позицію. Покажіть, чому початкова рамка debate є надто вузькою."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "reframe the debate",
      "skill": "reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-edge-case',
    12,
    'dialogue',
    'Amelia',
    $txt$Let's test your position with a difficult case. Imagine a manager makes the final hiring decision, but an AI system ranks every candidate and strongly shapes who reaches the interview stage. The company says: “A human made the decision, so there is nothing to disclose.” Do you agree?$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-edge-case',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'handle-edge-case',
    13,
    'input',
    'Amelia',
    $txt$Apply your principle to this edge case and explain why the presence of a human does or does not change your conclusion.$txt$,
    $txt$Avoid slogans like “human in the loop”. Analyse actual influence on the outcome.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would still require disclosure if the AI ranking materially shapes who receives human consideration. The presence of a human at the final stage does not remove the system's influence over the process. What matters is not who signs off the decision, but whether automation significantly affects a person's opportunity.",
        "A human final decision is relevant, but it should not become a loophole. If an automated ranking determines which candidates are visible to the manager, it has a material role in the outcome. I would disclose that role while making clear that the final decision was made by a person."
      ]
    }
    $json$::jsonb,
    'amelia-final-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви застосували principle до edge case, а не просто повторили rule.",
      "feedbackIncorrect": "Проаналізуйте actual influence. Сам факт human involvement ще не відповідає на питання."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "apply a principle to an edge case",
      "skill": "principled-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'amelia-final-challenge',
    14,
    'input',
    'Amelia',
    $txt$You have thirty seconds left. Give the audience your closing statement. State your position, acknowledge the strongest opposing concern and explain the principle you want them to remember.$txt$,
    $txt$Closing statement: concise, persuasive, nuanced. No new long argument.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I support targeted disclosure when AI materially shapes decisions that affect people's opportunities, access or treatment. Critics are right that poorly designed transparency rules can create bureaucracy and unnecessary alarm. But that argues for proportional rules, not for secrecy. The principle is simple: when automated systems have meaningful power over people, that influence should be visible and challengeable.",
        "This should not be a debate between innovation and fear. Companies should be free to use powerful tools, but significant automated influence should come with proportionate accountability. We should protect trade secrets and avoid meaningless notices, while still ensuring that people know when AI materially affects an important decision and how they can challenge it."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 70,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний closing statement: clear position, concession і memorable principle.",
      "feedbackIncorrect": "Фінал має бути стислим: position + strongest opposing concern + principle. Не відкривайте нову тему."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-public-debate-amelia",
      "role": "Debate Moderator",
      "goal": "deliver a persuasive closing statement",
      "skill": "public-speaking-synthesis",
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
    $txt$Public Debate завершено. Ви сформулювали nuanced position, відокремлювали assumptions від evidence, робили concessions, відповідали на counterarguments без straw man, reframed false binaries і завершили дебати переконливим closing statement.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "material influence",
        "meaningful disclosure",
        "proportional accountability",
        "trade-off",
        "counterargument",
        "concession",
        "rebuttal",
        "false binary",
        "to reframe an issue",
        "challengeable decision"
      ]
    }
    $json$::jsonb
  );

end $$;