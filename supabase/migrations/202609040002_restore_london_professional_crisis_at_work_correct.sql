-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #11: Crisis at Work
-- Corrective migration
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
    'crisis-at-work',
    'Crisis at Work',
    'Керуйте професійною комунікацією під час production incident: відокремлюйте факти від припущень, визначайте пріоритети, приймайте рішення в умовах uncertainty та давайте керівництву чіткі updates.',
    'conversation',
    'B2',
    10,
    22,
    250,
    100,
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
        "subtitle": "Приймайте рішення, коли повної картини ще немає",
        "objectives": [
          "швидко структурувати неповну інформацію",
          "відокремлювати confirmed facts від assumptions",
          "комунікувати uncertainty без втрати довіри",
          "визначати immediate containment actions",
          "пріоритезувати customer impact",
          "не вигадувати root cause до завершення investigation",
          "формулювати decision criteria",
          "розподіляти ownership",
          "давати concise executive updates",
          "будувати recovery plan"
        ]
      },
      "location": "london-crisis-room"
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
    'Managing the Incident',
    'Стабілізуйте ситуацію, прийміть рішення та поясніть його керівництву.',
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

  -- 0
  (
    quest_uuid, act_uuid, 'briefing', 0, 'narration', null,
    $txt$П'ятниця, 16:20. Через сорок хвилин після production release support отримує кілька повідомлень: частина корпоративних клієнтів бачить неправильні account data у dashboard. Поки що підтверджено шість affected accounts. Невідомо, чи проблема ширша. Engineering уже розслідує incident, але root cause ще не встановлено. Jonathan, Executive Director, збирає терміновий crisis call.$txt$,
    null,
    '[]'::jsonb,
    null,
    'jonathan-alert',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Crisis Room"}'::jsonb
  ),

  -- 1
  (
    quest_uuid, act_uuid, 'jonathan-alert', 1, 'dialogue', 'Jonathan',
    $txt$I've just heard we may be showing customers incorrect account information. I need a clear picture immediately. What do we actually know right now?$txt$,
    null,
    '[]'::jsonb,
    null,
    'assess-situation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2
  (
    quest_uuid, act_uuid, 'assess-situation', 2, 'input', 'Jonathan',
    $txt$Give a concise initial assessment. Separate confirmed facts, unknowns and the immediate investigation.$txt$,
    $txt$Структуруйте перший crisis update: що підтверджено → що невідомо → що перевіряється зараз.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We have six confirmed reports of corporate accounts displaying incorrect dashboard data after today's release. We don't yet know whether the issue affects more customers or what caused it. Engineering is checking the scope and comparing the affected accounts with the release changes now.",
        "At this point, six accounts are confirmed as affected. The wider impact and root cause are still unknown. Engineering is investigating both the affected data path and the changes introduced in the latest release."
      ]
    }
    $json$::jsonb,
    'jonathan-pressure',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви дали керівнику факти, uncertainty та поточну investigation без спекуляцій.",
      "feedbackIncorrect": "Не змішуйте підтверджене з припущеннями. Назвіть confirmed impact, unknowns і те, що команда перевіряє зараз."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "structure incomplete crisis information into confirmed facts, unknowns and current investigation",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3
  (
    quest_uuid, act_uuid, 'jonathan-pressure', 3, 'dialogue', 'Jonathan',
    $txt$Six reports could mean six customers or six hundred. The board will ask me whether this is a major incident. Can I tell them it is contained?$txt$,
    null,
    '[]'::jsonb,
    null,
    'communicate-uncertainty',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 4
  (
    quest_uuid, act_uuid, 'communicate-uncertainty', 4, 'input', 'Jonathan',
    $txt$Do not give false reassurance. Explain what can and cannot responsibly be said yet, and define when you expect a better assessment.$txt$,
    $txt$Не вигадуйте certainty. Скажіть, що ми можемо повідомити зараз, чого ще не знаємо і коли дамо наступний update.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I wouldn't describe it as contained yet. We only know about six confirmed accounts, but we haven't completed the scope check. You can say we're investigating a potentially limited incident and that we'll provide a more reliable impact assessment within the next thirty minutes.",
        "Not yet. Saying it's contained would go beyond the evidence we have. We can confirm six affected accounts and an active investigation, and we should set a short deadline for the next scope update rather than speculate."
      ]
    }
    $json$::jsonb,
    'jonathan-impact',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви зберегли credibility: не приховали uncertainty, але дали конкретний next update.",
      "feedbackIncorrect": "Не кажіть, що incident contained, якщо scope ще невідомий. Комунікуйте uncertainty і дайте конкретний час наступного assessment."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "communicate uncertainty without false reassurance",
      "skill": "professional-communication",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5
  (
    quest_uuid, act_uuid, 'jonathan-impact', 5, 'dialogue', 'Jonathan',
    $txt$Support has now confirmed that two affected customers used the incorrect dashboard figures in meetings this afternoon. Engineering says they need another twenty minutes to understand the technical scope. What should we prioritise right now?$txt$,
    null,
    '[]'::jsonb,
    null,
    'prioritise-actions',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6
  (
    quest_uuid, act_uuid, 'prioritise-actions', 6, 'input', 'Jonathan',
    $txt$Prioritise immediate actions. Protect customers and limit further harm while preserving the technical investigation.$txt$,
    $txt$Дайте порядок дій: containment → affected customers → investigation → ownership.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "First, we should prevent more customers from relying on potentially incorrect figures, either by disabling the affected dashboard component or adding an immediate warning while engineering confirms scope. Support should contact the six known customers directly, prioritising the two who already used the data. Engineering should continue the investigation with one clear incident lead, and we should reconvene when the scope check is complete.",
        "Our first priority is limiting further customer impact. We should contain the affected functionality, contact the known accounts with a factual warning, and keep engineering focused on scope and root cause rather than pulling everyone into communication. One incident owner should coordinate updates."
      ]
    }
    $json$::jsonb,
    'jonathan-cause',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви поставили containment і customer impact перед пошуком зручного пояснення та визначили ownership.",
      "feedbackIncorrect": "Пріоритет — зупинити подальший impact, попередити affected customers і зберегти focused investigation з чітким owner."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "prioritise containment, customer impact and investigation ownership",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7
  (
    quest_uuid, act_uuid, 'jonathan-cause', 7, 'dialogue', 'Jonathan',
    $txt$The timing makes this look obvious. The problem appeared right after the release, so can we just say the new release caused it and roll everything back?$txt$,
    null,
    '[]'::jsonb,
    null,
    'avoid-premature-cause',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 8
  (
    quest_uuid, act_uuid, 'avoid-premature-cause', 8, 'input', 'Jonathan',
    $txt$Distinguish correlation from confirmed cause. Explain what decision can be made before root cause is known and what still requires evidence.$txt$,
    $txt$Не робіть post hoc висновок. Розділіть likely connection, confirmed root cause і reversible containment decision.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The timing makes the release a strong suspect, but it doesn't prove which change caused the problem. We can still decide to disable or roll back the affected functionality as a precaution if that reduces customer risk. We should describe that as containment, not as proof of root cause, until engineering confirms the mechanism.",
        "There's clearly a correlation with the release, so rollback may be a sensible risk-control decision. But we shouldn't tell people we've identified the cause until engineering verifies it. The operational decision and the causal conclusion are separate."
      ]
    }
    $json$::jsonb,
    'jonathan-decision',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви відокремили reversible containment decision від непідтвердженого causal claim.",
      "feedbackIncorrect": "Timing робить release підозрюваним, але не доводить root cause. Розділіть containment action і causal conclusion."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "distinguish correlation, causal evidence and precautionary action",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9
  (
    quest_uuid, act_uuid, 'jonathan-decision', 9, 'dialogue', 'Jonathan',
    $txt$Engineering has narrowed it down. The incorrect figures affect one newly changed dashboard service. They can disable that service in about five minutes and restore the previous version. That will remove one new reporting feature, but the rest of the platform can remain online.$txt$,
    null,
    '[]'::jsonb,
    null,
    'recommend-response',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 10
  (
    quest_uuid, act_uuid, 'recommend-response', 10, 'input', 'Jonathan',
    $txt$Make a decision and justify it using customer impact, reversibility and business trade-offs.$txt$,
    $txt$Дайте recommendation: що робимо зараз → чому → який trade-off приймаємо → що перевіряємо після containment.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd disable the affected service and restore the previous version now. The customer impact is already confirmed, the rollback is fast and limited, and the cost is temporarily losing one new reporting feature rather than risking more incorrect data. Once the service is stable, engineering can continue the root-cause investigation without customers being exposed.",
        "I recommend the targeted rollback. It's a reversible five-minute action that removes the known source of customer risk while keeping the rest of the platform available. We accept the temporary loss of the new feature and investigate the underlying defect after containment."
      ]
    }
    $json$::jsonb,
    'jonathan-update',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Recommendation має decision, rationale і чіткий trade-off.",
      "feedbackIncorrect": "Прийміть рішення і поясніть його через confirmed impact, reversibility та trade-off."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "make and justify a crisis decision using impact, reversibility and trade-offs",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11
  (
    quest_uuid, act_uuid, 'jonathan-update', 11, 'dialogue', 'Jonathan',
    $txt$The rollback is complete. No new incorrect data is being generated. Engineering has identified 23 affected accounts in total, and support is contacting them. Root cause investigation is continuing. Give me the update I can take to the board.$txt$,
    null,
    '[]'::jsonb,
    null,
    'executive-update',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 12
  (
    quest_uuid, act_uuid, 'executive-update', 12, 'input', 'Jonathan',
    $txt$Give a concise executive update: incident, impact, containment, current customer response, remaining unknown and next checkpoint.$txt$,
    $txt$Стисле board-level повідомлення: what happened → scope → containment → customer action → unknown → next update.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We identified an incident in the new dashboard service that caused incorrect account figures for 23 customers. The affected service has been rolled back, so no new incorrect data is being generated and the rest of the platform remains available. Support is contacting all affected accounts, with priority given to customers known to have used the figures. Engineering is still confirming the root cause, and we'll provide the next technical and customer-impact update once that investigation reaches its next checkpoint.",
        "Twenty-three accounts were affected by incorrect dashboard data following today's release. We've contained the incident through a targeted rollback, and the platform is otherwise operating normally. Customer outreach is under way. The exact root cause remains under investigation, so we should avoid making a causal claim until engineering confirms it."
      ]
    }
    $json$::jsonb,
    'crisis-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Update короткий, decision-oriented і чесно залишає root cause відкритим.",
      "feedbackIncorrect": "Executive update має містити scope, containment, customer response, remaining uncertainty і next checkpoint."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "deliver a concise evidence-based executive crisis update",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13
  (
    quest_uuid, act_uuid, 'crisis-choice', 13, 'choice', 'Jonathan',
    $txt$Engineering still hasn't confirmed the exact root cause. Which public statement is safest and most accurate?$txt$,
    $txt$Оберіть формулювання, яке повідомляє confirmed information без непідтверджених causal claims.$txt$,
    $json$
    [
      {
        "id": "confirmed",
        "text": "We identified an issue affecting dashboard data for a limited number of accounts. The affected service has been rolled back, impacted customers are being contacted, and the underlying cause is still under investigation.",
        "value": "confirmed"
      },
      {
        "id": "cause",
        "text": "A coding mistake in today's release caused the incident, and the engineer responsible is fixing it.",
        "value": "cause"
      },
      {
        "id": "minimise",
        "text": "There was a minor visual issue, but customers were not meaningfully affected.",
        "value": "minimise"
      }
    ]
    $json$::jsonb,
    '{"optionId":"confirmed"}'::jsonb,
    'final-crisis-brief',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Повідомлення містить confirmed facts, containment і remaining uncertainty без blame або minimisation.",
      "feedbackIncorrect": "Не вигадуйте root cause і не применшуйте confirmed customer impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "choose accurate external crisis communication under uncertainty"
    }
    $json$::jsonb
  ),

  -- 14
  (
    quest_uuid, act_uuid, 'final-crisis-brief', 14, 'input', 'Jonathan',
    $txt$Give your final crisis brief. Summarise what happened, how the risk evolved, the decisions made, customer impact, what remains unknown and the next steps.$txt$,
    $txt$Фінальний B2 crisis synthesis: facts → uncertainty → containment → decision rationale → customer response → remaining investigation → next steps.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Following today's release, we received reports that some corporate customers were seeing incorrect dashboard figures. We initially had six confirmed cases and did not know the full scope or root cause, so we avoided describing the incident as contained. We prioritised limiting further customer impact, contacted the known affected accounts and kept engineering focused on the investigation. When the issue was narrowed to one newly changed dashboard service, we performed a targeted rollback because it was fast, reversible and removed the known risk while keeping the rest of the platform online. We now know that 23 accounts were affected, no new incorrect data is being generated and support is contacting every affected customer. The exact root cause is still being verified. Our next steps are to complete that investigation, confirm corrective actions, monitor the restored service and provide a further update once those findings are validated.",
        "The incident involved incorrect dashboard data following today's production release. We treated the release as a likely connection but did not claim a root cause before evidence was available. After confirming customer impact and narrowing the issue to one service, we rolled that service back while leaving the wider platform online. Twenty-three accounts were affected and customer outreach is in progress. The incident is contained operationally, but root cause investigation and corrective actions remain open."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви керували crisis communication через facts, uncertainty, containment, reversible decisions, ownership та clear executive updates.",
      "feedbackIncorrect": "Фінальний brief має поєднати confirmed facts, evolution of risk, containment, rationale, customer impact, remaining uncertainty і next steps."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-crisis-at-work-jonathan",
      "role": "Executive Director",
      "goal": "synthesise a complex evolving incident into an accurate executive crisis brief",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$Кризову ситуацію стабілізовано. Ви відокремили факти від assumptions, не дали false reassurance, захистили клієнтів, прийняли reversible containment decision, організували ownership та дали керівництву точний executive update.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Crisis at Work completed",
      "learnedWords": [
        "incident",
        "containment",
        "root cause",
        "rollback",
        "affected accounts",
        "customer impact",
        "scope",
        "reversible"
      ]
    }
    $json$::jsonb
  );

end $$;