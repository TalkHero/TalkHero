-- TalkHero C2 / Mission 6: Ethics Committee
-- Additive seed. Does not delete or overwrite existing quest scenes/progress.

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  select id into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-mastery';

  if campaign_uuid is null then
    raise exception 'Campaign london-mastery not found';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'mastery-and-influence';

  if episode_uuid is null then
    raise exception 'Episode mastery-and-influence not found';
  end if;

  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'ethics-committee';

  if quest_uuid is not null then
    raise exception 'Quest ethics-committee already exists; refusing to overwrite existing content or progress';
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
    'ethics-committee',
    'Ethics Committee',
    'Візьміть участь у C2-засіданні етичного комітету: зважуйте конкуруючі принципи, ризики, fairness, accountability, conflict of interest та формулюйте кваліфіковані рекомендації.',
    'conversation',
    'C2',
    5,
    25,
    500,
    210,
    'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $qjson${"adventure":{"campaignSlug":"london-mastery","subtitle":"Рішення без простих відповідей","objectives":["формулювати етичну дилему без спрощення","зважувати ризик дії та бездіяльності","оцінювати fairness пропорційно","аналізувати explainability та accountability","керувати conflict of interest","формулювати умовну рекомендацію зі safeguards"]},"location":"london-ethics-committee-room","difficulty":"C2","premiumMission":true}$qjson$::jsonb
  )
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
    'Ethics Review',
    'Evaluate a high-stakes AI deployment where benefit, risk, fairness and accountability conflict.',
    0,
    'published',
    false,
    $qjson${"cefrLevel":"C2","focus":["ethical framing","proportionality","fairness","accountability","conflict of interest","qualified recommendation"]}$qjson$::jsonb
  )
  returning id into act_uuid;

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
  -- 0 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'briefing',
    0,
    'narration',
    null,
    $txt$Ви берете участь у засіданні етичного комітету великої медичної технологічної компанії. Компанія тестує AI-систему, яка може допомагати лікарям пріоритезувати пацієнтів із високим ризиком ускладнень. Пілот показує користь, але модель іноді помиляється, а її рекомендації важко повністю пояснити. Комітет має вирішити, чи дозволяти обмежене використання системи в реальній клінічній практиці.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'helena-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "location": "London Ethics Committee Room"}$qjson$::jsonb
  ),

  -- 1 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-opening',
    1,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$The system appears to identify some high-risk patients earlier than existing procedures, but its reasoning is not always transparent. Before we discuss approval, what do you see as the central ethical tension?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'frame-dilemma',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 2 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'frame-dilemma',
    2,
    'input',
    $txt$Professor Helena Ward$txt$,
    $txt$Frame the ethical dilemma without reducing it to 'innovation versus safety'. Identify at least two competing principles and explain why both matter.$txt$,
    $txt$Назвіть щонайменше два принципи: potential benefit, non-maleficence, autonomy, fairness, accountability, transparency. Покажіть конфлікт, а не просту правильну відповідь.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'helena-benefit-pressure',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 45, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "goal": "frame the case as a genuine conflict among legitimate ethical principles", "skill": "ethical-framing"}'::jsonb
  ),

  -- 3 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-benefit-pressure',
    3,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$Suppose delaying deployment means some patients will miss an earlier warning that the system could have provided. Is excessive caution itself an ethical risk?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'weigh-inaction',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 4 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'weigh-inaction',
    4,
    'input',
    $txt$Professor Helena Ward$txt$,
    $txt$Acknowledge that inaction can carry ethical costs, but explain why that does not justify unrestricted deployment.$txt$,
    $txt$Сформулюйте balanced response: ризик дії та ризик бездіяльності треба порівнювати, але потенційна користь не скасовує вимоги до safeguards.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["Yes. If the system has credible evidence of benefit, refusing to use it can also impose costs on patients. But that does not justify unrestricted deployment; the relevant question is whether the expected benefit can be captured under conditions that keep foreseeable harms, oversight failures and unjustified reliance within acceptable bounds.", "Excessive caution can become harmful if it blocks a useful intervention, but the answer is not to treat potential benefit as sufficient. We still need proportionate safeguards, monitoring and a clear limit on how much authority the system is given."]}$qjson$::jsonb,
    'helena-fairness',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 45, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "goal": "weigh the ethical cost of inaction against the need for safeguards", "skill": "risk-of-inaction"}$qjson$::jsonb
  ),

  -- 5 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-fairness',
    5,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$The pilot performs well overall, but accuracy is lower for one demographic group. The difference is statistically real, although the absolute error rate remains modest. Does that make deployment unethical?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'fairness-analysis',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 6 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'fairness-analysis',
    6,
    'input',
    $txt$Professor Helena Ward$txt$,
    $txt$Analyse the fairness concern without assuming that any performance gap automatically settles the question. Consider severity, cause, distribution of harms, available alternatives and mitigation.$txt$,
    $txt$Не кажіть просто 'bias is unacceptable' або 'the gap is small'. Покажіть proportionality: наскільки серйозна різниця, кого вона зачіпає, чи можна її зменшити і з чим порівнюємо.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'helena-explainability',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "goal": "evaluate fairness concerns proportionately rather than using a single threshold", "skill": "fairness-and-proportionality"}'::jsonb
  ),

  -- 7 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-explainability',
    7,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$A clinician says, 'If I cannot explain exactly why the model produced a recommendation, I should not use it at all.' Which response best handles that concern?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'explainability-choice',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 8 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'explainability-choice',
    8,
    'choice',
    $txt$Professor Helena Ward$txt$,
    $txt$Choose the most defensible response.$txt$,
    $txt$Оберіть відповідь, яка визнає важливість explainability, але не перетворює її на абсолютну вимогу незалежно від контексту.$txt$,
    $qjson$[{"id": "a", "text": "If the model is statistically accurate, explainability is not ethically relevant."}, {"id": "b", "text": "Lack of full interpretability is a genuine concern, but the ethical significance depends on how the recommendation is used, what independent evidence clinicians retain, how errors are detected, and whether responsibility remains clearly assigned."}, {"id": "c", "text": "Any system that cannot fully explain every output should be prohibited from clinical use."}]$qjson$::jsonb,
    $qjson${"optionId": "b"}$qjson$::jsonb,
    'helena-accountability',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "exact", "points": 35, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "skill": "explainability-and-accountability"}$qjson$::jsonb
  ),

  -- 9 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-accountability',
    9,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$Let us make responsibility explicit. If a doctor follows the system's recommendation and the outcome is harmful, who is accountable: the doctor, the hospital, the vendor, or the designers?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'shared-accountability',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 10 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'shared-accountability',
    10,
    'input',
    $txt$Professor Helena Ward$txt$,
    $txt$Reject the idea that complex accountability must belong to only one actor. Explain how responsibility can be distributed while still remaining traceable and enforceable.$txt$,
    $txt$Покажіть різницю між distributed accountability і diluted accountability. Відповідальність може бути спільною, але не повинна зникати.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'helena-conflict-interest',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "goal": "define distributed but traceable accountability across clinical and organisational actors", "skill": "accountability-architecture"}'::jsonb
  ),

  -- 11 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-conflict-interest',
    11,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$The company funding the pilot also stands to gain commercially if the committee approves deployment. The data are promising, but several committee members helped design the study. How should that affect our judgement?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'manage-conflict',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 12 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'manage-conflict',
    12,
    'input',
    $txt$Professor Helena Ward$txt$,
    $txt$Explain how to manage the conflict of interest without automatically dismissing the evidence or pretending the conflict is irrelevant.$txt$,
    $txt$Запропонуйте safeguards: disclosure, independent review, recusal where appropriate, external replication, transparent methods. Не робіть висновок лише з мотивів сторін.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["The conflict should change the level of scrutiny, not automatically determine the conclusion. We should require full disclosure, independent review of the data and methods, and recusal where members have a direct role in decisions they helped generate. External validation would also reduce the risk that commercial incentives are shaping interpretation.", "The evidence should not be discarded simply because interested parties produced it, but neither should we treat the conflict as irrelevant. Independent assessment, transparent methods and clear recusals are necessary before the committee relies on the findings."]}$qjson$::jsonb,
    'helena-final-recommendation',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "goal": "manage conflicts of interest through procedural safeguards while evaluating evidence on its merits", "skill": "conflict-of-interest"}$qjson$::jsonb
  ),

  -- 13 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helena-final-recommendation',
    13,
    'dialogue',
    $txt$Professor Helena Ward$txt$,
    $txt$You must now make a recommendation. A full approval seems premature, but a complete prohibition may sacrifice potential benefit and valuable evidence. What should the committee authorise, if anything?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'qualified-recommendation',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee"}$qjson$::jsonb
  ),

  -- 14 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'qualified-recommendation',
    14,
    'input',
    $txt$Professor Helena Ward$txt$,
    $txt$Give a qualified recommendation that specifies scope, safeguards, monitoring, review conditions and circumstances that would pause or terminate use.$txt$,
    $txt$Фінальна позиція має бути decision-ready. Вкажіть не лише 'limited pilot', а межі використання, людський контроль, аудит, fairness monitoring, review point і stopping criteria.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 65, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зважили конкуруючі принципи, не спростили дилему і сформулювали захищувану позицію.", "feedbackIncorrect": "Не зводьте дилему до одного принципу. Визнайте конфлікт цінностей, наслідки та межі впевненості."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-ethics-committee-helena-ward", "role": "Chair of the Ethics Committee", "goal": "produce a proportionate, conditional recommendation with explicit safeguards and stopping criteria", "skill": "qualified-ethical-recommendation", "learnedWords": ["competing principles", "foreseeable harm", "proportionate safeguard", "distribution of harms", "interpretability", "distributed accountability", "conflict of interest", "stopping criteria"]}'::jsonb
  ),

  -- 15 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Місію завершено! Ви пройшли C2-засідання етичного комітету: працювали з конкуруючими принципами, proportionality, fairness, explainability, accountability, conflict of interest та сформулювали умовну рекомендацію, яку можна захистити перед різними сторонами.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "summary": "Ethics Committee completed", "skills": ["ethical framing", "risk of inaction", "fairness and proportionality", "explainability", "accountability architecture", "conflict-of-interest analysis", "qualified recommendation"]}$qjson$::jsonb
  );

end $$;
