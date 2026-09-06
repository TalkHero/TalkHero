-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #12: The Final Decision
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
    'the-final-decision',
    'The Final Decision',
    'Make and defend a high-stakes strategic decision involving incomplete evidence, financial pressure, employee impact, ethical concerns and reputational risk.',
    'conversation',
    'C1',
    11,
    26,
    400,
    175,
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
        "subtitle": "Make the decision when no option is perfect",
        "objectives": [
          "synthesise incomplete and conflicting evidence",
          "distinguish facts assumptions and projections",
          "compare competing stakeholder interests",
          "evaluate financial ethical and reputational trade-offs",
          "use calibrated language under uncertainty",
          "respond to counterarguments",
          "define decision thresholds and safeguards",
          "deliver an executive recommendation with ownership"
        ]
      },
      "location": "london-executive-strategy-room",
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
    'Executive Decision',
    'Work with Eleanor to make and defend a strategic decision under uncertainty.',
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
    quest_uuid,
    act_uuid,
    'context',
    0,
    'narration',
    null,
    $txt$You are attending the final executive strategy meeting of the year.

The company must decide whether to proceed with the acquisition of Northbridge AI, a fast-growing technology company whose software could significantly accelerate your organisation's automation strategy.

The acquisition price is £82 million.

The strategic case appears strong:

• Northbridge's technology could reduce your projected automation roadmap by approximately eighteen months.
• Two major competitors are believed to be considering similar acquisitions.
• Internal modelling estimates £20–30 million in annual efficiency gains within three years if integration succeeds.
• Several major clients have asked whether your company can offer the kind of automation Northbridge provides.

However, serious uncertainties remain:

• Northbridge has only been profitable for two quarters.
• Approximately 38% of its revenue comes from three customers.
• Employee turnover has risen sharply during the past nine months.
• Due diligence identified weaknesses in internal governance and documentation.
• A former employee has alleged that one machine-learning model was trained using customer-derived data without sufficiently clear contractual permission.
• External lawyers say the allegation is credible enough to investigate but not currently proven.
• Northbridge management denies any deliberate misuse of data.

There are also internal consequences:

• Financing the acquisition would require delaying two existing investment programmes.
• Approximately 180 roles could become redundant if the technology is integrated as planned.
• The board has publicly committed to “responsible growth” and stronger AI governance.
• Walking away may allow a competitor to acquire Northbridge instead.

The CEO wants a recommendation today.

There is no risk-free option.

