-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #8: The Board Meeting
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
    'the-board-meeting',
    'The Board Meeting',
    'Представте board стратегічну рекомендацію за умов неповної інформації. Відокремлюйте факти від припущень, працюйте з uncertainty, counterarguments, risk та executive pressure.',
    'conversation',
    'C1',
    7,
    24,
    330,
    135,
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
        "subtitle": "Strategic judgement under board-level pressure",
        "objectives": [
          "відрізняти facts від assumptions",
          "формулювати uncertainty точно",
          "захищати recommendation без overclaiming",
          "працювати з counterarguments",
          "оцінювати operational та reputational risk",
          "reframe short-term pressure",
          "показувати trade-offs",
          "давати concise executive recommendation"
        ]
      },
      "location": "london-boardroom"
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
    'Board Review',
    'Захистіть стратегічну рекомендацію перед Helen, Board Chair, під тиском складних питань та суперечливих пріоритетів.',
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
    $txt$Your company is considering an accelerated expansion into a new European market.

The opportunity is attractive: the commercial team estimates that entering this year could add between £6 million and £9 million in annual revenue within two years.

However, the evidence is incomplete.

Confirmed facts:
• Two large prospective clients have expressed serious interest.
• Local regulatory approval is possible but not yet secured.
• Operations estimates that the current platform can support the first phase.
• A competitor is also expected to enter the market.

Uncertainties:
• Customer demand beyond the first two prospects has not been independently validated.
• Regulatory approval could take three to nine months.
• The existing support team may struggle if adoption is faster than expected.
• The reputational impact of a rushed launch is difficult to quantify.

Management wants your recommendation before committing significant capital.

