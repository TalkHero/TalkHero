-- =========================================================
-- TalkHero Campaign #4
-- B2: London Professional
-- Mission #2: Presenting an Idea
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
  where slug = 'london-professional';

  if campaign_uuid is null then
    raise exception 'Campaign london-professional not found';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'professional-life';

  if episode_uuid is null then
    raise exception 'Episode professional-life not found';
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
    'presenting-an-idea',
    'Presenting an Idea',
    'Представте нову ідею керівнику з маркетингу, обґрунтуйте її цінність, дайте відповіді на складні запитання та адаптуйте пропозицію після критики.',
    'conversation',
    'B2',
    1,
    18,
    190,
    75,
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
        "subtitle": "Презентація та захист ідеї",
        "objectives": [
          "структуровано представити професійну ідею",
          "чітко сформулювати проблему",
          "пояснити цінність запропонованого рішення",
          "підкріпити позицію доказами",
          "відповісти на скептичне запитання",
          "визнати ризики та запропонувати спосіб їх зменшити",
          "адаптувати пропозицію після критики",
          "завершити презентацію переконливим підсумком"
        ]
      },
      "location": "london-marketing-office"
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
    'The Pitch',
    'Представте та захистіть свою ідею перед Sophie, Marketing Director.',
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
    'briefing',
    0,
    'narration',
    null,
    $txt$Ваша команда шукає спосіб покращити взаємодію з клієнтами. У вас є ідея нового щомісячного онлайн-заходу, де клієнти зможуть побачити нові продукти, поставити запитання та поспілкуватися з експертами компанії. Сьогодні ви презентуєте цю ідею Sophie, Marketing Director.$txt$,
    null,
    '[]'::jsonb,
    null,
    'sophie-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Marketing Office",
      "emotion": "focused"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sophie-opening',
    1,
    'dialogue',
    'Sophie',
    $txt$Thanks for putting this together. We've got about fifteen minutes, so give me the headline first. What's the idea?$txt$,
    null,
    '[]'::jsonb,
    null,
    'headline-pitch',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "emotion": "professional"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'headline-pitch',
    2,
    'input',
    'Sophie',
    $txt$Give Sophie a concise overview of your idea and its main purpose.$txt$,
    $txt$Сформулюйте ідею у 2–3 реченнях. Поясніть, що ви пропонуєте і навіщо.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd like to introduce a monthly online event where clients can see new products and speak directly with our experts. The aim would be to strengthen engagement and give clients more reasons to stay connected with us.",
        "My proposal is to run a monthly online session for clients, combining product updates with live questions and expert advice. It could help us build stronger relationships with our audience."
      ]
    }
    $json$::jsonb,
    'problem-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний початок: ви коротко пояснили і саму ідею, і її мету.",
      "feedbackIncorrect": "Не описуйте лише формат. Скажіть, що саме ви пропонуєте і яку бізнес-мету це має вирішити."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "present a concise idea and explain its main purpose",
      "skill": "structured-speaking",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'problem-question',
    3,
    'dialogue',
    'Sophie',
    $txt$All right, but what problem are we actually solving? We already send newsletters and product updates to clients.$txt$,
    null,
    '[]'::jsonb,
    null,
    'define-problem',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'define-problem',
    4,
    'input',
    'Sophie',
    $txt$Explain what problem the idea solves and why the existing approach is not enough.$txt$,
    $txt$Порівняйте поточну ситуацію з тим, що може покращити ваша ідея. Дайте щонайменше дві пов’язані причини.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Newsletters are useful for sharing information, but the communication is mostly one-way. A live event would allow clients to ask questions and interact directly with us, which could create stronger engagement.",
        "Our current updates keep clients informed, but they don't create much interaction. The event would give clients direct access to experts and make the relationship more personal."
      ]
    }
    $json$::jsonb,
    'audience-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви показали різницю між поточним підходом і проблемою, яку має вирішити нова ідея.",
      "feedbackIncorrect": "Поясніть не лише перевагу нової ідеї, а й конкретний недолік поточного підходу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "define a business problem and explain why the current approach is insufficient",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'audience-question',
    5,
    'dialogue',
    'Sophie',
    $txt$Who exactly would this be for? "Our clients" is quite broad.$txt$,
    null,
    '[]'::jsonb,
    null,
    'target-audience',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "emotion": "evaluating"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'target-audience',
    6,
    'input',
    'Sophie',
    $txt$Define the primary target audience and explain why this group should be prioritised.$txt$,
    $txt$Не відповідайте «для всіх». Виберіть конкретний сегмент клієнтів і обґрунтуйте вибір.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd initially target existing clients who regularly use our products but don't engage much with our other content. They already know the brand, so the event could deepen the relationship and encourage greater involvement.",
        "I would focus first on active clients who have shown interest in new products. They're more likely to attend, provide useful feedback and become advocates for future launches."
      ]
    }
    $json$::jsonb,
    'value-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Переконливо. Ви визначили конкретну аудиторію і пояснили логіку пріоритету.",
      "feedbackIncorrect": "Звузьте аудиторію. Назвіть конкретний сегмент і поясніть, чому саме з нього варто почати."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "identify and justify a primary target audience",
      "skill": "strategic-reasoning",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'value-question',
    7,
    'dialogue',
    'Sophie',
    $txt$Let's assume people attend. What's the actual value for the business? Engagement sounds good, but it's difficult to justify a project on that alone.$txt$,
    null,
    '[]'::jsonb,
    null,
    'business-value',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'business-value',
    8,
    'input',
    'Sophie',
    $txt$Explain how the idea could create measurable value for the business.$txt$,
    $txt$Пов’яжіть активність клієнтів із конкретним бізнес-результатом. Назвіть щонайменше два можливі ефекти.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The events could improve client retention because customers would have more regular contact with us. They could also support sales by giving us an opportunity to demonstrate new products to an interested audience.",
        "We could use the sessions both to strengthen retention and to generate qualified interest in new products. They would also give us direct feedback that could improve future campaigns."
      ]
    }
    $json$::jsonb,
    'evidence-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна бізнес-аргументація: ви перевели абстрактну «залученість» у конкретні потенційні результати.",
      "feedbackIncorrect": "Не зупиняйтеся на engagement. Пов’яжіть ідею з такими результатами, як retention, sales, qualified leads, feedback або іншим вимірюваним ефектом."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "connect an idea to measurable business value",
      "skill": "supporting-detail",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'evidence-choice',
    9,
    'choice',
    'Sophie',
    $txt$Sophie asks how you would know whether the idea is actually working. Which answer is strongest?$txt$,
    $txt$Оберіть відповідь із найкращим способом перевірити результат.$txt$,
    $json$
    [
      {
        "id": "metrics",
        "text": "I'd track attendance, repeat participation, client feedback and any qualified sales opportunities generated after each event.",
        "value": "metrics"
      },
      {
        "id": "feeling",
        "text": "We'll probably know from whether people seem to enjoy it.",
        "value": "feeling"
      },
      {
        "id": "followers",
        "text": "We could just look at how many social media followers we have.",
        "value": "followers"
      }
    ]
    $json$::jsonb,
    '{"optionId":"metrics"}'::jsonb,
    'risk-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Сильна презентація передбачає критерії, за якими можна оцінити результат.",
      "feedbackIncorrect": "Потрібні показники, безпосередньо пов’язані з цілями проєкту."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "identify meaningful success metrics"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'risk-question',
    10,
    'dialogue',
    'Sophie',
    $txt$My concern is resources. A monthly event could take a lot of time to organise, and there's no guarantee enough clients would attend. How would you deal with that?$txt$,
    null,
    '[]'::jsonb,
    null,
    'risk-response',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'risk-response',
    11,
    'input',
    'Sophie',
    $txt$Acknowledge Sophie's concerns and propose a practical way to reduce both risks.$txt$,
    $txt$Не заперечуйте ризики. Покажіть, як можна перевірити ідею з меншими витратами часу та ресурсів.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Those are valid concerns. Rather than committing to a monthly programme immediately, we could run a small pilot first and invite a selected group of clients. That would let us measure interest and understand the workload before scaling it.",
        "I agree that we shouldn't commit significant resources without evidence. We could start with one pilot event, keep the format simple and use the results to decide whether a regular programme is justified."
      ]
    }
    $json$::jsonb,
    'sophie-pushback',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви не відкинули ризики, а запропонували спосіб перевірити припущення з обмеженими ресурсами.",
      "feedbackIncorrect": "Визнайте обидва ризики й запропонуйте практичний спосіб протестувати ідею до повного запуску."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "acknowledge risks and propose a practical mitigation strategy",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'sophie-pushback',
    12,
    'dialogue',
    'Sophie',
    $txt$A pilot makes more sense. But I'd still want the first version to be much more focused than your original proposal. What would you change?$txt$,
    null,
    '[]'::jsonb,
    null,
    'adapt-proposal',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adapt-proposal',
    13,
    'input',
    'Sophie',
    $txt$Adapt your original proposal in response to Sophie's feedback. Explain what you would change and why.$txt$,
    $txt$Не повторюйте початкову ідею. Змініть хоча б два елементи пропозиції та поясніть логіку.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "For the pilot, I'd narrow the audience to a small group of existing clients and focus the session on one upcoming product rather than several topics. I'd also keep it to forty-five minutes so we can test engagement without creating too much work for the team.",
        "I'd make the first event invitation-only and build it around one clear topic. That would make the content easier to prepare and give us more useful feedback from a defined audience."
      ]
    }
    $json$::jsonb,
    'final-pitch',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви використали feedback, щоб зробити пропозицію конкретнішою та реалістичнішою.",
      "feedbackIncorrect": "Адаптуйте пропозицію, а не просто повторіть її. Змініть щонайменше два конкретні елементи й поясніть навіщо."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "adapt a proposal meaningfully in response to stakeholder feedback",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-pitch',
    14,
    'input',
    'Sophie',
    $txt$Give Sophie a final concise summary of the revised proposal and explain why the pilot is worth testing.$txt$,
    $txt$Фінальний B2 pitch: проблема → адаптоване рішення → бізнес-цінність → контроль ризику → наступний крок.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "To summarise, our current communication keeps clients informed but gives them limited opportunity to interact with us. I'd therefore test a focused online event with a small group of existing clients, centred on one product and clear success measures. A pilot would let us assess engagement and commercial potential without committing significant resources. I'll prepare the pilot plan and metrics for Friday.",
        "The revised proposal is a small invitation-only pilot focused on one topic and a defined client segment. It could strengthen engagement, support future sales and give us useful feedback, while keeping the initial cost and workload limited. If you're happy with that direction, I'll prepare the detailed plan as the next step."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінний фінальний pitch: ви об’єднали проблему, рішення, цінність, ризики та наступний крок у цілісну аргументацію.",
      "feedbackIncorrect": "Підсумок має показати логіку всієї пропозиції: проблема → адаптоване рішення → цінність → контроль ризику → наступний крок."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-presenting-an-idea-sophie",
      "role": "Marketing Director",
      "goal": "synthesise and defend a revised professional proposal",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Презентацію завершено! Ви сформулювали проблему, представили рішення, визначили аудиторію та бізнес-цінність, відповіли на заперечення, адаптували пропозицію і домовилися про конкретний наступний крок.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Presenting an Idea completed",
      "learnedWords": [
        "target audience",
        "business value",
        "client retention",
        "success metrics",
        "pilot",
        "resources",
        "risk",
        "proposal"
      ]
    }
    $json$::jsonb
  );

end $$;