-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #11: Reputation Crisis
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
    'reputation-crisis',
    'Reputation Crisis',
    'Respond to a fast-moving public controversy while separating confirmed facts from allegations, preserving credibility and communicating accountability without premature conclusions.',
    'conversation',
    'C1',
    10,
    25,
    360,
    150,
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
        "subtitle": "Protect trust under public pressure",
        "objectives": [
          "distinguish confirmed facts from allegations",
          "communicate uncertainty precisely",
          "show accountability without premature admission",
          "answer hostile questions without becoming defensive",
          "correct misinformation proportionately",
          "manage contradictions in incomplete evidence",
          "balance speed, legal caution and public trust",
          "deliver a credible crisis statement"
        ]
      },
      "location": "london-crisis-communications-room"
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
    'Crisis Communications',
    'Work with Diana to build a credible response to a rapidly developing reputation crisis.',
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
    $txt$At 08:40 this morning, a video was posted online by a former contractor who claims your company deliberately ignored a serious safety issue in one of its consumer products.

The video has now been viewed more than 2.4 million times.

Several major news outlets are reporting the allegation.

What is currently confirmed:

• The contractor worked on the relevant product programme for seven months.
• An internal engineering report from four months ago identified a potential overheating risk under rare conditions.
• The report recommended additional testing before the next production cycle.
• The company carried out additional testing.
• The product remained on sale.
• No regulatory recall has been issued.
• Customer support records show twelve overheating complaints in the past six months.

What is not yet confirmed:

• Whether senior leadership saw the original engineering report.
• Whether the twelve complaints are related to the same technical issue.
• Whether any customer suffered an injury.
• Whether the contractor's claim that evidence was deliberately suppressed is true.
• Whether current units on sale present a material safety risk.

The CEO wants a public statement within thirty minutes.

Legal counsel says the company should avoid language that could be interpreted as admitting liability.

Journalists are already asking whether the company “put profit before customer safety”.