You are presenting to the board. Helen, the Board Chair, will challenge your reasoning.$txt$,
    null,
    '[]'::jsonb,
    null,
    'helen-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Boardroom","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-opening',
    1,
    'dialogue',
    'Helen',
    $txt$Let's start with the conclusion. Are you recommending that we enter the market this year or not? I don't want a summary of the deck. I want your judgement.$txt$,
    null,
    '[]'::jsonb,
    null,
    'initial-recommendation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'initial-recommendation',
    2,
    'input',
    'Helen',
    $txt$Give a clear recommendation, but qualify it appropriately. Avoid pretending the uncertainty does not exist.$txt$,
    $txt$Board-level answer: decision first, conditions second. Не ховайтеся за “it depends”. Але й не overclaim.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Yes, I recommend entering this year, but through a staged launch rather than a full commitment. The commercial signal is strong enough to justify moving, while the regulatory and operational uncertainty is still too high to support an irreversible expansion.",
        "My recommendation is to proceed this year, subject to two conditions: regulatory clearance and a controlled first phase with explicit capacity limits. That lets us preserve the timing advantage without treating the revenue forecast as guaranteed."
      ]
    }
    $json$::jsonb,
    'helen-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви дали decision, але не перетворили uncertainty на certainty.",
      "feedbackIncorrect": "Потрібна чітка recommendation. Не відповідайте лише “it depends”, але й не подавайте прогноз як гарантований результат."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "state a qualified executive recommendation",
      "skill": "executive-judgement",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-evidence',
    3,
    'dialogue',
    'Helen',
    $txt$You're describing the commercial signal as strong. We have two interested clients and a forecast from our own sales team. Which part of your case is fact, and which part is assumption?$txt$,
    null,
    '[]'::jsonb,
    null,
    'fact-vs-assumption',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'fact-vs-assumption',
    4,
    'input',
    'Helen',
    $txt$Separate confirmed evidence from assumptions and explain how that affects your confidence.$txt$,
    $txt$Не змішуйте “two prospects are interested” з “the market is validated”. Покажіть рівень confidence.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The confirmed fact is that two large prospects have expressed serious interest. The assumption is that this reflects broader market demand and can scale into the £6 to £9 million forecast. I would treat the first as evidence of an opportunity, but not as proof of market-wide demand.",
        "We know there are two credible prospects. We do not yet know whether demand beyond them is sufficient to support the full forecast. So my confidence is high that there is an initial opportunity, but materially lower that the revenue estimate will be achieved on the current timetable."
      ]
    }
    $json$::jsonb,
    'helen-revenue',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко відокремили evidence від inference.",
      "feedbackIncorrect": "Назвіть окремо confirmed facts та assumptions. Не використовуйте forecast як доказ самого себе."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "separate facts from assumptions",
      "skill": "evidence-calibration",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-revenue',
    5,
    'dialogue',
    'Helen',
    $txt$The CFO's view is simple: if we wait, the competitor gets first-mover advantage and we lose revenue. Why isn't delay the bigger risk?$txt$,
    null,
    '[]'::jsonb,
    null,
    'reframe-risk',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-risk',
    6,
    'input',
    'Helen',
    $txt$Respond to the short-term revenue argument without dismissing it. Compare the risk of waiting with the risk of moving too aggressively.$txt$,
    $txt$Strong C1 answer = acknowledge valid concern + reframe trade-off + propose controllable response.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Delay is a real risk, especially if the competitor establishes relationships first. But the choice is not simply move now or lose the market. The other risk is committing too much capacity before demand and regulation are sufficiently clear. A staged entry addresses both: we preserve momentum without making the whole investment irreversible.",
        "I agree that waiting has a cost. My concern is that treating speed as the only risk creates a false comparison. We also face regulatory, service and reputational exposure if we scale before the operating model is ready. The question is how much commitment is justified by the evidence we have today."
      ]
    }
    $json$::jsonb,
    'helen-operations',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви не заперечили revenue risk, а поставили його поруч з іншими ризиками.",
      "feedbackIncorrect": "Не відкидайте аргумент CFO. Визнайте cost of delay і порівняйте його з downside швидкого масштабування."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "reframe competing strategic risks",
      "skill": "risk-framing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-operations',
    7,
    'dialogue',
    'Helen',
    $txt$Operations says the platform can support the first phase. Why are you still worried about operational capacity?$txt$,
    null,
    '[]'::jsonb,
    null,
    'qualify-operations',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'qualify-operations',
    8,
    'input',
    'Helen',
    $txt$Explain why the operations statement does not eliminate uncertainty. Distinguish technical capacity from organisational capacity.$txt$,
    $txt$Не вигадуйте failure. Покажіть scope: “platform can support first phase” ≠ “whole organisation can scale safely”. $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The statement reduces one category of risk, but it doesn't remove all operational uncertainty. The platform may support the first phase technically, while support, onboarding and incident response capacity could still become constrained if adoption is faster than expected.",
        "I take Operations' assessment seriously. My concern is the scope of that assessment. It confirms technical capacity for phase one, not necessarily organisational capacity under a higher-than-expected adoption scenario. Those are related but not identical questions."
      ]
    }
    $json$::jsonb,
    'board-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не заперечили факт, а уточнили його scope.",
      "feedbackIncorrect": "Не кажіть, що Operations помиляється. Поясніть різницю між confirmed technical capacity та broader organisational capacity."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "qualify evidence by scope",
      "skill": "scope-and-precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'board-choice',
    9,
    'choice',
    'Helen',
    $txt$The board asks how it should treat the £6–9 million revenue estimate. Which response is strongest?$txt$,
    $txt$A C1 answer should neither dismiss the forecast nor treat it as certainty.$txt$,
    $json$
    [
      {
        "id": "range",
        "text": "Treat it as a planning range based on current assumptions, not as a committed outcome. We should test the assumptions during the first phase and update the forecast as evidence improves.",
        "value": "range"
      },
      {
        "id": "guarantee",
        "text": "The forecast is credible enough that the board can plan on at least £6 million.",
        "value": "guarantee"
      },
      {
        "id": "ignore",
        "text": "The forecast is too uncertain to be useful, so I would ignore it for now.",
        "value": "ignore"
      }
    ]
    $json$::jsonb,
    '{"optionId":"range"}'::jsonb,
    'helen-reputation',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Forecast використовується як planning range, а не як guarantee.",
      "feedbackIncorrect": "Не перетворюйте estimate ні на certainty, ні на useless number."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "calibrate confidence in forecasts",
      "skill": "forecast-calibration",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-reputation',
    10,
    'dialogue',
    'Helen',
    $txt$You're also mentioning reputational risk. That sounds vague. What exactly are you asking the board to worry about?$txt$,
    null,
    '[]'::jsonb,
    null,
    'define-reputation-risk',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'define-reputation-risk',
    11,
    'input',
    'Helen',
    $txt$Translate “reputational risk” into a concrete mechanism without pretending you can quantify what is not known.$txt$,
    $txt$Avoid vague language. Explain cause → possible consequence → uncertainty.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The risk is not reputation in the abstract. If we launch before support and regulatory processes are stable, early customers could experience service failures or inconsistent communication. That could weaken trust in a market where we are still establishing credibility. I can't quantify that precisely today, but the mechanism is clear enough to manage.",
        "I'm referring to a specific pathway: operational or compliance problems during an early launch could become visible to customers and partners before we have an established track record. The scale of that impact is uncertain, but it is not a purely theoretical concern."
      ]
    }
    $json$::jsonb,
    'helen-pushback',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви зробили vague risk конкретним без fake precision.",
      "feedbackIncorrect": "Не повторюйте просто “brand damage”. Покажіть causal mechanism і чесно позначте uncertainty."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "make qualitative risk concrete",
      "skill": "causal-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-pushback',
    12,
    'dialogue',
    'Helen',
    $txt$One director has challenged your logic. He says a staged launch sounds cautious but may leave us with all the setup cost and none of the scale benefits. What do you say?$txt$,
    null,
    '[]'::jsonb,
    null,
    'answer-counterargument',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "emotion": "thinking"
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
    'Helen',
    $txt$Address the counterargument seriously. Acknowledge its validity, then explain why the staged approach still has strategic value or under what conditions you would abandon it.$txt$,
    $txt$Не caricature the objection. Strong answer = valid concern + threshold/condition + reasoning.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That's a valid concern. A staged launch only makes sense if the first phase is designed to generate decision-relevant evidence rather than simply delay scale. I would define clear thresholds for regulatory progress, customer conversion and operational load. If those thresholds are not met, we should stop rather than continue absorbing setup cost.",
        "I agree that a badly designed pilot could give us the cost without the benefit. The value comes from making the next commitment conditional on evidence. If we cannot define what the first phase is meant to prove and what would trigger expansion or withdrawal, then I would not recommend calling it a staged strategy."
      ]
    }
    $json$::jsonb,
    'helen-final',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви прийняли counterargument і дали decision thresholds замість defensive response.",
      "feedbackIncorrect": "Не відкидайте objection. Визнайте його силу й поясніть, за яких умов staged approach має сенс."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "integrate counterarguments into recommendation",
      "skill": "counterargument-and-synthesis",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'helen-final',
    14,
    'input',
    'Helen',
    $txt$The board is ready to decide. Give your final recommendation in executive form: decision, rationale, key condition and what evidence would make you change course.$txt$,
    $txt$C1 synthesis. Concise, decisive, calibrated. Не повторюйте всю презентацію.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I recommend entering the market this year through a staged launch. The opportunity is credible, but the evidence does not justify a full irreversible commitment. We should proceed only once regulatory clearance is sufficiently advanced and with explicit operational capacity limits. The first phase should test customer conversion, support load and regulatory execution. If those indicators are materially weaker than expected, I would stop or delay further investment.",
        "My recommendation is to move now, but conditionally. We have enough evidence to justify preserving the opportunity, not enough to assume the full revenue case is proven. I would authorise a limited first phase with defined regulatory, commercial and operational thresholds. If demand fails to extend beyond the initial prospects, or if capacity and compliance risks rise materially, the board should reconsider expansion."
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
      "feedbackCorrect": "Сильне executive conclusion: decision, rationale, conditions і change-of-course criteria.",
      "feedbackIncorrect": "Фінальна відповідь має містити чітку decision, rationale, key conditions і trigger для зміни курсу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-board-meeting-helen",
      "role": "Board Chair",
      "goal": "deliver a concise board-level recommendation",
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
    $txt$Board meeting завершено. Ви відокремили facts від assumptions, кваліфікували forecasts, працювали з competing risks, відповіли на counterarguments і сформулювали чітку executive recommendation без fake certainty.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "strategic assumption",
        "planning range",
        "decision threshold",
        "staged launch",
        "irreversible commitment",
        "operational capacity",
        "reputational exposure",
        "change of course"
      ]
    }
    $json$::jsonb
  );

end $$;