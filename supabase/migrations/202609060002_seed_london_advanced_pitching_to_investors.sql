-- =========================================================
-- TalkHero Campaign #5
-- C1: London Advanced
-- Mission #2: Pitching to Investors
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
    'pitching-to-investors',
    'Pitching to Investors',
    'Представте бізнес-ідею венчурному інвестору: сформулюйте investment case, відокремлюйте факти від припущень, захищайте ринкову логіку, визнавайте ризики та перебудовуйте аргумент під тиском.',
    'conversation',
    'C1',
    1,
    22,
    270,
    105,
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
        "subtitle": "Переконайте інвестора у сильному business case",
        "objectives": [
          "будувати чіткий і структурований investment case",
          "відрізняти твердження від доказів і припущень",
          "обґрунтовувати ринкову можливість без перебільшень",
          "пояснювати конкурентну перевагу",
          "визнавати слабкі місця бізнес-моделі",
          "відповідати на складні заперечення інвестора",
          "переформульовувати аргумент після критики",
          "синтезувати ризики й потенціал у переконливу фінальну позицію"
        ]
      },
      "location": "london-investment-office"
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
    'The Investment Pitch',
    'Представте бізнес Marcus, Venture Capital Partner, і захистіть investment case під критичними запитаннями.',
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
    'arrival',
    0,
    'narration',
    null,
    $txt$Ви прийшли до лондонського венчурного фонду, щоб представити новий цифровий продукт для малого бізнесу. За столом навпроти — Marcus, Venture Capital Partner. Він уже прочитав короткий deck і не хоче повторення слайдів. Його цікавить, чи витримує ваш investment case критичну перевірку.$txt$,
    null,
    '[]'::jsonb,
    null,
    'marcus-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Investment Office",
      "emotion": "focused"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-opening',
    1,
    'dialogue',
    'Marcus',
    $txt$I've read the deck, so don't walk me through the slides. In two minutes, tell me what the business is, whose problem you're solving, and why this could become a meaningful company rather than simply a useful product.$txt$,
    null,
    '[]'::jsonb,
    null,
    'opening-pitch',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'opening-pitch',
    2,
    'input',
    'Marcus',
    $txt$Deliver a concise investment pitch. Define the customer problem, your solution and why the opportunity could support a significant business.$txt$,
    $txt$Не описуйте лише функції продукту. Побудуйте логіку: проблема → рішення → цінність → чому це може стати масштабним бізнесом.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We help small service businesses reduce the administrative work involved in managing enquiries, scheduling and customer follow-up. Today many of them rely on disconnected tools and manual processes, which means lost leads and wasted staff time. Our platform brings those workflows into one system and automates the repetitive parts. The opportunity is attractive because the problem is widespread, recurring and directly connected to revenue, which gives us the potential to build a durable subscription business rather than a one-off productivity tool.",
        "The business addresses a structural problem for small companies: customer operations are often fragmented across email, spreadsheets and several specialist tools. We provide a single workflow layer that reduces that fragmentation. What makes the opportunity meaningful is not simply the size of the SME market but the fact that the pain is frequent, measurable and tied to activities customers already pay to manage."
      ]
    }
    $json$::jsonb,
    'marcus-market',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний початок: ви представили не лише продукт, а логіку того, чому з проблеми може вирости значний бізнес.",
      "feedbackIncorrect": "Не зупиняйтеся на описі продукту. Інвестору потрібен зв’язок між проблемою, цінністю для клієнта та потенціалом бізнесу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "present a concise and logically structured investment thesis",
      "skill": "structured-argumentation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-market',
    3,
    'dialogue',
    'Marcus',
    $txt$You're telling me the problem is widespread. That's plausible, but widespread doesn't automatically mean commercially attractive. What evidence do you have that customers care enough to change their behaviour and pay?$txt$,
    null,
    '[]'::jsonb,
    null,
    'defend-market',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'defend-market',
    4,
    'input',
    'Marcus',
    $txt$Defend the market opportunity with evidence. Explain what the evidence proves and what it does not yet prove.$txt$,
    $txt$На C1 важлива межа доказу. Наведіть evidence, але не робіть із нього ширших висновків, ніж воно дозволяє.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Our strongest evidence is behavioural rather than survey-based. In the pilot, fourteen of eighteen businesses continued using the product after the free period, and eleven converted to paid plans. That suggests the problem is painful enough for at least some customers to change existing workflows and pay. I wouldn't claim that this proves demand across the whole market, because the sample is still small and self-selecting. What it gives us is evidence of willingness to adopt and pay within a defined customer segment.",
        "We have early evidence from customer behaviour: users who integrated the product into daily operations showed high weekly retention, and several replaced two existing tools with ours. I see that as evidence that the product can become operationally important. It does not yet prove that acquisition will scale efficiently or that the same behaviour will hold across every SME segment."
      ]
    }
    $json$::jsonb,
    'marcus-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви використали evidence і водночас чітко окреслили межі того, що воно дозволяє стверджувати.",
      "feedbackIncorrect": "Наведіть конкретний доказ і відокремте його від висновку. Поясніть не лише що показують дані, а й чого вони поки не доводять."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "support a market claim with evidence while acknowledging evidential limits",
      "skill": "evidence-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-evidence',
    5,
    'dialogue',
    'Marcus',
    $txt$Fine. But I hear founders blur evidence and assumption all the time. Tell me explicitly: what do you know at this stage, and what are you still assuming?$txt$,
    null,
    '[]'::jsonb,
    null,
    'evidence-vs-assumption',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evidence-vs-assumption',
    6,
    'input',
    'Marcus',
    $txt$Separate the strongest facts from the assumptions in your business case. Explain which assumption is currently most important to test.$txt$,
    $txt$Структура: що ми знаємо → що припускаємо → яке припущення є критичним → як його перевірити.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "What we know is that a defined group of small service businesses uses the product repeatedly and that some of them are willing to pay. We also know which workflows create the most value for those customers. What we're still assuming is that we can acquire similar customers at a cost that supports the economics of the model and that retention will remain strong as we move beyond early adopters. The most important assumption to test now is scalable acquisition, because strong retention is not enough if reaching each customer is too expensive.",
        "The evidence supports product usefulness and early willingness to pay. It does not yet support our assumption that the same proposition will work efficiently across multiple customer segments. I would prioritise testing whether one narrow segment can be acquired repeatedly through a predictable channel before treating broader market size as actionable."
      ]
    }
    $json$::jsonb,
    'marcus-competition',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви чітко розділили знання й припущення та визначили, яке припущення має найбільше значення.",
      "feedbackIncorrect": "Не називайте всі твердження фактами. Відокремте підтверджене evidence від припущень і поясніть, яке з них може найбільше змінити investment case."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "distinguish facts from assumptions and prioritise the most consequential uncertainty",
      "skill": "critical-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-competition',
    7,
    'dialogue',
    'Marcus',
    $txt$Let's assume customers do want it. What's to stop a larger software company from adding the same features to a product they already sell? You're describing value. You haven't yet described a defensible business.$txt$,
    null,
    '[]'::jsonb,
    null,
    'competitive-advantage',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'competitive-advantage',
    8,
    'input',
    'Marcus',
    $txt$Explain why the business could remain competitive even if larger companies copy some product features. Avoid claiming that features alone are a moat.$txt$,
    $txt$Не кажіть просто “our technology is better”. Розрізняйте features і defensibility: workflow depth, data, distribution, switching costs, customer understanding або інші системні переваги.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I don't think individual features are defensible, and I'd assume competitors can copy most of them. The stronger case is that we're becoming embedded in a specific operational workflow. As customers connect their history, templates and processes to the platform, switching becomes more disruptive. Over time, the data generated by those workflows can also improve automation in ways that are specific to that customer segment. So I would describe our advantage as workflow depth and accumulated customer context rather than feature exclusivity.",
        "A larger company could reproduce much of the interface. Our potential defensibility comes from focus: we're designing around the operating model of one customer segment, integrating deeply into their daily processes and learning faster from that concentrated usage. That is not an automatic moat, but it gives us a path towards switching costs and differentiated data rather than relying on features staying unique."
      ]
    }
    $json$::jsonb,
    'investor-objection',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не назвали features захистом самі по собі, а показали можливий системний шлях до defensibility.",
      "feedbackIncorrect": "Не плутайте хороший продукт із захищеним бізнесом. Поясніть, яка перевага може посилюватися з часом навіть тоді, коли конкуренти копіюють окремі функції."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "distinguish product differentiation from sustainable business defensibility",
      "skill": "strategic-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'investor-objection',
    9,
    'choice',
    'Marcus',
    $txt$Marcus says: "Your early customer numbers are growing quickly, so you're presenting that as evidence the business will scale." Which response is the strongest?$txt$,
    $txt$Оберіть відповідь, яка не плутає correlation із доказом scalability.$txt$,
    $json$
    [
      {
        "id": "qualified",
        "text": "I wouldn't treat early growth as proof of scalability. It shows that demand may be increasing under our current conditions. Scalability depends on whether acquisition, retention and unit economics remain attractive as volume grows, and we still need evidence on those points.",
        "value": "qualified"
      },
      {
        "id": "confident",
        "text": "The growth proves that the market wants the product, so scaling should mainly be a matter of spending more on acquisition.",
        "value": "confident"
      },
      {
        "id": "dismissive",
        "text": "It's too early to discuss scalability, so I don't think the question is relevant yet.",
        "value": "dismissive"
      }
    ]
    $json$::jsonb,
    '{"optionId":"qualified"}'::jsonb,
    'marcus-risk',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Early growth є сигналом, але не доказом того, що economics і acquisition масштабуватимуться.",
      "feedbackIncorrect": "Не робіть причинного або масштабного висновку з обмеженого early-stage сигналу. Уточніть, що ще має бути доведено."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "avoid overinterpreting early growth as proof of scalability",
      "skill": "critical-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-risk',
    10,
    'dialogue',
    'Marcus',
    $txt$Good. Now give me the argument against your own company. If I decide not to invest, what is the strongest reason I could be right?$txt$,
    null,
    '[]'::jsonb,
    null,
    'address-risk',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'address-risk',
    11,
    'input',
    'Marcus',
    $txt$Identify the strongest argument against investing in your company. Explain why the risk is real, what would make it worse, and how you would test or reduce it.$txt$,
    $txt$Не називайте косметичний ризик. Дайте аргумент, який справді міг би зруйнувати investment thesis.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The strongest argument against investing is that we may have a product customers like without having an efficient distribution model. If acquisition remains heavily dependent on founder-led sales or expensive paid channels, the economics may prevent the company from scaling even with good retention. That risk becomes worse if different customer segments require different sales motions. I would test it by narrowing the target segment and trying to reproduce acquisition through one or two channels with clear payback thresholds before expanding.",
        "A serious risk is that the workflow is valuable but not valuable enough to become a system customers treat as essential. If usage remains concentrated in a few features, larger platforms could absorb those features and reduce our differentiation. We need to test depth of adoption: how many workflows move onto the platform, whether usage expands over time and whether customers become less willing to switch."
      ]
    }
    $json$::jsonb,
    'marcus-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна C1-відповідь: ви сформулювали ризик, який реально може зламати investment thesis, і показали, як його перевіряти.",
      "feedbackIncorrect": "Назвіть не загальну проблему, а ризик, через який інвестиція може виявитися помилкою. Поясніть механізм ризику та спосіб його перевірки."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "steelman the strongest risk to the investment thesis and propose a way to test it",
      "skill": "critical-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'marcus-challenge',
    12,
    'dialogue',
    'Marcus',
    $txt$Let me make the sceptical case for you. Your evidence is limited, your distribution model isn't proven, competitors can copy parts of the product, and even you admit the moat is still developing. Why shouldn't I conclude that you're simply too early for institutional capital?$txt$,
    null,
    '[]'::jsonb,
    null,
    'reframe-case',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-case',
    13,
    'input',
    'Marcus',
    $txt$Respond to Marcus's sceptical case. Do not deny the weaknesses. Reframe why the remaining uncertainty can still make this an investable opportunity.$txt$,
    $txt$Ключова C1-вправа: визнайте слабкі місця, але поясніть, чому uncertainty не дорівнює відсутності investment case.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think the conclusion would be reasonable if we were asking you to underwrite a proven scaling model. We're not. The investment case is that several of the highest-risk questions have moved from pure hypothesis to early evidence: customers are adopting, some are paying and usage suggests the workflow matters. The remaining uncertainties are distribution and defensibility, but those are precisely the areas the next stage of capital would allow us to test. I wouldn't argue that the company is de-risked. I'd argue that the evidence is strong enough that the unresolved risks are now specific, testable and potentially worth taking.",
        "I agree that the company is early, and I wouldn't present the current data as proof that the model scales. The question is whether the uncertainty is still too broad to price intelligently. I think it has narrowed. We know more about customer behaviour and value, while the major remaining risks are identifiable. That creates an investment case if you believe the upside from resolving those risks is materially larger than the capital required to test them."
      ]
    }
    $json$::jsonb,
    'final-investment-case',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви не заперечили слабкі місця, а перетворили їх на точну дискусію про рівень і природу investment risk.",
      "feedbackIncorrect": "Не відповідайте на скепсис простим оптимізмом. Визнайте, що ще не доведено, і поясніть, чому саме теперішній рівень evidence все одно може виправдовувати інвестиційний ризик."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "reframe acknowledged weaknesses into a disciplined risk-adjusted investment argument",
      "skill": "reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-investment-case',
    14,
    'input',
    'Marcus',
    $txt$Marcus concludes: "Give me the investment case in its strongest form. Why should I invest now, knowing what we have established about the evidence, the competition and the risks?"$txt$,
    $txt$Фінал. Побудуйте одну цілісну тезу: opportunity + evidence + defensibility path + ключовий ризик + чому співвідношення upside/risk все одно привабливе.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The case for investing now is that we have moved beyond a purely conceptual opportunity without pretending the business is already proven. We have evidence that a defined customer segment experiences the problem strongly enough to adopt the product, change workflows and pay. The product itself is not the moat, but deeper workflow integration gives us a credible path towards switching costs and differentiated customer context. The main unresolved risk is whether we can acquire those customers repeatedly at attractive economics. That is significant, but it is specific and testable. The upside is that if we prove distribution while maintaining the behaviour we're already seeing, we have the foundations of a scalable recurring-revenue business. I think that asymmetry — meaningful evidence on customer value, identifiable remaining risks and a large outcome if those risks are resolved — is why the company is investable at this stage.",
        "I would invest now not because uncertainty has disappeared but because it has become more informative. We have early behavioural evidence of customer value and willingness to pay, a plausible route towards defensibility through workflow depth, and a clear understanding of the biggest unresolved question: scalable distribution. The capital would be used to test that question rather than simply accelerate an unproven model. If the test succeeds, the potential market and recurring economics create substantial upside; if it fails, we should learn that before committing much more capital."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний фінальний investment case: ви синтезували evidence, assumptions, competition і risk без перебільшення впевненості.",
      "feedbackIncorrect": "Не завершуйте загальною обіцянкою росту. Синтезуйте докази, шлях до defensibility, ключову невизначеність і поясніть, чому upside виправдовує ризик саме зараз."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-pitching-to-investors-marcus",
      "role": "Venture Capital Partner",
      "goal": "synthesise evidence, defensibility, uncertainty and upside into a persuasive investment case",
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
    $txt$Pitch завершено. Ви захистили investment case, відокремлюючи evidence від assumptions, аналізуючи defensibility, визнаючи критичні ризики та перебудовуючи аргумент після скептичних заперечень інвестора.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "investment thesis",
        "willingness to pay",
        "defensibility",
        "switching costs",
        "unit economics",
        "scalable acquisition",
        "to qualify a claim",
        "risk-adjusted"
      ]
    }
    $json$::jsonb
  );

end $$;