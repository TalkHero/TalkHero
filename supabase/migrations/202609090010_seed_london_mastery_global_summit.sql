-- TalkHero C2 / Mission 8: Global Summit
-- Additive seed. Existing quest scenes and progress are not overwritten.
do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  select id into campaign_uuid from public.quest_campaigns
  where slug = 'london-mastery';
  if campaign_uuid is null then
    raise exception 'Campaign london-mastery not found';
  end if;
  select id into episode_uuid from public.quest_episodes
  where campaign_id = campaign_uuid and slug = 'mastery-and-influence';
  if episode_uuid is null then
    raise exception 'Episode mastery-and-influence not found';
  end if;
  select id into quest_uuid from public.quests
  where episode_id = episode_uuid and slug = 'global-summit';
  if quest_uuid is not null then
    raise exception 'Quest global-summit already exists; refusing to overwrite existing content or progress';
  end if;
  insert into public.quests (
    episode_id, slug, title, description, quest_type, cefr_level,
    order_index, estimated_minutes, xp_reward, coin_reward,
    status, config, metadata
  ) values (
    episode_uuid, 'global-summit', 'Global Summit',
    'Завершіть London Mastery: модерування міжнародного саміту, багатосторонні переговори, етичні компроміси, медійний тиск і фінальна консенсусна заява.',
    'conversation', 'C2', 7, 28, 600, 250, 'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $qjson${"adventure":{"campaignSlug":"london-mastery","subtitle":"Фінал: мистецтво консенсусу","objectives":["формулювати спільну мету без фальшивого консенсусу","узгоджувати конкуруючі інтереси","відповідати на медійний тиск","зважувати етичні компроміси","пропонувати механізми фінансування","узгоджувати автономію та спільні стандарти","формулювати фінальну багатосторонню заяву"]},"location":"london-global-summit","difficulty":"C2","premiumMission":true,"finalMission":true}$qjson$::jsonb
  ) returning id into quest_uuid;
  insert into public.quest_acts (
    quest_id, act_code, title, description, order_index,
    status, checkpoint, metadata
  ) values (
    quest_uuid, 'main', 'The Global Summit',
    'Lead a multilateral negotiation towards a defensible conditional consensus.',
    0, 'published', false,
    $qjson${"cefrLevel":"C2","focus":["multilateral negotiation","diplomacy","ethical trade-offs","media pressure","consensus drafting","executive synthesis"]}$qjson$::jsonb
  ) returning id into act_uuid;
  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type, speaker,
    content, prompt, options, expected_answer, next_scene_code,
    branching, evaluation_config, metadata
  ) values
  -- 0 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'briefing',
    0,
    'narration',
    null,
    $txt$Фінальна місія London Mastery. Ви представляєте міжнародну організацію на лондонському саміті з відповідального використання AI у критично важливих суспільних послугах. Учасники погоджуються щодо потенційної користі технологій, але розходяться в питаннях безпеки, доступу, фінансування та відповідальності. Ваше завдання — допомогти сторонам узгодити практичну рамкову угоду, не приховуючи реальних розбіжностей і не створюючи фальшивого консенсусу.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'sofia-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "location": "London Global Summit"}$qjson$::jsonb
  ),

  -- 1 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-opening',
    1,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$Welcome to the final session. We have broad agreement on the potential benefits of AI, but very different views on acceptable risk and the pace of deployment. How would you frame our shared objective without prejudging the outcome?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'frame-common-ground',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 2 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'frame-common-ground',
    2,
    'input',
    $txt$Sofia Bennett$txt$,
    $txt$Open the summit by identifying genuine common ground, acknowledging unresolved differences and proposing a practical objective for the negotiations.$txt$,
    $txt$Сформулюйте спільну мету без фальшивого консенсусу. Відокремте принципову згоду від питань, які ще потребують переговорів.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'sofia-competing-demands',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "goal": "establish genuine common ground while preserving unresolved differences", "skill": "multilateral-framing"}'::jsonb
  ),

  -- 3 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-competing-demands',
    3,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$One delegation wants a binding moratorium until independent safety standards are agreed. Another argues that a moratorium would deny vulnerable communities access to useful services. A third insists that any agreement must respect national regulatory autonomy. How would you move the discussion forward?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'reframe-disagreement',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 4 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-disagreement',
    4,
    'input',
    $txt$Sofia Bennett$txt$,
    $txt$Reframe the disagreement around shared risks and differentiated implementation rather than asking one side to abandon its principles.$txt$,
    $txt$Запропонуйте differentiated approach: risk-based safeguards, limited deployment, independent oversight, national implementation flexibility. Не вигадуйте, що сторони вже погодилися.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["Rather than treating the choice as a universal moratorium or unrestricted deployment, we could distinguish between levels of risk and the safeguards appropriate to each. A common framework might establish minimum protections and independent oversight while allowing national authorities to determine how those requirements are implemented. That would not resolve every disagreement, but it could give us a practical basis for negotiation.", "We should separate the shared objective of preventing serious harm from the question of how quickly different systems may be deployed. A risk-based framework, with limited use where justified and clear national implementation responsibilities, could preserve the core concerns of all three delegations without assuming that agreement has already been reached."]}$qjson$::jsonb,
    'sofia-media-pressure',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "goal": "reframe competing demands into a workable risk-based negotiating structure", "skill": "rapid-reframing"}$qjson$::jsonb
  ),

  -- 5 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-media-pressure',
    5,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$A journalist has obtained a draft suggesting that the summit will endorse immediate deployment. The press is asking whether the agreement has already been decided behind closed doors. What should our public position be?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'public-statement',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 6 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'public-statement',
    6,
    'input',
    $txt$Sofia Bennett$txt$,
    $txt$Prepare a short public response that corrects the misleading impression, respects the confidentiality of negotiations and communicates what is genuinely agreed and what remains open.$txt$,
    $txt$Не заперечуйте існування документа без доказів. Не розкривайте конфіденційні позиції. Відокремте draft від agreed text і дайте зрозумілий публічний меседж.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'sofia-ethical-tradeoff',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 60, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "goal": "respond to media pressure accurately without compromising negotiations or manufacturing certainty", "skill": "public-communication"}'::jsonb
  ),

  -- 7 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-ethical-tradeoff',
    7,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$A proposal would allow an accelerated pilot in underserved regions, but only if participating institutions accept a lower level of independent review. Which response best addresses the ethical trade-off?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'ethical-choice',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 8 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'ethical-choice',
    8,
    'choice',
    $txt$Sofia Bennett$txt$,
    $txt$Choose the most defensible response to the proposed trade-off.$txt$,
    $txt$Оберіть відповідь, яка враховує доступ до користі, але не перекладає непропорційний ризик на вразливі громади.$txt$,
    $qjson$[{"id": "a", "text": "The pilot should proceed because underserved communities have the greatest need, even if independent review is reduced."}, {"id": "b", "text": "The access gap is a serious concern, but it does not justify weaker protection for the communities most affected. We should explore accelerated review, additional resources and proportionate safeguards rather than trading away independent oversight."}, {"id": "c", "text": "The proposal must be rejected permanently because any accelerated deployment is inherently unethical."}]$qjson$::jsonb,
    $qjson${"optionId": "b"}$qjson$::jsonb,
    'sofia-funding-dispute',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "exact", "points": 40, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "skill": "ethical-tradeoffs"}$qjson$::jsonb
  ),

  -- 9 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-funding-dispute',
    9,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$We now have a funding problem. Wealthier delegations support common standards but resist an open-ended financial commitment. Lower-income delegations argue that unfunded requirements would make the agreement impossible to implement. What compromise could address both concerns?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'funding-compromise',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 10 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'funding-compromise',
    10,
    'input',
    $txt$Sofia Bennett$txt$,
    $txt$Propose a credible financing compromise with defined commitments, transparent allocation criteria, capacity-building and a review mechanism. Avoid inventing budget figures or promising funding that has not been authorised.$txt$,
    $txt$Покажіть burden-sharing і implementation capacity. Запропонуйте механізм, а не вигадані суми чи гарантії.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'sofia-final-objection',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 60, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "goal": "develop a bounded and accountable financing compromise that addresses implementation capacity", "skill": "burden-sharing"}'::jsonb
  ),

  -- 11 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-final-objection',
    11,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$One delegation says it can accept the framework only if the final text states that national authorities retain responsibility for implementation. Another worries that this would make the common standards meaningless. Can you reconcile those positions?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'reconcile-authority',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 12 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reconcile-authority',
    12,
    'input',
    $txt$Sofia Bennett$txt$,
    $txt$Draft a concise compromise clause that preserves national implementation responsibility while retaining meaningful common commitments and independent review.$txt$,
    $txt$Сформулюйте clause англійською: national responsibility, common minimum safeguards, transparent reporting, independent review. Не перетворюйте автономію на необмежене право ігнорувати стандарти.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["Participating authorities shall retain responsibility for implementation within their respective jurisdictions, while committing to the common minimum safeguards, transparent reporting requirements and independent review arrangements established under this framework. Implementation may reflect national circumstances, provided that such flexibility does not undermine the agreed protections.", "National authorities will determine the appropriate means of implementation, subject to the common minimum safeguards and agreed mechanisms for independent review and transparent reporting. Any flexibility should be justified by local circumstances and must not weaken the framework's core protections."]}$qjson$::jsonb,
    'sofia-consensus-request',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "goal": "reconcile national implementation autonomy with enforceable common safeguards", "skill": "consensus-drafting"}$qjson$::jsonb
  ),

  -- 13 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sofia-consensus-request',
    13,
    'dialogue',
    $txt$Sofia Bennett$txt$,
    $txt$We appear to have a possible landing zone, but several delegations still need domestic approval. Please give us a final consensus statement that captures what has been agreed, identifies the remaining conditions and sets out the next steps without presenting provisional support as a binding commitment.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'final-consensus',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair"}$qjson$::jsonb
  ),

  -- 14 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-consensus',
    14,
    'input',
    $txt$Sofia Bennett$txt$,
    $txt$Deliver the final summit statement. Synthesise shared principles, risk-based safeguards, equitable access, financing, national implementation, accountability and the next review steps. Distinguish provisional agreement from formal approval and avoid claiming unanimity where it has not been established.$txt$,
    $txt$Це фінальна C2-відповідь. Створіть чіткий, дипломатичний і decision-ready statement: agreed principles, unresolved conditions, responsible parties, review process, next steps. Не вигадуйте юридично обов'язкових зобов'язань.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 75, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Сильна відповідь: ви зберегли точність, врахували інтереси сторін і запропонували реалістичний шлях до спільного рішення.", "feedbackIncorrect": "Уточніть позицію, визнайте обґрунтовані заперечення та запропонуйте конкретний механізм, а не лише загальну згоду."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-global-summit-sofia-bennett", "role": "Summit Chair", "goal": "synthesise a defensible multilateral consensus statement with explicit conditions and next steps", "skill": "executive-synthesis", "learnedWords": ["common ground", "prejudge the outcome", "differentiated implementation", "risk-based framework", "unfunded requirement", "burden-sharing", "implementation capacity", "provisional agreement"]}'::jsonb
  ),

  -- 15 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Вітаємо! Ви завершили London Mastery — фінальну C2-місію. Ви модерували багатосторонні переговори, працювали з етичними компромісами, медійним тиском, фінансуванням та регуляторною автономією і сформулювали підсумкову заяву без фальшивого консенсусу. Це завершення навчальної кампанії C2.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "summary": "London Mastery completed", "campaignCompleted": true, "skills": ["multilateral framing", "rapid reframing", "public communication", "ethical trade-offs", "burden-sharing", "consensus drafting", "executive synthesis"]}$qjson$::jsonb
  );
end $$;
