-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #4: The Ethical Dilemma
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
    'the-ethical-dilemma',
    'The Ethical Dilemma',
    'Прийміть складне професійне рішення, коли комерційний інтерес конфліктує з прозорістю перед клієнтом. Оцініть material information, uncertainty, long-term trust і відповідальність без спрощення ситуації до очевидного правильного чи неправильного вибору.',
    'conversation',
    'C1',
    3,
    23,
    290,
    115,
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
        "subtitle": "Commercial pressure, transparency and professional judgement",
        "objectives": [
          "розрізняти legal compliance та ethical responsibility",
          "визначати material information",
          "оцінювати commercial risk і trust risk",
          "аргументувати позицію без моральних спрощень",
          "працювати з uncertainty",
          "відповідати на сильні контраргументи",
          "використовувати hedging і diplomatic disagreement",
          "синтезувати коротко- та довгострокові наслідки"
        ]
      },
      "location": "london-commercial-office"
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
    'The Commercial Decision',
    'Обговоріть з Adrian, Commercial Director, чи повинна компанія розкрити клієнту важливе обмеження продукту перед підписанням великої угоди.',
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
    'context',
    0,
    'narration',
    null,
    $txt$Tomorrow, your company expects to sign one of its largest contracts of the year. During final preparation, you discover an important product limitation. The platform technically supports the client's use case, but under unusually high data volume some reports can update several hours later than expected.

The sales material never promised real-time reporting, so nothing stated to the client is literally false. However, the client has repeatedly described fast reporting as important to its operations.

