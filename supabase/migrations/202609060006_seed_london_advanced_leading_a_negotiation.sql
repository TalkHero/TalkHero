-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #6: Leading a Negotiation
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
    'leading-a-negotiation',
    'Leading a Negotiation',
    'Проведіть складні B2B-переговори з директором із закупівель. Захищайте комерційну цінність, перевіряйте припущення, обмінюйте поступки на зустрічну цінність і сформуйте збалансовану пакетну угоду.',
    'conversation',
    'C1',
    5,
    24,
    310,
    125,
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
        "subtitle": "Trade-offs, leverage and conditional concessions",
        "objectives": [
          "відрізняти positions від underlying interests",
          "перевіряти negotiation assumptions",
          "використовувати conditional concessions",
          "не віддавати поступки без зустрічної цінності",
          "працювати з кількома змінними одночасно",
          "протистояти artificial deadlines",
          "оцінювати BATNA та leverage",
          "закривати переговори precise conditional agreement"
        ]
      },
      "location": "london-procurement-boardroom"
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
    'The Deal',
    'Проведіть переговори з Victor, Procurement Director, і сформуйте угоду, яка захищає цінність для обох сторін.',
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
    $txt$You are negotiating a major enterprise contract with Victor, Procurement Director for a national retail group.

Your standard proposal is £480,000 per year on a two-year agreement. It includes standard implementation and business-hours support.

Victor's company is strategically valuable, but you have limits. A substantial discount would require either a longer commitment or a reduction in scope. Premium 24/7 support is expensive to provide. Exclusivity would prevent you from working with several potential clients in the same sector.

