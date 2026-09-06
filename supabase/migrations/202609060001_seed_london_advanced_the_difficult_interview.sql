-- =========================================================
-- TalkHero Campaign #5
-- C1: London Advanced
-- Mission #1: The Difficult Interview
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  -- =======================================================
  -- Campaign
  -- =======================================================

  insert into public.quest_campaigns (
    slug,
    title,
    description,
    cefr_level,
    status,
    order_index,
    metadata
  ) values (
    'london-advanced',
    'London Advanced',
    'Розвивайте англійську рівня C1 у складних професійних і суспільних ситуаціях: аргументуйте, переконуйте, реагуйте на критику, працюйте з нюансами та захищайте позицію під тиском.',
    'C1',
    'published',
    4,
    $json$
    {
      "adventure": {
        "location": "London, United Kingdom",
        "subtitle": "Думай глибше. Говори точно. Переконуй англійською."
      }
    }
    $json$::jsonb
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    cefr_level = excluded.cefr_level,
    status = excluded.status,
    order_index = excluded.order_index,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into campaign_uuid;


  -- =======================================================
  -- Episode
  -- =======================================================

  insert into public.quest_episodes (
    campaign_id,
    slug,
    title,
    description,
    order_index,
    status,
    metadata
  ) values (
    campaign_uuid,
    'advanced-life',
    'Advanced Life',
    'Вирішуйте складні ситуації, у яких важливі не лише правильні слова, а точність думки, нюанс, дипломатія, аргументація та здатність адаптувати позицію.',
    0,
    'published',
    $json$
    {
      "adventure": {
        "subtitle": "Складні рішення та переконлива комунікація в Лондоні"
      }
    }
    $json$::jsonb
  )
  on conflict (campaign_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into episode_uuid;


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
    'the-difficult-interview',
    'The Difficult Interview',
    'Пройдіть складну співбесіду на senior-позицію: аргументуйте свою цінність, аналізуйте власні рішення, реагуйте на незручні запитання та коригуйте позицію під тиском, не втрачаючи переконливості.',
    'conversation',
    'C1',
    0,
    22,
    260,
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
        "campaignSlug": "london-advanced",
        "subtitle": "Складна співбесіда на senior-позицію",
        "objectives": [
          "формулювати точні й переконливі професійні аргументи",
          "підкріплювати твердження релевантними доказами",
          "аналізувати власні помилки без самодискредитації",
          "відповідати на критичні припущення співрозмовника",
          "дипломатично не погоджуватися з інтерв’юером",
          "визнавати справедливу критику та уточнювати позицію",
          "використовувати nuance і hedging",
          "синтезувати аргументи у переконливу фінальну відповідь"
        ]
      },
      "location": "london-executive-office"
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
    'The Difficult Interview',
    'Пройдіть складну senior-level співбесіду з Evelyn, Senior Hiring Director.',
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
    $txt$Ви дійшли до фінального етапу відбору на senior-позицію в міжнародній компанії. Перед вами не стандартна співбесіда: Evelyn, Senior Hiring Director, перевірятиме не лише ваш досвід, а й те, наскільки точно ви мислите, аргументуєте та реагуєте, коли ваші твердження ставлять під сумнів.$txt$,
    null,
    '[]'::jsonb,
    null,
    'evelyn-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Executive Office",
      "emotion": "focused"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evelyn-opening',
    1,
    'dialogue',
    'Evelyn',
    $txt$You've made it through several stages, so I already know that you're technically capable. What I'm interested in today is how you think. Let's start with something simple: what do you believe distinguishes you from other strong candidates for this role?$txt$,
    null,
    '[]'::jsonb,
    null,
    'define-value',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'define-value',
    2,
    'input',
    'Evelyn',
    $txt$Explain what distinguishes you from other strong candidates. Make a precise claim and support it rather than relying on generic strengths.$txt$,
    $txt$Не перелічуйте прикметники на кшталт “hard-working” або “motivated”. Сформулюйте конкретну професійну відмінність і поясніть, чому вона має значення.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "What distinguishes me is my ability to connect strategic objectives with execution. I don't simply identify what should change; I've repeatedly been responsible for turning those decisions into workable processes and measurable outcomes.",
        "I would hesitate to claim that one quality makes me uniquely qualified, but a consistent strength has been my ability to make sound decisions when information is incomplete and then bring different stakeholders behind those decisions."
      ]
    }
    $json$::jsonb,
    'evelyn-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна C1-відповідь: ви сформулювали конкретну відмінність і пояснили її професійну цінність.",
      "feedbackIncorrect": "На C1 недостатньо назвати загальну сильну сторону. Сформулюйте точне твердження, поясніть його значення та уникайте порожніх характеристик."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "make a precise professional claim and explain its relevance",
      "skill": "precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evelyn-evidence',
    3,
    'dialogue',
    'Evelyn',
    $txt$That's a convincing description of yourself, but candidates are usually very good at describing themselves. Give me an example that would actually allow me to test that claim.$txt$,
    null,
    '[]'::jsonb,
    null,
    'prove-value',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'prove-value',
    4,
    'input',
    'Evelyn',
    $txt$Provide evidence for your previous claim. Explain the situation, your judgement or action, and the resulting impact.$txt$,
    $txt$Дайте один сильний приклад. Важливий не список досягнень, а зв’язок: твердження → доказ → результат → чому це підтверджує вашу позицію.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "A good example was a project that had stalled because three departments were working towards slightly different objectives. I reframed the discussion around the business outcome, established a shared decision process and reduced the scope. We ultimately delivered six weeks later, but the revised product achieved the target adoption rate within its first quarter. That experience reflects what I mean by connecting strategy with execution.",
        "In my previous role, I had to recommend a launch decision before all the data was available. I separated what we knew from what we were assuming, identified the risks that were reversible and proposed a limited release. That allowed us to learn without exposing the entire customer base, and the evidence from that release shaped the final decision."
      ]
    }
    $json$::jsonb,
    'evelyn-failure',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Переконливо. Ви не просто навели приклад, а використали його як доказ попереднього твердження.",
      "feedbackIncorrect": "Потрібен доказ, а не ще одна характеристика. Покажіть ситуацію, ваше рішення або дію, результат і зв’язок із попереднім твердженням."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "substantiate a professional claim with relevant evidence and impact",
      "skill": "evidence",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evelyn-failure',
    5,
    'dialogue',
    'Evelyn',
    $txt$Let's turn that around. Tell me about a significant professional decision you got wrong. I'm less interested in the mistake itself than in whether your interpretation of it changed afterwards.$txt$,
    null,
    '[]'::jsonb,
    null,
    'analyse-failure',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'analyse-failure',
    6,
    'input',
    'Evelyn',
    $txt$Describe a significant mistake or failed decision. Take responsibility, explain what your original reasoning missed, and show how your thinking changed.$txt$,
    $txt$Не маскуйте сильну сторону під слабкість. Покажіть справжню помилку, але аналізуйте її зріло: рішення → помилкове припущення → наслідок → зміна підходу.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I once pushed a team to keep a launch date because I assumed the remaining issues were primarily execution problems. In retrospect, I underestimated what the engineers were telling me about structural risk. We launched, then had to withdraw part of the release. The mistake wasn't simply being optimistic; it was treating disagreement as a delivery problem rather than evidence that my assumptions needed testing. Since then, I deliberately separate schedule pressure from technical confidence when making similar decisions.",
        "Earlier in my career, I delayed escalating a client issue because I believed I could resolve it without creating unnecessary concern. That judgement was wrong. By the time I escalated, senior stakeholders had less room to respond. It changed my view of escalation: I now see it as a way of creating options early rather than as an admission that a problem is out of control."
      ]
    }
    $json$::jsonb,
    'evelyn-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний самоаналіз: ви взяли відповідальність і показали, як змінилася сама логіка ваших рішень.",
      "feedbackIncorrect": "Не обмежуйтеся описом помилки. Поясніть, яке припущення було хибним, яку відповідальність ви несете і як після цього змінився ваш підхід."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "critically evaluate a past failure and demonstrate changed judgement",
      "skill": "critical-evaluation",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evelyn-challenge',
    7,
    'dialogue',
    'Evelyn',
    $txt$I'm going to challenge that interpretation. It sounds as though you're presenting the mistake as a failure of process. Isn't it possible that the simpler explanation is that your judgement just wasn't good enough at the time?$txt$,
    null,
    '[]'::jsonb,
    null,
    'respond-to-challenge',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'respond-to-challenge',
    8,
    'input',
    'Evelyn',
    $txt$Respond to Evelyn's criticism. Acknowledge what is fair in it, but distinguish between accepting responsibility and accepting an oversimplified interpretation.$txt$,
    $txt$Не захищайтеся автоматично. Визнайте справедливу частину критики, а потім уточніть свою позицію. Використовуйте nuance і hedging.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think that's partly fair. My judgement wasn't good enough in that situation, and I don't want to explain that away as a process failure. Where I'd qualify it is that judgement depends on how you interpret the information available to you. My mistake was not merely choosing the wrong option; it was giving too little weight to evidence that contradicted my preferred plan.",
        "That's a reasonable challenge, and I would accept that the final judgement was mine and it was wrong. I would distinguish, though, between saying I lacked judgement generally and identifying why that particular judgement failed. Understanding the mechanism matters because that's what allowed me to change how I make comparable decisions."
      ]
    }
    $json$::jsonb,
    'disagreement-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме C1-рівень: ви прийняли справедливу частину критики, але не дозволили їй спростити вашу позицію.",
      "feedbackIncorrect": "Уникайте двох крайнощів: повної оборони та повної капітуляції. Визнайте те, що справедливо, а потім точно окресліть, у чому ваша позиція складніша."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "acknowledge valid criticism while refining an oversimplified interpretation",
      "skill": "nuance",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'disagreement-choice',
    9,
    'choice',
    'Evelyn',
    $txt$Evelyn makes an assumption about your leadership style that you believe is only partly justified. Which response shows the strongest C1-level disagreement?$txt$,
    $txt$Оберіть відповідь, яка визнає перспективу співрозмовника, але точно коригує припущення.$txt$,
    $json$
    [
      {
        "id": "nuanced",
        "text": "I can see why you might draw that conclusion from the example, although I'd be cautious about generalising from it. The issue wasn't that I avoid dissent; it was that in that particular case I didn't give dissent enough weight.",
        "value": "nuanced"
      },
      {
        "id": "defensive",
        "text": "No, that's completely wrong. I'm actually a very good leader and my team would agree.",
        "value": "defensive"
      },
      {
        "id": "passive",
        "text": "Yes, perhaps you're right. I suppose that's just my leadership style.",
        "value": "passive"
      }
    ]
    $json$::jsonb,
    '{"optionId":"nuanced"}'::jsonb,
    'evelyn-ambiguity',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Так. Ви не відкинули перспективу Evelyn, але обмежили надто широке узагальнення точною аргументацією.",
      "feedbackIncorrect": "На C1 сильна незгода не повинна бути ні агресивною, ні пасивною. Визнайте логіку співрозмовника й точно покажіть межі його висновку."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "disagree diplomatically while challenging an overgeneralisation",
      "skill": "register-awareness",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evelyn-ambiguity',
    10,
    'dialogue',
    'Evelyn',
    $txt$Senior roles often involve decisions where every option has a downside. Imagine you have incomplete evidence, two credible teams recommending different approaches, and delaying the decision also carries a cost. How would you decide?$txt$,
    null,
    '[]'::jsonb,
    null,
    'reason-under-uncertainty',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reason-under-uncertainty',
    11,
    'input',
    'Evelyn',
    $txt$Explain how you would make a consequential decision under uncertainty when credible people disagree.$txt$,
    $txt$Не шукайте магічно правильну відповідь. Покажіть процес мислення: що відомо, що невідомо, які ризики оборотні, що коштує зволікання і що змусило б вас змінити рішення.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd start by separating disagreement about facts from disagreement about priorities. I'd want to know what evidence both teams accept, where their assumptions diverge and which consequences would be hardest to reverse. If delay itself carries a meaningful cost, I wouldn't wait for certainty that may never arrive. I'd make the most reversible decision that still moves us forward, define what evidence we're expecting to learn from it and be explicit about the conditions under which we'd change course.",
        "I wouldn't try to eliminate uncertainty before deciding. I'd establish which risks are asymmetric, what we can test cheaply and what becomes more expensive if we wait. I would also ask each team what evidence would change its recommendation. That often reveals whether the disagreement is genuinely about evidence or about different tolerances for risk."
      ]
    }
    $json$::jsonb,
    'evelyn-final-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Дуже добре. Ви продемонстрували структуроване мислення в умовах невизначеності, а не удавану впевненість.",
      "feedbackIncorrect": "На C1 потрібна логіка рішення, а не фраза «я зберу більше інформації». Розділіть факти й припущення, оцініть оборотність ризиків, ціну зволікання та умови зміни рішення."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "reason explicitly under uncertainty and competing expert views",
      "skill": "hypothetical-reasoning",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evelyn-final-challenge',
    12,
    'dialogue',
    'Evelyn',
    $txt$You've argued that one of your strengths is judgement under uncertainty. Yet you've also told me about a case where your judgement failed precisely because you misread uncertainty. Why should I see those two claims as consistent rather than contradictory?$txt$,
    null,
    '[]'::jsonb,
    null,
    'reconcile-argument',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reconcile-argument',
    13,
    'input',
    'Evelyn',
    $txt$Reconcile the apparent contradiction in your argument. Do not deny the failure. Show how the evidence changes or qualifies your original claim.$txt$,
    $txt$Це ключова C1-вправа. Не повторюйте початкову тезу. Уточніть її у світлі контрприкладу: що ви все ще стверджуєте, що вже не стверджуєте і чому.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think they would be contradictory if I were claiming that good judgement means consistently making the right call. That's not the claim I'd make. The failure matters because it exposed a weakness in how I was handling contradictory evidence. What I consider a strength now is not certainty but a more disciplined way of making decisions when certainty is unavailable. So I would qualify my original claim: the strength is partly the result of having had that judgement tested and corrected.",
        "The example does weaken an overly broad version of my claim, and I think it's important to acknowledge that. I wouldn't say I've always demonstrated strong judgement under uncertainty. What I can defend is that I learned from a consequential failure and subsequently developed a more explicit method for testing assumptions, weighing dissent and keeping decisions reversible where possible."
      ]
    }
    $json$::jsonb,
    'final-case',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви не уникнули контрприкладу, а використали його, щоб зробити власну тезу точнішою й сильнішою.",
      "feedbackIncorrect": "Не заперечуйте суперечність механічно. Дозвольте контрприкладу змінити початкову тезу: уточніть її межі й покажіть, яку версію аргументу ви тепер можете захистити."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "revise and strengthen a claim in response to contradictory evidence",
      "skill": "synthesis",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-case',
    14,
    'input',
    'Evelyn',
    $txt$Evelyn concludes: "Given everything we've discussed, make the strongest case you can for why I should recommend you for this senior role." Give a concise final argument that reflects the discussion rather than simply repeating your opening answer.$txt$,
    $txt$Фінал. Синтезуйте розмову: ваша цінність + доказ + усвідомлення обмежень + те, як ви працюєте зі складністю. Не перераховуйте попередні відповіді — побудуйте одну цілісну позицію.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think the strongest case is not that I always make the right decision, but that I can take responsibility for difficult decisions and improve the quality of how they're made. I've shown that I can turn strategic ambiguity into action, but I've also learned the cost of becoming too attached to an initial interpretation. That combination has made me more deliberate about evidence, dissent and reversible choices. For a senior role, I believe that matters because the responsibility isn't simply to sound confident; it's to make defensible decisions, bring people with you and adapt when the evidence changes.",
        "I would recommend me for the role because I combine execution with a willingness to have my reasoning challenged. My experience gives me evidence that I can deliver, while my failures have made me more rigorous about uncertainty and opposing views. I don't see seniority as having all the answers. I see it as being able to make a clear decision, explain the reasoning behind it, remain accountable for the outcome and revise the decision when the evidence justifies doing so."
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
      "feedbackCorrect": "Сильний фінал C1: ви синтезували аргументи, врахували контраргументи й сформували точну, зрілу професійну позицію.",
      "feedbackIncorrect": "Не повторюйте список сильних сторін. Побудуйте один цілісний аргумент, який враховує докази, критику, власні обмеження та те, чому все це робить вас сильним senior-кандидатом."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-difficult-interview-evelyn",
      "role": "Senior Hiring Director",
      "goal": "synthesise evidence, counterarguments and self-evaluation into a persuasive final case",
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
    $txt$Співбесіду завершено. Ви пройшли C1-level розмову, у якій довелося не лише аргументувати власну позицію, а й уточнювати її під тиском, визнавати справедливу критику та синтезувати суперечливі факти.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "to qualify a claim",
        "to draw a conclusion",
        "to challenge an assumption",
        "to acknowledge criticism",
        "reversible decision",
        "contradictory evidence",
        "to weigh dissent",
        "defensible decision"
      ]
    }
    $json$::jsonb
  );

end $$;