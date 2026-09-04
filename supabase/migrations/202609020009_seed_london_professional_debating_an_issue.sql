-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #10: Debating an Issue
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
    'debating-an-issue',
    'Debating an Issue',
    'Візьміть участь у професійній дискусії про запуск нової AI-функції: сформулюйте позицію, працюйте з контраргументами, оцінюйте докази, визнавайте сильні аргументи іншої сторони та побудуйте збалансоване рішення.',
    'conversation',
    'B2',
    9,
    20,
    230,
    90,
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
        "subtitle": "Аргументуйте, слухайте і змінюйте позицію",
        "objectives": [
          "чітко формулювати позицію",
          "підкріплювати думку reasoning",
          "відповідати на контраргументи",
          "визнавати сильні сторони іншої позиції",
          "відрізняти evidence від assumptions",
          "уникати false certainty",
          "коригувати позицію після нових даних",
          "шукати компроміс між competing priorities",
          "будувати balanced conclusion"
        ]
      },
      "location": "london-product-meeting"
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
    'Arguing the Case',
    'Обговоріть суперечливе product decision і сформуйте збалансовану позицію.',
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
    quest_uuid, act_uuid, 'briefing', 0, 'narration', null,
    $txt$Команда готується запустити нову AI-функцію, яка автоматично створює персоналізовані рекомендації для користувачів. Початкові тести показують перспективні результати, але функція іноді робить неточні припущення. Частина команди хоче ввімкнути її для всіх користувачів одразу, щоб швидше отримати масштабні дані. Інші пропонують opt-in rollout. Maya, Product Manager, проводить дискусію перед остаточним рішенням.$txt$,
    null,
    '[]'::jsonb,
    null,
    'maya-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Product Meeting"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'maya-opening', 1, 'dialogue', 'Maya',
    $txt$We need to make a decision today. My initial view is that we should enable the AI feature for everyone. The pilot looks promising, and a full rollout would give us much better data. What do you think?$txt$,
    null,
    '[]'::jsonb,
    null,
    'state-position',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'state-position', 2, 'input', 'Maya',
    $txt$State a clear position and support it with reasoning. Do not simply say yes or no.$txt$,
    $txt$Сформулюйте позицію щодо full rollout vs opt-in і поясніть головну причину.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd favour an opt-in rollout first. The early results are encouraging, but if the system is still making inaccurate assumptions, exposing every user immediately could create trust problems. A controlled rollout would still give us real-world data while limiting the impact of mistakes.",
        "I wouldn't enable it for everyone yet. I'd start with a larger voluntary group so we can test the feature at scale without assuming that the pilot results will translate perfectly to the whole user base."
      ]
    }
    $json$::jsonb,
    'maya-counterargument',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не просто висловили opinion, а пов'язали позицію з конкретним product risk.",
      "feedbackIncorrect": "Не обмежуйтеся yes/no. Сформулюйте позицію і поясніть, який ризик або benefit лежить в її основі."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "state and justify a clear position in a professional debate",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'maya-counterargument', 3, 'dialogue', 'Maya',
    $txt$I see the risk, but an opt-in group may not give us representative data. The people who voluntarily try AI features are probably more interested in them than the average user. If we want to know whether the feature really works at scale, doesn't that argue for making it available to everyone?$txt$,
    null,
    '[]'::jsonb,
    null,
    'respond-counterargument',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'respond-counterargument', 4, 'input', 'Maya',
    $txt$Respond directly to Maya's concern about selection bias. Acknowledge the valid point and explain how you could still reduce risk while collecting broader data.$txt$,
    $txt$Визнайте проблему selection bias і запропонуйте спосіб отримати більш representative data без миттєвого full rollout.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That's a fair concern. An opt-in sample could be biased toward users who already like AI features. But that doesn't mean the only alternative is a full rollout. We could randomly expose a limited percentage of the broader user base and compare their behaviour with a control group.",
        "I agree that voluntary users may not represent everyone. I'd address that by running a staged randomised rollout rather than relying only on opt-in users. That would give us broader evidence while still limiting the number of people affected if the feature performs badly."
      ]
    }
    $json$::jsonb,
    'maya-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви визнали реальну слабкість своєї позиції та відповіли на неї конкретним design рішенням.",
      "feedbackIncorrect": "Не ігноруйте selection bias. Визнайте проблему і поясніть, як staged або randomised rollout може дати ширші дані."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "respond constructively to a valid counterargument",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'maya-evidence', 5, 'dialogue', 'Maya',
    $txt$Here's what we know from the pilot. Users who received AI recommendations clicked 18% more content, but the test involved only 600 highly active users. We also recorded complaints from about 4% of participants who felt some recommendations were inappropriate.$txt$,
    null,
    '[]'::jsonb,
    null,
    'evaluate-evidence',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evaluate-evidence', 6, 'input', 'Maya',
    $txt$Evaluate the evidence rather than choosing only the number that supports your preferred position. Explain what the pilot suggests and what it cannot yet prove.$txt$,
    $txt$Оцініть обидва сигнали: +18% engagement і 4% complaints. Також врахуйте, що sample складався лише з 600 highly active users.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The 18% increase is encouraging because it suggests the recommendations can increase engagement. But the sample is small and unusually active, so we can't assume the same effect across all users. The 4% complaint rate also matters because a negative recommendation may have a stronger trust impact than a missed click. I'd treat the pilot as promising evidence, not proof that a full rollout is safe.",
        "The pilot gives us a positive signal on engagement, but it has two important limitations: the users weren't representative of the full audience, and some users experienced inappropriate recommendations. So it supports further testing, but not necessarily immediate universal exposure."
      ]
    }
    $json$::jsonb,
    'maya-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви не cherry-picked цифри, а оцінили strength і limitations evidence.",
      "feedbackIncorrect": "Не використовуйте лише +18% або лише complaints. Поясніть, що дані підтримують і чого вони ще не доводять."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "evaluate evidence fairly and distinguish signals from conclusions",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'maya-challenge', 7, 'dialogue', 'Maya',
    $txt$But every new feature has some complaints. If we wait until there's no risk, we'll never launch anything. Isn't a cautious rollout just another way of delaying a decision?$txt$,
    null,
    '[]'::jsonb,
    null,
    'concede-and-rebut',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'concede-and-rebut', 8, 'input', 'Maya',
    $txt$Concede the valid principle in Maya's argument, but challenge the conclusion that accepting risk requires immediate universal rollout.$txt$,
    $txt$Побудуйте concession + rebuttal: погодьтеся, що zero risk неможливий, але поясніть, чому це не означає full rollout зараз.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I agree that we can't wait for zero risk, and some complaints are inevitable with any meaningful launch. Where I disagree is the idea that accepting risk means exposing everyone at once. A staged rollout lets us take real risk and learn from real users while keeping the consequences manageable if our assumptions are wrong.",
        "You're right that excessive caution can become a form of delay. But staged deployment isn't the same as avoiding a decision. We'd still launch, measure and commit resources; we'd simply increase exposure as the evidence becomes stronger."
      ]
    }
    $json$::jsonb,
    'maya-new-data',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви визнали справедливий принцип опонента, але не прийняли його ширший висновок автоматично.",
      "feedbackIncorrect": "Спочатку визнайте, що zero-risk launch неможливий. Потім покажіть, чому acceptance of risk не дорівнює universal rollout."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "use concession and rebuttal in a professional debate",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'maya-new-data', 9, 'dialogue', 'Maya',
    $txt$We've just received another result. When users were clearly told that the recommendations were AI-generated and could be inaccurate, complaints dropped from 4% to 1.5%. Engagement stayed almost the same. Does that change your position?$txt$,
    null,
    '[]'::jsonb,
    null,
    'revise-position',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'revise-position', 10, 'input', 'Maya',
    $txt$Update your position in response to the new evidence. Do not pretend the new information changes nothing, and do not abandon all previous concerns without reasoning.$txt$,
    $txt$Покажіть intellectual flexibility: поясніть, що саме нові дані змінюють у вашій позиції, а які uncertainty залишаються.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Yes, it makes me more comfortable with broader exposure because it suggests that transparency significantly reduces one of the main risks without hurting engagement. I still wouldn't jump directly from 600 active users to the entire user base, but I'd be willing to move from a small opt-in test to a much larger staged rollout with the disclosure enabled.",
        "It changes my position to some extent. The lower complaint rate suggests that part of the problem can be managed through clear communication. I'd therefore support expanding the test more aggressively, although I'd still want staged exposure so we can confirm the result with a more representative audience."
      ]
    }
    $json$::jsonb,
    'maya-compromise',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви змінили позицію пропорційно новим evidence, але не зробили необґрунтований стрибок до абсолютної впевненості.",
      "feedbackIncorrect": "Нові дані мають вплинути на вашу позицію. Поясніть, який risk вони зменшують і яка uncertainty все ще залишається."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "revise a position proportionately when new evidence emerges",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'maya-compromise', 11, 'dialogue', 'Maya',
    $txt$We're getting closer. I want enough exposure to learn quickly, and you want safeguards against a bad universal launch. What would a policy look like that addresses both priorities?$txt$,
    null,
    '[]'::jsonb,
    null,
    'propose-policy',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'propose-policy', 12, 'input', 'Maya',
    $txt$Propose a concrete compromise policy. Include rollout size, transparency, success or safety measures and a condition for expanding further.$txt$,
    $txt$Дайте operational compromise, а не просто «launch gradually»: exposure → disclosure → metrics → expansion rule.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd launch to a randomly selected 20% of users with a clear AI disclosure. We'd monitor engagement, complaint rate and opt-out behaviour for two weeks. If engagement remains positive and complaints stay below an agreed threshold, we expand to 50%, then review again before universal rollout.",
        "We could begin with 20% random exposure rather than opt-in only, keep the transparency message that reduced complaints, and define clear metrics for engagement and harmful recommendation reports. If those remain within agreed limits for a fixed period, we increase exposure in stages."
      ]
    }
    $json$::jsonb,
    'debate-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Компроміс перетворив абстрактну дискусію на testable policy з exposure, safeguards, metrics та expansion rule.",
      "feedbackIncorrect": "Не кажіть лише «запускаймо поступово». Визначте стартовий exposure, safeguards, metrics і умову наступного expansion."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "convert competing arguments into a concrete compromise policy",
      "skill": "problem-solving",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'debate-choice', 13, 'choice', 'Maya',
    $txt$Which statement best reflects strong professional debate?$txt$,
    $txt$Оберіть принцип, який найкраще описує якісну B2-дискусію.$txt$,
    $json$
    [
      {
        "id": "update",
        "text": "A strong position can change when new evidence appears, as long as the change is explained and proportionate to the evidence.",
        "value": "update"
      },
      {
        "id": "never-change",
        "text": "Changing your position shows weakness, so you should defend your original argument throughout the discussion.",
        "value": "never-change"
      },
      {
        "id": "agree",
        "text": "The best way to avoid conflict is to agree with the most senior person in the room.",
        "value": "agree"
      }
    ]
    $json$::jsonb,
    '{"optionId":"update"}'::jsonb,
    'final-argument',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Сильна аргументація — це не впертість; позиція має реагувати на якість нових evidence.",
      "feedbackIncorrect": "Професійна дискусія вимагає reasoning та готовності коригувати позицію, а не впертості чи автоматичної згоди."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "recognise evidence-responsive professional argumentation"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-argument', 14, 'input', 'Maya',
    $txt$Give your final recommendation. Summarise the strongest argument for faster rollout, the strongest risk, how the new evidence changed your view and the policy you now support.$txt$,
    $txt$Фінальний B2 debate synthesis: opposing argument → risk → new evidence → revised position → concrete recommendation.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The strongest argument for faster rollout is that broader exposure gives us more representative data and helps us learn sooner. At the same time, the pilot showed a real trust risk: some users received recommendations they considered inappropriate, and the original sample wasn't representative. The new disclosure result changes the balance because complaints fell from 4% to 1.5% without reducing engagement, which suggests that transparency can manage part of the risk. I therefore support moving beyond a small opt-in test, but not directly to universal rollout. I'd start with random exposure to about 20% of users, keep the AI disclosure, monitor engagement and complaint metrics and expand in stages if the results remain within agreed thresholds.",
        "A full launch would generate data quickly and avoid relying on self-selected users, which is a legitimate advantage. However, we still don't know whether the pilot results generalise to the entire audience. The lower complaint rate with clear disclosure makes me more comfortable increasing exposure, so my recommendation is a staged randomised rollout with transparency, defined safety and engagement measures and clear criteria for expanding further."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви завершили дискусію balanced аргументом, відреагували на evidence та перетворили disagreement на конкретну recommendation.",
      "feedbackIncorrect": "Фінал має чесно представити сильний аргумент іншої сторони, ризик, вплив нових evidence та вашу конкретну revised recommendation."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-debating-an-issue-maya",
      "role": "Product Manager",
      "goal": "synthesise competing arguments and evidence into a balanced recommendation",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$Дискусію завершено. Ви сформулювали позицію, працювали з контраргументами, оцінили evidence без cherry-picking, визнали сильні аргументи іншої сторони, скоригували власну позицію після нових даних та запропонували конкретний compromise policy.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Debating an Issue completed",
      "learnedWords": [
        "counterargument",
        "selection bias",
        "representative",
        "evidence",
        "assumption",
        "concession",
        "rebuttal",
        "staged rollout"
      ]
    }
    $json$::jsonb
  );

end $$;