Diana, Director of Corporate Communications, has called you into the crisis room.$txt$,
    null,
    '[]'::jsonb,
    null,
    'diana-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Crisis Communications Room","emotion":"urgent"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-opening',
    1,
    'dialogue',
    'Diana',
    $txt$We have very little time. Before we draft anything, give me the situation in three categories: what we know, what we do not know, and what the public is currently being led to believe.$txt$,
    null,
    '[]'::jsonb,
    null,
    'separate-facts',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'separate-facts',
    2,
    'input',
    'Diana',
    $txt$Separate confirmed facts, unresolved questions and public allegations.$txt$,
    $txt$Do not collapse allegation into fact. Use precise language such as “confirmed”, “reported”, “not yet established” and “we do not currently know”. $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We know the contractor worked on the programme, an engineering report identified a potential overheating risk, further testing was conducted, the product remained on sale and twelve overheating complaints were recorded. We do not yet know whether leadership saw the report, whether the complaints share the same cause, whether anyone was injured or whether current units present a material risk. The public allegation is that the company knowingly suppressed safety evidence, but that has not been established.",
        "The confirmed facts are limited. There was an internal risk report, additional testing took place and there have been customer complaints. The unresolved issues include leadership awareness, the relationship between the complaints and the reported defect, and the current level of risk. The claim that the company deliberately ignored or concealed the issue remains an allegation."
      ]
    }
    $json$::jsonb,
    'diana-pressure',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко відокремили confirmed facts від allegations та unknowns.",
      "feedbackIncorrect": "Не змішуйте public allegation з established fact. Покажіть три окремі категорії."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "separate facts allegations and uncertainty",
      "skill": "precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-pressure',
    3,
    'dialogue',
    'Diana',
    $txt$The CEO wants the first statement to say: “We have found no evidence that our products are unsafe.” Technically, nobody has proved the opposite. Would you use that line?$txt$,
    null,
    '[]'::jsonb,
    null,
    'challenge-overclaim',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'challenge-overclaim',
    4,
    'input',
    'Diana',
    $txt$Respond to the CEO's proposed wording and explain the reputational risk.$txt$,
    $txt$Strong answer: distinguish “not proved unsafe” from “evidence of no risk”. Calibrate certainty.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would not use that wording. We have evidence of a potential safety concern, so saying we have found no evidence of unsafe products could sound misleading even if the final risk assessment is still open. I would say that we are urgently reviewing the available evidence and have not yet established whether current products present a material safety risk.",
        "That statement overreaches. Absence of a confirmed conclusion is not the same as evidence that there is no problem. If later findings show a genuine defect, the original statement would damage credibility more than a careful acknowledgement of uncertainty now."
      ]
    }
    $json$::jsonb,
    'diana-accountability',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви уникнули false certainty та захистили credibility.",
      "feedbackIncorrect": "Поясніть різницю між “not yet confirmed” і “there is no evidence of risk”."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "avoid unsupported reassurance",
      "skill": "epistemic-precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-accountability',
    5,
    'dialogue',
    'Diana',
    $txt$Legal counsel is worried about admitting fault. But if we sound evasive, the public may assume we do not care. How can we demonstrate accountability without claiming responsibility for something we have not established?$txt$,
    null,
    '[]'::jsonb,
    null,
    'accountability-without-admission',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'accountability-without-admission',
    6,
    'input',
    'Diana',
    $txt$Show accountability while preserving factual and legal precision.$txt$,
    $txt$Focus on responsibility for investigation, customer safety, evidence preservation and transparent updates.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We can take responsibility for the response even before responsibility for the underlying event is established. We should say that customer safety is our priority, that we are reviewing the engineering report and complaint data urgently, that we will cooperate with any regulatory review and that we will publish material findings as they are confirmed.",
        "Accountability does not require a premature admission of fault. We can commit to investigating the issue independently, protecting customers while the review is underway, preserving relevant records and communicating what we learn rather than minimising the concern."
      ]
    }
    $json$::jsonb,
    'diana-journalist',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви відокремили accountability for response від premature admission of liability.",
      "feedbackIncorrect": "Не обирайте між повним denial і admission. Покажіть конкретну відповідальність за response."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "communicate accountability without premature admission",
      "skill": "nuance",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-journalist',
    7,
    'dialogue',
    'Diana',
    $txt$A journalist has just sent this question: “Your own engineers warned you about overheating months ago. Why did your company put profit before customer safety?” Give me an answer that does not accept the premise, but also does not sound evasive.$txt$,
    null,
    '[]'::jsonb,
    null,
    'hostile-question',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'hostile-question',
    8,
    'input',
    'Diana',
    $txt$Answer the hostile question by rejecting the unsupported premise, acknowledging the legitimate concern and returning to verified facts.$txt$,
    $txt$Do not say “that's false” unless the evidence establishes it. Avoid “no comment”. $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would not accept the suggestion that profit was prioritised over safety because that conclusion has not been established. What we can confirm is that an engineering concern was raised and additional testing followed. We are now reviewing whether that process was sufficient and whether the recent complaints are related. The underlying safety question is legitimate, and we intend to address it with evidence rather than speculation.",
        "The premise of the question goes beyond what we currently know. There was an internal report and further testing was conducted, but we have not established that management knowingly ignored a material risk. We do recognise the seriousness of the concern and are urgently reviewing both the decision process and the customer complaints."
      ]
    }
    $json$::jsonb,
    'statement-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви не прийняли loaded premise, але й не стали defensive.",
      "feedbackIncorrect": "Відхиліть unsupported premise, визнайте legitimate concern і поверніться до confirmed facts."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "handle a hostile loaded question",
      "skill": "media-response",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'statement-choice',
    9,
    'choice',
    'Diana',
    $txt$Which opening line is strongest for the company's first public statement?$txt$,
    $txt$Choose the option that acknowledges seriousness without claiming facts that are not established.$txt$,
    $json$
    [
      {
        "id": "balanced",
        "text": "We are aware of the serious concerns raised today and are urgently reviewing the underlying engineering records, testing decisions and customer reports.",
        "value": "balanced"
      },
      {
        "id": "deny",
        "text": "The allegations circulating online are false and our products are safe.",
        "value": "deny"
      },
      {
        "id": "admit",
        "text": "We apologise for failing to act on known safety risks and accept full responsibility.",
        "value": "admit"
      }
    ]
    $json$::jsonb,
    '{"optionId":"balanced"}'::jsonb,
    'diana-new-information',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Це serious, transparent і factually calibrated.",
      "feedbackIncorrect": "Уникайте як unsupported denial, так і premature admission."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "choose appropriately calibrated opening statement",
      "skill": "register-awareness",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-new-information',
    10,
    'dialogue',
    'Diana',
    $txt$New information. Engineering has confirmed that the twelve complaints do not all involve the same product configuration. However, three complaints appear technically consistent with the failure mode described in the internal report. Social media is already saying, “Twelve confirmed dangerous units.” How do we correct that?$txt$,
    null,
    '[]'::jsonb,
    null,
    'correct-misinformation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'correct-misinformation',
    11,
    'input',
    'Diana',
    $txt$Correct the misinformation without minimising the underlying risk.$txt$,
    $txt$C1 balance: correct the number, preserve uncertainty, acknowledge that three cases are still significant.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "It would be inaccurate to describe all twelve complaints as confirmed examples of the same safety issue. Our current review indicates that three complaints may be consistent with the failure mode identified in the earlier engineering report, while the remaining cases involve different configurations or are still being assessed. Those three cases are being treated seriously and remain under investigation.",
        "The claim that twelve dangerous units have been confirmed is not supported by the evidence. We are currently examining three complaints that appear potentially related to the reported overheating mechanism. We should correct the number clearly without suggesting that three possible cases are insignificant."
      ]
    }
    $json$::jsonb,
    'diana-contradiction',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви corrected misinformation без minimisation.",
      "feedbackIncorrect": "Не кажіть просто “12 is wrong”. Дайте accurate current state і не применшуйте три можливі cases."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "correct misinformation proportionately",
      "skill": "precision-and-balance",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-contradiction',
    12,
    'dialogue',
    'Diana',
    $txt$Another complication. The Chief Operating Officer said in an interview six months ago that “all significant engineering risks are escalated to executive level”. We still do not know whether this specific report was escalated. Journalists have found the quote. What do we say?$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-contradiction',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'handle-contradiction',
    13,
    'input',
    'Diana',
    $txt$Address the apparent contradiction without inventing an explanation.$txt$,
    $txt$Recognise the discrepancy, state what is unresolved and explain what evidence must be checked.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The earlier statement described the company's escalation policy, but we have not yet established whether this particular report was treated as a significant risk or whether it reached executive level. That is an important discrepancy and we are reviewing the escalation records, meeting notes and distribution history rather than speculating about what happened.",
        "We should acknowledge that the quote raises a legitimate question. If significant risks are normally escalated, we need to establish whether this report qualified under that process and whether the process was followed. Until that review is complete, we should not claim either that executives knew or that they did not."
      ]
    }
    $json$::jsonb,
    'diana-final',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви acknowledged discrepancy без invented explanation.",
      "feedbackIncorrect": "Не вигадуйте, чому report був або не був escalated. Назвіть contradiction і evidence needed."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "manage an unresolved contradiction",
      "skill": "epistemic-discipline",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diana-final',
    14,
    'input',
    'Diana',
    $txt$Give me the final public statement. It should acknowledge the concern, separate facts from allegations, explain what the company is doing now and commit to the next update without overpromising.$txt$,
    $txt$Final C1 synthesis: credible, calm, accountable, legally careful, non-defensive and concrete. $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We are aware of the serious concerns raised today regarding a potential overheating risk in one of our products. We can confirm that an internal engineering report identified a potential issue and that additional testing was subsequently carried out. We are now reviewing whether that testing and the related escalation process were sufficient, and we are examining customer complaints to determine whether any are linked to the same failure mode. Claims that safety information was deliberately suppressed have not been established, and we will not speculate while the review is underway. We are preserving relevant records, working with our technical and legal teams and will cooperate fully with any regulatory enquiries. Customer safety remains our priority, and we will provide a further factual update as soon as material findings are confirmed.",
        "Today's allegations raise legitimate questions that require a careful evidence-based response. We have confirmed that a potential overheating risk was previously identified and tested, but we have not yet established whether current products present a material safety risk or whether senior leadership was aware of the original report. We are urgently reviewing the engineering evidence, customer complaints and escalation records. We will correct inaccurate information where necessary, but we will also be transparent about what remains unresolved. We will publish a further update when the review produces material confirmed findings."
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
      "feedbackCorrect": "Сильний crisis statement: accurate, accountable, restrained і credible.",
      "feedbackIncorrect": "Фінальний statement має поєднати facts, uncertainty, accountability, current actions і next update."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-reputation-crisis-diana",
      "role": "Director of Corporate Communications",
      "goal": "deliver a complete crisis statement",
      "skill": "executive-synthesis",
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
    $txt$Reputation Crisis завершено. Ви працювали з confirmed facts, allegations та uncertainty, уникали premature admissions, відповідали на hostile questions, коригували misinformation і сформували credible public crisis response.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "confirmed finding",
        "unverified allegation",
        "material safety risk",
        "premature admission",
        "loaded premise",
        "to preserve credibility",
        "to correct misinformation",
        "escalation process",
        "regulatory enquiry",
        "factual update"
      ]
    }
    $json$::jsonb
  );

end $$;