You have another credible prospect, so this deal matters — but you do not need to accept it at any price.$txt$,
    null,
    '[]'::jsonb,
    null,
    'victor-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Procurement Boardroom","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victor-opening',
    1,
    'dialogue',
    'Victor',
    $txt$Let's save ourselves an hour. I like your product, but £480,000 isn't going through procurement. If you can get close to £400,000, we may have something to discuss.$txt$,
    null,
    '[]'::jsonb,
    null,
    'diagnose-interest',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diagnose-interest',
    2,
    'input',
    'Victor',
    $txt$Do not immediately accept, reject or counter the £400,000 figure. Ask a precise question that helps you understand what is driving Victor's position.$txt$,
    $txt$Не торгуйтеся тільки навколо цифри. З'ясуйте underlying interest: budget ceiling, internal approval, benchmark, total cost або інше обмеження.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Before we move the number, can I understand what's driving the £400,000 threshold? Is that a fixed budget constraint, an internal approval level, or a benchmark you're using against alternatives?",
        "That's useful to know. What I'd like to understand first is whether £400,000 reflects an absolute budget ceiling or whether the concern is the value you're getting at £480,000."
      ]
    }
    $json$::jsonb,
    'victor-budget',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви не почали торгуватися проти самого себе, а спочатку дослідили interest за позицією.",
      "feedbackIncorrect": "Не поспішайте давати counteroffer. Спочатку з'ясуйте, чому саме Victor називає £400,000."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "diagnose the interest behind a stated position",
      "skill": "interest-based-negotiation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victor-budget',
    3,
    'dialogue',
    'Victor',
    $txt$It's partly budget, but it's also internal optics. At nearly half a million, the CFO will ask why we didn't choose a cheaper supplier. At around £400,000, I can make the approval process much easier.$txt$,
    null,
    '[]'::jsonb,
    null,
    'reframe-value',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-value',
    4,
    'input',
    'Victor',
    $txt$Reframe the negotiation away from headline price alone. Recognise Victor's approval problem and explore whether changing the commercial structure could create value without simply giving an £80,000 discount.$txt$,
    $txt$Покажіть, що ви почули його constraint. Потім відкрийте інші variables: term, scope, support, payment structure або commitment.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That helps. It sounds as though the issue isn't simply that £480,000 is unaffordable; it's also whether you can defend the number internally. Rather than treating £400,000 as a standalone discount, perhaps we should look at the structure. If there were a longer commitment or a different support package, we might be able to move the annual figure while preserving the economics.",
        "I understand the approval issue. If the headline price is what creates the internal obstacle, I'd rather look at what we could exchange for movement on price — for example contract length, scope or support — than reduce the number without changing anything else."
      ]
    }
    $json$::jsonb,
    'victor-package',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви reframed price як одну зі змінних, а не всю переговорну проблему.",
      "feedbackIncorrect": "Не захищайте £480,000 абстрактно. Пов'яжіть можливий рух у ціні зі зміною інших умов."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "reframe a price negotiation into a multi-variable negotiation",
      "skill": "reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victor-package',
    5,
    'dialogue',
    'Victor',
    $txt$Fine. Suppose we give you three years instead of two. In return, I want £420,000 a year, 24/7 premium support included, and sector exclusivity for the first eighteen months.$txt$,
    null,
    '[]'::jsonb,
    null,
    'evaluate-package',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evaluate-package',
    6,
    'input',
    'Victor',
    $txt$Respond to Victor's package without negotiating each item separately. Identify the valuable part of his offer, explain which elements create difficulty, and make a conditional counterproposal.$txt$,
    $txt$C1: package the variables. Використовуйте if/then logic. Не давайте discount + premium support + exclusivity в обмін лише на один concession.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The three-year commitment gives us something meaningful to work with, but the package as a whole moves too much value in one direction. £420,000 together with premium support and eighteen months of exclusivity would be difficult for us to justify. If you're prepared to commit for three years, we could explore movement on price, but premium support would need to remain separately priced and exclusivity would have to be much narrower.",
        "A three-year term improves the economics, so I can see a basis for movement. I couldn't combine £420,000, full premium support and broad exclusivity on that basis alone. If we use the longer term to reduce the annual price, we'd need either standard support or a paid premium tier, and any exclusivity would need to be limited in scope and duration."
      ]
    }
    $json$::jsonb,
    'victor-exclusivity',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна package response: ви оцінили сукупну економіку та зробили conditional counterproposal.",
      "feedbackIncorrect": "Не обговорюйте кожен пункт ізольовано. Покажіть загальний trade-off і зв'яжіть кожну поступку із зустрічною цінністю."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "respond to a multi-variable package with conditional trades",
      "skill": "package-negotiation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victor-exclusivity',
    7,
    'dialogue',
    'Victor',
    $txt$Exclusivity matters more than you're assuming. If we're going to help establish you in our sector, I don't want our direct competitors benefiting from the same relationship six months later.$txt$,
    null,
    '[]'::jsonb,
    null,
    'test-assumption',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'test-assumption',
    8,
    'input',
    'Victor',
    $txt$Test what Victor actually needs from exclusivity instead of assuming the only options are full exclusivity or none. Look for a narrower underlying interest.$txt$,
    $txt$Запитайте, що саме він захищає: named competitors, geography, product configuration, case-study timing, або first-mover advantage.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Let me test what you actually need to protect. Is the concern that we work with anyone in the sector, or specifically that your closest competitors could replicate the same implementation immediately? If it's the second, we may be able to define something much narrower than sector-wide exclusivity.",
        "I understand the first-mover concern. Would limited protection against a defined group of direct competitors address it, rather than preventing us from working across the entire sector for eighteen months?"
      ]
    }
    $json$::jsonb,
    'negotiation-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Ви перевірили underlying interest замість того, щоб сперечатися з broad position.",
      "feedbackIncorrect": "Не приймайте формулювання “sector exclusivity” як неподільну вимогу. З'ясуйте, який конкретний ризик Victor хоче усунути."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "test the assumption behind an exclusivity demand",
      "skill": "assumption-testing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'negotiation-choice',
    9,
    'choice',
    'Victor',
    $txt$Victor says he could limit exclusivity to three named direct competitors for twelve months. Which response demonstrates the strongest negotiation discipline?$txt$,
    $txt$Не винагороджуйте concession автоматично власною concession. Зберігайте conditionality.$txt$,
    $json$
    [
      {
        "id": "conditional",
        "text": "That's materially easier for us to consider. If we can agree that narrower exclusivity and a three-year commitment, I could take a revised price structure back internally, provided premium support remains a separate commercial item.",
        "value": "conditional"
      },
      {
        "id": "reward",
        "text": "That sounds fair. In that case, I think we can probably accept £420,000 and include premium support.",
        "value": "reward"
      },
      {
        "id": "reject",
        "text": "We don't offer exclusivity under any circumstances, so we'll need to remove it completely.",
        "value": "reject"
      }
    ]
    $json$::jsonb,
    '{"optionId":"conditional"}'::jsonb,
    'victor-deadline',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ви визнали його movement, але зберегли свою concession умовною.",
      "feedbackIncorrect": "Найсильніша відповідь визнає рух Victor, але не віддає нову поступку без package condition."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "maintain conditionality after the other side makes a concession",
      "skill": "conditional-concessions",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victor-deadline',
    10,
    'dialogue',
    'Victor',
    $txt$I need a number today. Another supplier is prepared to sign this week, and if I leave this room without commercial alignment, I'll recommend we move forward with them.$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-deadline',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'handle-deadline',
    11,
    'input',
    'Victor',
    $txt$Respond to the deadline without accusing Victor of bluffing. Test what must genuinely be agreed today and protect yourself from making an unnecessary concession under pressure.$txt$,
    $txt$Не кажіть “I don't believe you”. Separate real process constraint from pressure tactic. Визначте minimum alignment needed today.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand the timing matters, and I'm not asking you to leave without progress. Before I change the economics simply because of the deadline, can we be precise about what you need today? If we can align on the commercial framework and the remaining points are implementation details, I may be able to give you enough certainty to keep the process moving.",
        "I don't want timing to become the reason either side accepts terms it can't support. If a decision is genuinely required today, let's identify the minimum points that need agreement now and separate those from issues we can document afterwards."
      ]
    }
    $json$::jsonb,
    'victor-batna',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не назвали deadline bluff, але й не дозволили pressure автоматично визначити economics.",
      "feedbackIncorrect": "Не сперечайтеся про правдивість дедлайну. З'ясуйте, яке рішення реально потрібне сьогодні."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "manage deadline pressure without reacting impulsively",
      "skill": "pressure-management",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'victor-batna',
    12,
    'dialogue',
    'Victor',
    $txt$Then here's the minimum. Three years. £430,000 annually. Twelve months of exclusivity against the three competitors we identified. Premium support included. If you can't do that, I think we both know where this ends.$txt$,
    null,
    '[]'::jsonb,
    null,
    'protect-batna',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'protect-batna',
    13,
    'input',
    'Victor',
    $txt$You have another credible prospect, so you do not need this deal at any price. Reframe the remaining gap and make a disciplined final trade without threatening to walk away.$txt$,
    $txt$Використовуйте BATNA як внутрішню дисципліну, не як погрозу. Знайдіть останній trade: support, price або scope.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We're close, but premium support is the part that makes that package difficult at £430,000. I don't want to undermine the deal over one variable. If £430,000, the three-year term and the defined twelve-month exclusivity are fixed, I could support that package with standard support and offer premium coverage at a reduced add-on. Alternatively, if premium support must be included, we'd need some movement on the annual price.",
        "I think the gap is now narrower than it sounds. The term and limited exclusivity are workable. The remaining issue is the cost of premium support. We can either keep £430,000 with standard support and preferential pricing on the premium tier, or include premium support if the annual fee moves accordingly."
      ]
    }
    $json$::jsonb,
    'final-agreement',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна фінальна позиція. BATNA дала вам discipline, але ви не перетворили її на threat.",
      "feedbackIncorrect": "Не погоджуйтеся на весь пакет через страх втратити угоду і не погрожуйте альтернативою. Ізолюйте останню unresolved variable та запропонуйте trade."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "use BATNA as negotiation discipline and isolate the final gap",
      "skill": "batna-and-leverage",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-agreement',
    14,
    'input',
    'Victor',
    $txt$Victor agrees in principle to £430,000 per year for three years, twelve months of exclusivity limited to the three named competitors, standard support included, and premium support as a separately priced add-on at a preferential rate. Close the negotiation precisely without implying that unsigned details are already final.$txt$,
    $txt$Синтезуйте package. Зафіксуйте conditional agreement, unresolved documentation і next step. Не кажіть просто “deal”.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Then I think we have commercial alignment in principle: £430,000 annually for a three-year term, twelve months of exclusivity limited to the three named competitors, standard support included, and premium support available as a separately priced add-on at the preferential rate we discussed. Subject to both sides confirming the wording and implementation terms, I'll have that reflected in a revised proposal today.",
        "That gives us a basis to proceed. To be precise, we're aligned in principle on the three-year term, £430,000 annual fee, narrowly defined twelve-month exclusivity and standard support, with premium support priced separately on preferential terms. I'll document those points, and the agreement remains subject to final contractual and implementation details."
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
      "feedbackCorrect": "Відмінне C1-закриття: package чітко синтезований, а agreement in principle не переплутаний із фінально підписаним контрактом.",
      "feedbackIncorrect": "Не завершуйте лише “we have a deal”. Повторіть ключові terms, позначте agreement in principle та зафіксуйте наступний крок."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-leading-negotiation-victor",
      "role": "Procurement Director",
      "goal": "close with a precise conditional summary of the negotiated package",
      "skill": "negotiation-synthesis",
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
    $txt$Переговори завершено. Ви працювали не лише з ціною, а з усією структурою угоди: interests, term, support, exclusivity, deadline pressure, leverage та conditional concessions.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "underlying interest",
        "conditional concession",
        "trade-off",
        "package deal",
        "BATNA",
        "commercial alignment",
        "exclusivity",
        "agreement in principle"
      ]
    }
    $json$::jsonb
  );

end $$;