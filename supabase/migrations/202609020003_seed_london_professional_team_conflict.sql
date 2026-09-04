-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #4: Team Conflict
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
    'team-conflict',
    'Team Conflict',
    'Вирішіть професійний конфлікт у команді: поясніть свою позицію без звинувачень, зрозумійте інтереси іншої сторони, встановіть межі та домовтеся про справедливий розподіл відповідальності.',
    'conversation',
    'B2',
    3,
    20,
    210,
    85,
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
        "subtitle": "Вирішення конфлікту в команді",
        "objectives": [
          "описувати конфлікт без особистих звинувачень",
          "відокремлювати позиції від інтересів",
          "визнавати перспективу іншої сторони",
          "чітко встановлювати професійні межі",
          "знижувати напруження в складній розмові",
          "пропонувати компроміс без односторонніх поступок",
          "домовлятися про конкретний розподіл відповідальності",
          "підсумовувати взаємну домовленість"
        ]
      },
      "location": "london-hr-meeting-room"
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
    'Finding Common Ground',
    'Разом з Emily знайдіть професійне рішення командного конфлікту.',
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
    $txt$Останні два тижні між вами та колегою Alex зростає напруження. Ви вважаєте, що він регулярно передає вам термінові завдання в останню хвилину. Alex стверджує, що ви недостатньо гнучкі та не підтримуєте команду під тиском. Emily, HR Business Partner, запропонувала допомогти вам знайти рішення.$txt$,
    null,
    '[]'::jsonb,
    null,
    'emily-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London HR Meeting Room"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'emily-opening',
    1,
    'dialogue',
    'Emily',
    $txt$Thanks for meeting with me. I'm not here to decide who's right or wrong. I'd like to understand what's happening and help you find a way of working that both of you can accept. How would you describe the problem?$txt$,
    null,
    '[]'::jsonb,
    null,
    'describe-conflict',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'describe-conflict',
    2,
    'input',
    'Emily',
    $txt$Describe the conflict objectively without attacking Alex personally.$txt$,
    $txt$Опишіть конкретну поведінку та її вплив на вашу роботу. Не характеризуйте Alex як людину.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The main issue is that I've received several urgent tasks from Alex very close to the deadline. That has made it difficult to plan my workload and has sometimes delayed my other responsibilities.",
        "We've had a number of situations where additional work has come to me at very short notice. The problem for me is the impact this has on my existing priorities and deadlines."
      ]
    }
    $json$::jsonb,
    'emily-perspective',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви описали поведінку та її наслідки, не переходячи до особистих звинувачень.",
      "feedbackIncorrect": "Зосередьтеся на конкретній поведінці та її впливі. Уникайте ярликів на кшталт lazy, selfish або irresponsible."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "describe a workplace conflict objectively without personal attacks",
      "skill": "professional-communication",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'emily-perspective',
    3,
    'dialogue',
    'Emily',
    $txt$Alex sees it differently. He says client priorities often change suddenly and that when he asks for help, he feels you're more focused on protecting your own schedule than on the team's result.$txt$,
    null,
    '[]'::jsonb,
    null,
    'acknowledge-perspective',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'acknowledge-perspective',
    4,
    'input',
    'Emily',
    $txt$Show that you understand Alex's perspective without automatically agreeing that his conclusion is correct.$txt$,
    $txt$Визнайте логіку іншої сторони, але не відмовляйтеся від власної позиції.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I can understand why he sees it that way. When client priorities change, he needs the team to respond quickly. At the same time, I don't think flexibility means that existing commitments can always be changed without discussion.",
        "I understand that Alex is under pressure when clients make late requests, and I can see why he needs support. My concern is that responding to every urgent request immediately can create problems elsewhere."
      ]
    }
    $json$::jsonb,
    'identify-interest',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви показали розуміння перспективи Alex, не відмовляючись від власних професійних потреб.",
      "feedbackIncorrect": "Покажіть, що розумієте причину позиції Alex, але не потрібно автоматично визнавати його висновок правильним."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "acknowledge another perspective while maintaining one's own position",
      "skill": "perspective-taking",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'identify-interest',
    5,
    'dialogue',
    'Emily',
    $txt$Good. So perhaps the positions are "Alex wants immediate help" and "you want to protect your schedule." But what do you think each of you actually needs underneath those positions?$txt$,
    null,
    '[]'::jsonb,
    null,
    'underlying-interests',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'underlying-interests',
    6,
    'input',
    'Emily',
    $txt$Identify the underlying professional need on both sides of the conflict.$txt$,
    $txt$Поясніть не лише те, чого хоче кожна сторона, а навіщо їй це потрібно.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Alex needs a reliable way to respond when client priorities change, while I need enough predictability to manage my existing commitments. Ultimately, we both need a process that lets the team respond quickly without creating new delivery problems.",
        "His underlying need is probably confidence that urgent client work will be supported. Mine is visibility and enough notice to manage competing priorities. Those needs don't necessarily conflict if we agree on a better process."
      ]
    }
    $json$::jsonb,
    'boundary-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Ви перейшли від позицій до інтересів — це ключовий крок у вирішенні конфлікту.",
      "feedbackIncorrect": "Спробуйте визначити потребу кожної сторони: що Alex намагається забезпечити і що потрібно вам для нормальної роботи."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "distinguish stated positions from underlying professional interests",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'boundary-question',
    7,
    'dialogue',
    'Emily',
    $txt$Let's make your side clearer. What are you willing to be flexible about, and where do you need a boundary?$txt$,
    null,
    '[]'::jsonb,
    null,
    'set-boundary',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'set-boundary',
    8,
    'input',
    'Emily',
    $txt$State a professional boundary while showing reasonable flexibility.$txt$,
    $txt$Скажіть, де ви готові допомагати, а що не може регулярно відбуватися без перегляду пріоритетів.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'm willing to help with genuinely urgent client issues, even when that means adjusting my plans. But if a new task will take several hours or affect an existing deadline, I need us to agree which priority should change rather than simply adding the work.",
        "I can be flexible when something is genuinely urgent. My boundary is that significant last-minute work shouldn't regularly be added without discussing what existing commitment will be delayed or reassigned."
      ]
    }
    $json$::jsonb,
    'escalation',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Межа чітка, але не жорстка: ви залишили місце для реальної терміновості та командної роботи.",
      "feedbackIncorrect": "Потрібні обидві частини: де ви готові бути гнучкими і яку конкретну межу хочете встановити."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "set a clear professional boundary while remaining reasonably flexible",
      "skill": "assertiveness",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'escalation',
    9,
    'dialogue',
    'Emily',
    $txt$Imagine Alex responds: "This is exactly the problem. Every time I need something urgently, you turn it into a discussion about your workload." What would you say?$txt$,
    null,
    '[]'::jsonb,
    null,
    'deescalate',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'deescalate',
    10,
    'input',
    'Emily',
    $txt$De-escalate the conflict. Respond to the concern without attacking Alex or abandoning your boundary.$txt$,
    $txt$Знизьте напруження: визнайте його frustration, переформулюйте проблему та поверніть розмову до спільного рішення.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I can see why that feels frustrating, and I'm not saying I won't help. What I'm trying to avoid is solving one urgent problem by accidentally creating another. I'd like us to have a quick way to decide together which priority should move when urgent work comes in.",
        "I understand that you need fast support when a client issue appears. I'm not trying to block that. I want us to agree on how we handle competing priorities so that helping with one deadline doesn't put another one at risk."
      ]
    }
    $json$::jsonb,
    'emily-compromise',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна de-escalation: ви визнали frustration, не атакували Alex і повернули розмову до спільної проблеми.",
      "feedbackIncorrect": "Не відповідайте звинуваченням на звинувачення. Визнайте concern, збережіть межу і переформулюйте ситуацію як спільну проблему."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "de-escalate a confrontational statement while maintaining a boundary",
      "skill": "conflict-resolution",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'emily-compromise',
    11,
    'dialogue',
    'Emily',
    $txt$That sounds more constructive. Now imagine you both accept that urgent work sometimes happens. What practical arrangement could meet both of your needs?$txt$,
    null,
    '[]'::jsonb,
    null,
    'propose-compromise',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'propose-compromise',
    12,
    'input',
    'Emily',
    $txt$Propose a practical compromise that addresses both Alex's need for responsiveness and your need for manageable priorities.$txt$,
    $txt$Компроміс має містити конкретний процес, а не лише «we should communicate better». Покажіть, що робитимете обидві сторони.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "We could agree that Alex flags urgent requests with the deadline and estimated effort as early as possible. If the work affects one of my existing commitments, we'll spend five minutes deciding together what should be reprioritised instead of simply adding another deadline.",
        "Alex could give me the context, urgency and expected workload whenever a late request comes in. I'll respond quickly, but if it conflicts with existing work, we'll agree which task moves before I take it on."
      ]
    }
    $json$::jsonb,
    'agreement-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Чудово. Це взаємний компроміс із конкретним процесом, а не одностороння поступка.",
      "feedbackIncorrect": "Компроміс має визначати поведінку обох сторін і спосіб вирішення конфлікту пріоритетів."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "negotiate a concrete mutual compromise",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'agreement-choice',
    13,
    'choice',
    'Emily',
    $txt$Emily asks how you should handle a future urgent request that conflicts with an existing deadline. Which approach best reflects the agreement?$txt$,
    $txt$Оберіть варіант, який захищає і командну гнучкість, і прозорість пріоритетів.$txt$,
    $json$
    [
      {
        "id": "reprioritise",
        "text": "Clarify the urgency and effort, then agree with Alex which existing priority should move before taking on the new work.",
        "value": "reprioritise"
      },
      {
        "id": "always-accept",
        "text": "Accept every urgent request immediately because team needs should always come first.",
        "value": "always-accept"
      },
      {
        "id": "always-refuse",
        "text": "Refuse any request that wasn't included in the original schedule.",
        "value": "always-refuse"
      }
    ]
    $json$::jsonb,
    '{"optionId":"reprioritise"}'::jsonb,
    'final-agreement',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Нове термінове завдання не ігнорується, але його вплив на інші пріоритети стає явним.",
      "feedbackIncorrect": "Рішення не повинно бути абсолютним. Потрібно оцінити терміновість і прозоро переглянути конкуруючі пріоритети."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "apply the negotiated prioritisation process"
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
    'Emily',
    $txt$Summarise the agreement you would propose to Alex, including what you understand about his needs, your boundary, and what each of you will do differently.$txt$,
    $txt$Фінальна B2-відповідь: його потреба → ваша потреба/межа → взаємний процес → конкретні відповідальності.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand that Alex needs quick support when client priorities change, and I'm willing to be flexible when something is genuinely urgent. At the same time, I need significant new work to be considered alongside my existing commitments. I'd suggest that Alex gives me the urgency, deadline and expected effort as early as possible, and I'll respond quickly. If the request conflicts with another deadline, we'll agree together which priority should move.",
        "We both want the team to respond effectively to urgent client needs. I'll be flexible when unexpected work comes in, but I need visibility over the impact on existing deadlines. Alex will provide the context and urgency of new requests, and if there's a conflict, we'll decide together what should be reprioritised rather than simply adding more work."
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
      "feedbackCorrect": "Відмінно. Ви сформулювали взаємну домовленість, яка визнає потреби обох сторін, встановлює межі та визначає конкретний процес.",
      "feedbackIncorrect": "Фінальна домовленість має охопити обидві сторони: потребу Alex, вашу межу, спільний процес і конкретну відповідальність кожного."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-team-conflict-emily",
      "role": "HR Business Partner",
      "goal": "synthesise both perspectives into a concrete mutual working agreement",
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
    $txt$Конфлікт врегульовано. Ви описали проблему без особистих звинувачень, зрозуміли інтереси обох сторін, встановили професійну межу, знизили напруження та сформували конкретну взаємну домовленість.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Team Conflict completed",
      "learnedWords": [
        "competing priorities",
        "underlying interests",
        "boundary",
        "flexibility",
        "reprioritise",
        "workload",
        "compromise",
        "common ground"
      ]
    }
    $json$::jsonb
  );

end $$;