Eleanor, Chief Strategy Officer, has asked you to present your reasoning.$txt$,
    null,
    '[]'::jsonb,
    null,
    'eleanor-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Executive Strategy Room","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-opening',
    1,
    'dialogue',
    'Eleanor',
    $txt$Do not give me a yes or no yet. First, tell me what information in this case is established, what is projected and what is merely alleged or assumed.$txt$,
    null,
    '[]'::jsonb,
    null,
    'map-evidence',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'map-evidence',
    2,
    'input',
    'Eleanor',
    $txt$Classify the evidence: established facts, projections, assumptions and unresolved allegations.$txt$,
    $txt$Use calibrated language. Do not present estimates or allegations as facts.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The established facts include the acquisition price, Northbridge's recent profitability, customer concentration, employee turnover, governance weaknesses and the likely financing impact on our existing programmes. The efficiency gains and eighteen-month acceleration are projections rather than guaranteed outcomes. Competitor interest is an assumption based on market intelligence. The data-use issue is a credible but unresolved allegation that requires further investigation.",
        "We know the financial terms and several operational facts, including revenue concentration and governance weaknesses. We do not know whether the projected synergies will materialise at the estimated level. We also do not know whether a competitor will actually acquire Northbridge. The alleged misuse of customer-derived data remains unproven, although external counsel believes it is sufficiently credible to investigate."
      ]
    }
    $json$::jsonb,
    'eleanor-thesis',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви правильно розділили facts, projections, assumptions та allegations.",
      "feedbackIncorrect": "Не подавайте projected value, competitor interest або allegation як established fact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "classify evidence by certainty",
      "skill": "epistemic-precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-thesis',
    3,
    'dialogue',
    'Eleanor',
    $txt$Good. Now give me your provisional recommendation. You may recommend proceeding, walking away or proceeding only under conditions. But you must make the logic explicit.$txt$,
    null,
    '[]'::jsonb,
    null,
    'provisional-recommendation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'provisional-recommendation',
    4,
    'input',
    'Eleanor',
    $txt$State a provisional recommendation and justify it using both strategic upside and material risks.$txt$,
    $txt$There is no single required position. Your answer must be conditional, proportionate and evidence-based.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "My provisional recommendation would be to proceed only if we can make completion conditional on resolving the data-governance issue and strengthening the acquisition protections. The strategic upside is significant, particularly the potential acceleration of our automation roadmap, but the governance weaknesses, customer concentration and unresolved data allegation create risks that are too material to ignore.",
        "I would not recommend an unconditional acquisition today. I would keep the transaction alive while making final approval dependent on additional due diligence, contractual protections and a credible integration plan. That preserves the strategic opportunity without pretending the current uncertainty is acceptable."
      ]
    }
    $json$::jsonb,
    'eleanor-finance',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Recommendation має позицію, rationale і conditions.",
      "feedbackIncorrect": "Не давайте просто yes/no. Пов'яжіть позицію зі strategic upside, material risks і conditions."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "form a provisional strategic recommendation",
      "skill": "argumentation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-finance',
    5,
    'dialogue',
    'Eleanor',
    $txt$The CFO says: “The numbers justify the risk. Even the lower estimate gives us twenty million pounds in annual efficiency gains. Delaying could cost us the market.” What is missing from that argument?$txt$,
    null,
    '[]'::jsonb,
    null,
    'challenge-financial-case',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'challenge-financial-case',
    6,
    'input',
    'Eleanor',
    $txt$Challenge the financial argument without dismissing the strategic opportunity.$txt$,
    $txt$Distinguish modelled benefits from realised benefits and include downside exposure.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The financial case is important, but the twenty-million figure is a modelled outcome, not a guaranteed return. It depends on successful integration, retention of key customers and employees, and the absence of major legal or compliance costs. We should compare the expected upside with downside scenarios rather than treating the lower projection as if it were secure.",
        "The argument understates execution and governance risk. The acquisition may create substantial value, but the benefit estimate assumes successful integration. If customer concentration, talent loss or the data issue becomes more serious, both the revenue base and the projected synergies could deteriorate."
      ]
    }
    $json$::jsonb,
    'eleanor-people',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви не відкинули upside, але challengeнули certainty фінансової моделі.",
      "feedbackIncorrect": "Покажіть, чому projected benefit не дорівнює realised benefit, і назвіть downside exposure."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "evaluate projected financial upside critically",
      "skill": "critical-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-people',
    7,
    'dialogue',
    'Eleanor',
    $txt$The HR Director says the acquisition could eventually remove around 180 roles. The CEO replies, “We cannot avoid every difficult consequence if the strategy is right.” How would you frame the employee impact at board level?$txt$,
    null,
    '[]'::jsonb,
    null,
    'employee-impact',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'employee-impact',
    8,
    'input',
    'Eleanor',
    $txt$Address the employee impact without pretending that strategic change can be consequence-free.$txt$,
    $txt$Strong answer: acknowledge trade-off, distinguish necessity from convenience, propose mitigations and ownership.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The potential redundancies do not automatically make the acquisition wrong, but they are a material consequence rather than a footnote. The board should test whether the scale of job loss is genuinely necessary to realise the strategy, whether redeployment or retraining could reduce it, and what support we would provide if roles are removed. We should own that impact rather than describe it as an unavoidable side effect.",
        "A strategic decision can involve painful trade-offs, but we should not use that as permission to minimise them. If we proceed, I would expect a workforce transition plan, clear criteria for redundancies, retraining opportunities and transparent communication about why the changes are necessary."
      ]
    }
    $json$::jsonb,
    'decision-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви treated people impact as a material strategic consequence, not as PR.",
      "feedbackIncorrect": "Не кажіть просто “jobs are unfortunate”. Покажіть necessity test, mitigation та accountability."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "evaluate workforce impact responsibly",
      "skill": "ethical-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'decision-choice',
    9,
    'choice',
    'Eleanor',
    $txt$Which decision framework is strongest at this stage?$txt$,
    $txt$Choose the approach that preserves strategic optionality while controlling irreversible risk.$txt$,
    $json$
    [
      {
        "id": "conditional",
        "text": "Keep the acquisition active, but make final approval conditional on resolving the data issue, testing downside scenarios and agreeing integration safeguards.",
        "value": "conditional"
      },
      {
        "id": "immediate",
        "text": "Approve immediately because a competitor may acquire Northbridge first.",
        "value": "immediate"
      },
      {
        "id": "walk",
        "text": "Walk away immediately because any unresolved governance concern makes the acquisition unacceptable.",
        "value": "walk"
      }
    ]
    $json$::jsonb,
    '{"optionId":"conditional"}'::jsonb,
    'eleanor-ethics',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Conditional approval preserves optionality while reducing irreversible exposure.",
      "feedbackIncorrect": "Найсильніша framework зараз має зберігати opportunity, але встановлювати decision thresholds."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "select a reversible decision framework",
      "skill": "strategic-judgement",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-ethics',
    10,
    'dialogue',
    'Eleanor',
    $txt$Now the hardest issue. Suppose the data allegation is never conclusively proven, but the investigation shows Northbridge had weak controls and could not demonstrate clear permission for some historical data use. Is “not proven illegal” enough for us?$txt$,
    null,
    '[]'::jsonb,
    null,
    'ethical-threshold',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'ethical-threshold',
    11,
    'input',
    'Eleanor',
    $txt$Define the ethical and governance threshold for proceeding when legal certainty is incomplete.$txt$,
    $txt$Distinguish legal minimum from acceptable governance standard.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "No. The absence of proven illegality is not the same as evidence of acceptable governance. For an acquisition of this scale, I would need confidence that the historical data can be traced, that permission standards are defensible, that questionable datasets can be isolated or removed and that stronger controls can be implemented before integration.",
        "Our threshold should be higher than simply asking whether a violation can be proved. We are acquiring the operational practices and reputational exposure as well as the technology. If Northbridge cannot demonstrate where sensitive training data came from and on what basis it was used, that should affect whether and how we proceed."
      ]
    }
    $json$::jsonb,
    'eleanor-counterargument',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 65,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви розрізнили legal defensibility та governance acceptability.",
      "feedbackIncorrect": "Не зводьте threshold лише до “illegal/not illegal”. Визначте acceptable governance standard."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "define an ethical governance threshold",
      "skill": "ethical-judgement",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-counterargument',
    12,
    'dialogue',
    'Eleanor',
    $txt$The CEO makes the strongest counterargument: “If we wait for certainty, we will always be too late. Strategy requires acting before every risk is resolved.” I want you to answer that seriously, not dismiss it.$txt$,
    null,
    '[]'::jsonb,
    null,
    'answer-counterargument',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'answer-counterargument',
    13,
    'input',
    'Eleanor',
    $txt$Acknowledge the CEO's point, then explain what level of uncertainty is acceptable and what must be resolved before commitment.$txt$,
    $txt$C1: concession + boundary + decision threshold.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I agree that strategy often requires acting before uncertainty disappears. Waiting for complete certainty would effectively mean giving up the opportunity. The distinction I would make is between risks we can price, monitor or reverse and risks that could fundamentally change the value or legitimacy of the transaction. We do not need every integration detail resolved, but we do need sufficient clarity on the data issue, customer concentration and governance controls before making an irreversible commitment.",
        "The CEO is right that uncertainty cannot be eliminated. My concern is not uncertainty itself but whether the unresolved issues could invalidate the strategic case. We can accept normal execution risk, but we should not close the transaction while a governance issue remains capable of creating regulatory, reputational or technical exposure that we cannot yet bound."
      ]
    }
    $json$::jsonb,
    'eleanor-final',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 70,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви conceded valid point, але встановили чіткий decision boundary.",
      "feedbackIncorrect": "Не відповідайте просто “I disagree”. Визнайте valid uncertainty argument і визначте threshold."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "respond to the strongest counterargument",
      "skill": "counterargument-and-boundary",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'eleanor-final',
    14,
    'input',
    'Eleanor',
    $txt$You have five minutes with the board. Give me your final recommendation: what should we do, why, under what conditions, what are the main trade-offs, and what would cause you to change your recommendation?$txt$,
    $txt$Final C1 capstone: synthesis, nuance, executive register, explicit trade-offs, uncertainty, conditions, ownership and change-of-course criteria.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "My recommendation is to continue toward the acquisition, but not to give unconditional final approval today. The strategic case is credible: Northbridge could materially accelerate our automation capability and there is a real competitive cost to delay. However, that upside is still projected, while the customer concentration, governance weaknesses and unresolved data-use issue are established enough to justify stronger conditions. I would require targeted legal and technical due diligence on the training data, contractual protections for undisclosed liabilities, a retention and customer-concentration plan, and a workforce transition plan before closing. The principal trade-off is speed versus the risk of acquiring problems that could undermine both the financial case and our responsible-growth commitments. I would change my recommendation if the data review showed systematic misuse, if major customers were likely to leave, or if the economics no longer worked under a realistic downside scenario.",
        "I would recommend conditional approval rather than either immediate completion or withdrawal. The opportunity is strategically significant, but the current evidence does not justify treating the transaction as routine. Before commitment, I would want the data-governance issue bounded, downside scenarios tested, key customers and employees assessed, and integration safeguards agreed. We should accept ordinary execution uncertainty, but not uncertainty that could undermine the legality, reputation or value of the acquisition. If those conditions cannot be met within a defined timetable, I would recommend walking away."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 80,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний C1 executive recommendation: synthesis, trade-offs, conditions і clear change-of-course criteria.",
      "feedbackIncorrect": "Фінальна відповідь має містити recommendation, rationale, conditions, trade-offs та criteria for changing course."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-final-decision-eleanor",
      "role": "Chief Strategy Officer",
      "goal": "deliver the final executive recommendation",
      "skill": "advanced-synthesis",
      "cefr": "C1",
      "capstone": true
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
    $txt$The Final Decision завершено. Ви завершили London Advanced: аналізували incomplete evidence, відрізняли facts від projections, зважували фінансові, етичні та людські наслідки, відповідали на сильні counterarguments і захищали executive decision англійською на рівні C1.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "campaignCompletion": true,
      "capstone": true,
      "learnedWords": [
        "conditional approval",
        "decision threshold",
        "downside scenario",
        "irreversible commitment",
        "strategic optionality",
        "governance standard",
        "customer concentration",
        "execution risk",
        "change of course",
        "material uncertainty"
      ]
    }
    $json$::jsonb
  );

end $$;