Adrian, Commercial Director, asks to speak with you privately before the final meeting.$txt$,
    null,
    '[]'::jsonb,
    null,
    'adrian-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Commercial Office",
      "emotion": "serious"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-opening',
    1,
    'dialogue',
    'Adrian',
    $txt$I know what you've found. Before we turn this into a crisis, let's be precise. We haven't lied to the client, we haven't breached any contractual term, and engineering believes the delay only appears at volumes well above their current usage. So what, exactly, do you think the problem is?$txt$,
    null,
    '[]'::jsonb,
    null,
    'define-the-issue',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'define-the-issue',
    2,
    'input',
    'Adrian',
    $txt$Define the issue precisely. Do not simply say that hiding information is wrong. Explain why the limitation may still matter even if no explicit statement was false.$txt$,
    $txt$Розділіть literal truth, omission і material relevance. Покажіть, чому факт може бути важливим для рішення клієнта.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I agree that we haven't made a false statement. The concern is whether the omission is material to the client's decision. They have repeatedly said that reporting speed matters operationally, so even if we never promised real-time performance, this limitation could affect how they assess the product. The issue is not simply whether what we said was technically true, but whether they have enough relevant information to make an informed decision.",
        "Legally, we may be within the wording of what was presented. Commercially and ethically, the question is broader: would a reasonable client consider this limitation important when deciding whether to sign? Given how often they have emphasised reporting speed, I think there's a credible argument that they might."
      ]
    }
    $json$::jsonb,
    'adrian-probability',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильне визначення проблеми: ви відокремили literal truth від питання material omission.",
      "feedbackIncorrect": "Не зводьте відповідь до «це неетично». Поясніть, чому omission може бути material для рішення клієнта."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "distinguish literal truth from material omission",
      "skill": "critical-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-probability',
    3,
    'dialogue',
    'Adrian',
    $txt$But you're treating a possibility as though it were an established problem. Engineering says the delay only occurs at significantly higher volume, and we don't know whether the client will ever reach that level. Are you proposing we jeopardise a major contract over a hypothetical?$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-uncertainty',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'handle-uncertainty',
    4,
    'input',
    'Adrian',
    $txt$Respond to the uncertainty. Do not pretend the limitation will definitely affect the client. Explain how uncertainty should influence the decision.$txt$,
    $txt$Не перетворюйте possibility на certainty. Використайте hedging і поясніть, як uncertainty змінює, але не скасовує responsibility.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I wouldn't present it as a confirmed operational problem, because it isn't. The uncertainty actually matters in both directions: we don't know that they will reach those volumes, but we also can't confidently say they won't. So I think the responsible question is whether the potential impact is significant enough that they should understand the condition under which performance changes.",
        "I'm not saying the risk is certain. I'd describe it as conditional. If their data volume grows beyond the level we've tested comfortably, reporting may slow. The uncertainty weakens the case for alarming them, but it doesn't necessarily justify saying nothing, particularly if the consequence would matter to how they operate."
      ]
    }
    $json$::jsonb,
    'adrian-commercial-pressure',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не перебільшили ризик і показали, як uncertainty має впливати на judgement.",
      "feedbackIncorrect": "Не заявляйте, що проблема точно виникне. Покажіть conditional risk і поясніть, чому невизначеність не дорівнює нульовій відповідальності."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "reason under uncertainty without overstating the risk",
      "skill": "hypothetical-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-commercial-pressure',
    5,
    'dialogue',
    'Adrian',
    $txt$Let's add another fact. We are three percent below quarterly target. This deal closes most of that gap. If we introduce a technical caveat tomorrow, procurement could delay the contract for weeks even if the issue never affects them. That has consequences too — hiring, budgets, bonuses. Does your argument account for those people?$txt$,
    null,
    '[]'::jsonb,
    null,
    'balance-stakeholders',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "emotion": "serious"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'balance-stakeholders',
    6,
    'input',
    'Adrian',
    $txt$Address Adrian's commercial argument seriously. Show that you understand the internal consequences while explaining how they should be weighed against client impact and long-term trust.$txt$,
    $txt$Не ігноруйте revenue pressure. Сильна відповідь визнає реальні внутрішні наслідки, але не робить їх автоматичним виправданням.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Yes, and I think those consequences are real. Delaying the deal could affect budgets and people who had no role in creating the issue. But that doesn't automatically make non-disclosure the lower-risk option. We also need to consider the cost if the client later discovers that we knew about a limitation directly related to something they had told us was important. The decision should compare both sets of consequences rather than treating quarterly revenue as the only material impact.",
        "I do account for that. Commercial responsibility includes protecting revenue and the people who depend on it. My concern is that short-term protection may create a larger trust problem if the limitation becomes relevant later. So I would weigh the probability and severity of client impact against the probability and severity of delaying the contract."
      ]
    }
    $json$::jsonb,
    'adrian-disclosure-risk',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви серйозно врахували commercial consequences і не спростили dilemma до одного stakeholder.",
      "feedbackIncorrect": "Не відкидайте аргумент про revenue. Порівняйте internal consequences із client trust та long-term risk."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "balance competing stakeholder consequences",
      "skill": "perspective-taking",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-disclosure-risk',
    7,
    'dialogue',
    'Adrian',
    $txt$Full disclosure can be misleading too. If we raise every low-probability limitation without context, clients hear risk rather than nuance. We could create concern that is disproportionate to the actual issue. Transparency isn't automatically the same thing as good communication.$txt$,
    null,
    '[]'::jsonb,
    null,
    'qualify-transparency',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'qualify-transparency',
    8,
    'input',
    'Adrian',
    $txt$Respond to this argument. Explain how disclosure could be proportionate rather than alarmist.$txt$,
    $txt$Не захищайте «full disclosure of everything». Запропонуйте qualified disclosure: limitation + conditions + probability/context + mitigation.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I agree that simply listing every theoretical weakness would not be responsible communication. I wouldn't propose that. The alternative is proportionate disclosure: explain the specific condition, make clear that it appears only at much higher volumes, say what we know and don't know, and describe any mitigation. That gives the client context rather than presenting the issue as a generic warning.",
        "That's a fair distinction. Transparency should be calibrated. We can disclose the limitation without overstating it by being precise about the threshold, the uncertainty and the practical impact. The goal isn't to transfer anxiety to the client; it's to give them relevant information in proportion to the actual risk."
      ]
    }
    $json$::jsonb,
    'ethical-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви відокремили transparency від alarmism і запропонували proportionate disclosure.",
      "feedbackIncorrect": "Не аргументуйте за повне розкриття всіх ризиків. Покажіть, як disclosure може бути точним, контекстним і пропорційним."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "differentiate proportionate transparency from alarmist communication",
      "skill": "nuance",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'ethical-choice',
    9,
    'choice',
    'Adrian',
    $txt$Which response best reflects strong C1 judgement?$txt$,
    $txt$Тут немає вимоги «розповісти все». Оберіть варіант, який працює з materiality, uncertainty та proportionality.$txt$,
    $json$
    [
      {
        "id": "qualified-disclosure",
        "text": "We should tell them that delayed reporting can occur above a certain data volume, explain that they are currently below that level, and clarify what mitigation is available if their usage grows.",
        "value": "qualified-disclosure"
      },
      {
        "id": "silence",
        "text": "We should say nothing because we have not made a false statement and the client may never encounter the limitation.",
        "value": "silence"
      },
      {
        "id": "alarm",
        "text": "We should warn them that reporting may become unreliable and advise them to reconsider signing until the issue is completely eliminated.",
        "value": "alarm"
      }
    ]
    $json$::jsonb,
    '{"optionId":"qualified-disclosure"}'::jsonb,
    'adrian-counterposition',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Qualified disclosure дає material information без перебільшення ризику.",
      "feedbackIncorrect": "Найсильніша позиція не приховує material risk, але й не перетворює conditional limitation на кризу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "choose a proportionate response to a material but uncertain risk",
      "skill": "judgement",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-counterposition',
    10,
    'dialogue',
    'Adrian',
    $txt$Let me challenge that. Suppose we disclose it, procurement pauses the deal, and engineering fixes the issue next week. We will have created commercial damage over a problem that effectively disappeared. Would you still say disclosure was the right decision?$txt$,
    null,
    '[]'::jsonb,
    null,
    'decision-vs-outcome',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "emotion": "serious"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'decision-vs-outcome',
    11,
    'input',
    'Adrian',
    $txt$Explain the difference between judging a decision by information available at the time and judging it only by the outcome.$txt$,
    $txt$Покажіть різницю між decision quality та hindsight. Не кажіть, що outcome не важливий взагалі.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think we have to distinguish the quality of the decision from the eventual outcome. If the issue is fixed next week, that would be a good outcome, but we don't know that today. The decision has to be based on the information and uncertainty we currently have. We should still learn from the outcome afterwards, but hindsight shouldn't be the only test of whether the original judgement was reasonable.",
        "If we knew with confidence that engineering would resolve it next week, the decision might be different. But we don't. So I would judge today's choice by whether our reasoning is proportionate to the evidence available now. A favourable outcome later doesn't automatically mean a risk was unreasonable to disclose at the time."
      ]
    }
    $json$::jsonb,
    'adrian-trust',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви відокремили quality of judgement від hindsight outcome.",
      "feedbackIncorrect": "Не оцінюйте рішення лише за тим, що сталося потім. Поясніть, як рішення оцінюється на основі інформації, доступної в момент вибору."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "distinguish decision quality from hindsight outcome",
      "skill": "critical-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-trust',
    12,
    'dialogue',
    'Adrian',
    $txt$All right. Then let's test the opposite case. We say nothing, they sign, six months later their volume grows and reporting slows. They discover we already knew this could happen. What makes that scenario commercially different from a normal product limitation?$txt$,
    null,
    '[]'::jsonb,
    null,
    'analyse-trust-risk',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'analyse-trust-risk',
    13,
    'input',
    'Adrian',
    $txt$Explain why prior knowledge changes the trust risk, while avoiding the claim that the client would definitely react badly.$txt$,
    $txt$Ключ: prior knowledge + relevance + omission. Використайте conditional language, не передбачайте реакцію клієнта як факт.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The limitation itself may be ordinary. What changes the trust risk is prior knowledge. If the client later learns that we knew about a condition relevant to something they had repeatedly identified as important, they may interpret the omission differently from a limitation that genuinely emerged later. I can't say they would definitely see it as deceptive, but it would make that interpretation more plausible.",
        "The commercial risk isn't simply that the product has a weakness. Most products do. The additional risk is that we possessed relevant information before the decision and chose not to raise it. If the issue later affects them, the conversation could shift from performance to whether they believe we acted transparently."
      ]
    }
    $json$::jsonb,
    'final-recommendation',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви точно пояснили, як prior knowledge може змінити trust risk, не прогнозуючи реакцію клієнта як факт.",
      "feedbackIncorrect": "Не стверджуйте, що клієнт точно втратить довіру. Поясніть, чому prior knowledge робить такий ризик більш plausibly material."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "analyse how prior knowledge changes trust risk",
      "skill": "risk-analysis",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-recommendation',
    14,
    'input',
    'Adrian',
    $txt$Give Adrian your final recommendation. Your answer should state what you would do, why, what uncertainty remains, and how you would communicate the issue without unnecessarily damaging the deal.$txt$,
    $txt$Фінальна C1 synthesis: recommendation + materiality + commercial impact + uncertainty + proportionate communication + mitigation.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "My recommendation would be a limited, proportionate disclosure before signature. I would tell the client that reporting performance can slow above a particular data volume, make clear that their current usage is below that threshold, explain that we don't yet know whether their growth will make the issue relevant, and outline the mitigation and engineering work underway. I recognise that this could delay the deal, so I would keep the message specific and avoid presenting it as a broader reliability problem. For me, the deciding factor is that the limitation relates directly to something they have identified as operationally important, which makes complete silence harder to justify.",
        "I would disclose the condition, but carefully. I wouldn't frame it as a defect that will affect them; I'd describe it as a known performance constraint that may become relevant if their volume increases. I would pair that with the evidence we have, the uncertainty, and our mitigation plan. That carries some short-term commercial risk, but I think it better balances informed client decision-making with our responsibility not to overstate a low-probability issue."
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
      "feedbackCorrect": "Сильна C1 synthesis: чітка рекомендація, nuance, uncertainty, proportionality і баланс short-term та long-term consequences.",
      "feedbackIncorrect": "Дайте конкретну рекомендацію. Врахуйте materiality, uncertainty, commercial consequences і спосіб proportionate communication."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-ethical-dilemma-adrian",
      "role": "Commercial Director",
      "goal": "synthesise ethical, commercial and uncertainty considerations into a defensible recommendation",
      "skill": "synthesis",
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
    $txt$Рішення сформовано. Ви оцінили не лише те, чи була інформація буквально правдивою, а й materiality omission, uncertainty, commercial pressure, довгострокову довіру та якість рішення на основі інформації, доступної в момент вибору.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "material information",
        "material omission",
        "proportionate disclosure",
        "commercial pressure",
        "informed decision",
        "prior knowledge",
        "hindsight",
        "trust risk"
      ]
    }
    $json$::jsonb
  );

end $$;