-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #9: Giving a Presentation
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
    'giving-a-presentation',
    'Giving a Presentation',
    'Проведіть професійну презентацію: чітко відкрийте виступ, структуруйте аргументи, пояснюйте дані, реагуйте на заперечення та завершіть сильним висновком.',
    'conversation',
    'B2',
    8,
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
        "subtitle": "Побудуйте переконливу професійну презентацію",
        "objectives": [
          "чітко відкривати презентацію",
          "пояснювати структуру виступу",
          "логічно переходити між аргументами",
          "пояснювати значення даних, а не лише називати цифри",
          "відповідати на заперечення без захисної реакції",
          "уточнювати складні або нечіткі питання",
          "підсумовувати ключове повідомлення",
          "керувати короткою Q&A-сесією"
        ]
      },
      "location": "london-conference-room"
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
    'Presenting with Impact',
    'Проведіть презентацію від opening до Q&A.',
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
    $txt$Ви готуєте коротку презентацію для внутрішньої leadership team. Тема — чому компанії варто змінити підхід до вимірювання успіху нового цифрового продукту. Замість того щоб дивитися лише на кількість реєстрацій, ви хочете показати, що retention і повторне використання дають кращу картину реальної цінності продукту. Tom, Junior Analyst, допомагає вам перед виступом і ставитиме питання так, як це могла б зробити аудиторія.$txt$,
    null,
    '[]'::jsonb,
    null,
    'tom-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Conference Room"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'tom-opening', 1, 'dialogue', 'Tom',
    $txt$You've got about seven minutes with the leadership team. They'll want to understand your main point very quickly. How are you planning to open?$txt$,
    null,
    '[]'::jsonb,
    null,
    'opening-statement',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'opening-statement', 2, 'input', 'Tom',
    $txt$Open the presentation clearly. State the business problem, your main message and why the audience should care.$txt$,
    $txt$Дайте коротке opening: проблема → головна теза → чому це важливо для бізнесу.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Today I'd like to look at how we measure the success of our new product. At the moment we're focusing heavily on registrations, but that doesn't tell us whether people continue to find value after signing up. My main argument is that retention should become one of our core success measures because it gives us a clearer picture of sustainable product value.",
        "We're currently treating new registrations as our main sign of success. The problem is that a user can sign up once and never return. I want to show why retention gives us a more useful view of whether the product is actually creating lasting value."
      ]
    }
    $json$::jsonb,
    'tom-context',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Opening одразу пояснює проблему, тезу та її бізнес-значення.",
      "feedbackIncorrect": "Не починайте з довгого контексту. Аудиторія має швидко зрозуміти проблему, вашу головну тезу і чому вона важлива."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "open a professional presentation with a clear problem, thesis and relevance",
      "skill": "presentation-opening",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'tom-context', 3, 'dialogue', 'Tom',
    $txt$That gives them the main point. But with only seven minutes, they'll also need to know where you're taking them. How would you structure the rest of the presentation?$txt$,
    null,
    '[]'::jsonb,
    null,
    'structure-presentation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'structure-presentation', 4, 'input', 'Tom',
    $txt$Give the audience a clear roadmap. Use signposting language and organise the argument into a small number of logical steps.$txt$,
    $txt$Поясніть структуру виступу через signposting: спочатку → потім → на завершення.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'll cover three things. First, I'll explain why registrations alone can be misleading. Then I'll show what our retention data tells us about actual user behaviour. Finally, I'll recommend how we should combine acquisition and retention metrics when evaluating the product.",
        "I'll start by looking at the limitation of our current registration metric. Next, I'll compare it with retention behaviour. I'll finish with a practical recommendation for how we should measure success going forward."
      ]
    }
    $json$::jsonb,
    'tom-data',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Аудиторія тепер знає логіку презентації та може легко слідувати за аргументом.",
      "feedbackIncorrect": "Дайте чітку roadmap із 2–3 логічних частин і використайте signposting language."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "structure a presentation using clear signposting and logical sequencing",
      "skill": "organisation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'tom-data', 5, 'dialogue', 'Tom',
    $txt$Here's the strongest data point. Registrations increased by 28% last quarter, but only 34% of new users returned after their first week. The leadership team may see the 28% growth and think the product is already performing well.$txt$,
    null,
    '[]'::jsonb,
    null,
    'explain-data',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-data', 6, 'input', 'Tom',
    $txt$Explain what the numbers mean. Do not merely repeat 28% and 34%; interpret the relationship and its business implication.$txt$,
    $txt$Поясніть значення даних: що нам говорить поєднання growth in registrations + weak retention.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The 28% increase shows that we're getting more people into the product, but the 34% first-week retention suggests that most of those new users aren't staying engaged. So acquisition is improving faster than lasting value. That means registrations alone may make performance look stronger than it really is.",
        "These figures tell two different stories. We're attracting more users, which is positive, but only about a third return after the first week. The business implication is that stronger acquisition isn't automatically translating into sustained usage."
      ]
    }
    $json$::jsonb,
    'tom-objection',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви інтерпретували дані та пояснили їхній бізнес-сенс, а не просто повторили цифри.",
      "feedbackIncorrect": "Не достатньо назвати 28% і 34%. Поясніть, що їхнє співвідношення означає для реальної цінності продукту."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "interpret data and explain its business implication",
      "skill": "data-explanation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'tom-objection', 7, 'dialogue', 'Tom',
    $txt$Imagine someone from leadership says: "But registrations are still growing strongly. Why should we change the metric if growth is going in the right direction?" How would you respond?$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-objection',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'handle-objection', 8, 'input', 'Tom',
    $txt$Acknowledge the valid part of the objection, then explain why registrations are still insufficient as the only success measure.$txt$,
    $txt$Не відкидайте objection. Визнайте позитивний registration growth, а потім поясніть обмеження цієї метрики.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The registration growth is definitely positive, and I wouldn't suggest ignoring it. The issue is that it tells us only that more people are entering the funnel, not whether they're receiving enough value to stay. If we track both acquisition and retention, we can distinguish short-term growth from sustainable product performance.",
        "I agree that 28% registration growth is encouraging. My concern is not that registrations are useless, but that they're incomplete. Without retention, we can't tell whether those new users become active customers or disappear after their first experience."
      ]
    }
    $json$::jsonb,
    'tom-clarification',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь. Ви визнали позитивний аргумент аудиторії та показали, чому потрібна ширша картина.",
      "feedbackIncorrect": "Не сперечайтеся з очевидним позитивом. Визнайте registration growth, а потім поясніть, чого ця метрика не показує."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "handle an objection by acknowledging its valid point and reframing the argument",
      "skill": "argumentation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'tom-clarification', 9, 'dialogue', 'Tom',
    $txt$Another executive might ask: "Are you saying acquisition doesn't matter anymore?" That's not actually your position, but it's easy for the audience to misunderstand you.$txt$,
    null,
    '[]'::jsonb,
    null,
    'clarify-message',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'clarify-message', 10, 'input', 'Tom',
    $txt$Correct the misunderstanding clearly without sounding defensive. Restate the distinction between acquisition and retention.$txt$,
    $txt$Уточніть свою позицію: acquisition важлива, але retention відповідає на інше критичне питання.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Not at all. Acquisition still matters because we need to bring new users into the product. My point is that acquisition tells us whether we can attract people, while retention tells us whether they continue to find value after they arrive. We need both measures to understand performance properly.",
        "I'm not suggesting we replace acquisition. I'm suggesting we complement it. Registrations show our ability to attract users; retention shows whether the product is valuable enough for them to come back."
      ]
    }
    $json$::jsonb,
    'tom-final-question',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви виправили misunderstanding без defensive tone і чітко розділили ролі двох metrics.",
      "feedbackIncorrect": "Не просто повторіть попередню тезу. Чітко скажіть, що acquisition залишається важливою, але retention вимірює інший аспект."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "clarify a misunderstood argument precisely and non-defensively",
      "skill": "clarification",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'tom-final-question', 11, 'dialogue', 'Tom',
    $txt$Good. Now imagine you're reaching the end. Leadership has heard the argument and the data. What do you want them to remember and actually do after the presentation?$txt$,
    null,
    '[]'::jsonb,
    null,
    'conclusion',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'conclusion', 12, 'input', 'Tom',
    $txt$Give a concise conclusion that restates the key insight and ends with a clear recommendation or action.$txt$,
    $txt$Завершіть презентацію: ключова теза → бізнес-наслідок → конкретна рекомендація.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The key point is that stronger acquisition doesn't necessarily mean stronger product value. Registrations tell us who enters, while retention tells us who finds enough value to return. I recommend that we keep acquisition metrics but add first-week and longer-term retention to the core leadership dashboard so future product decisions are based on both growth and sustained usage.",
        "In summary, registration growth is encouraging, but it gives us only part of the picture. If we want to understand sustainable performance, we need retention alongside acquisition. My recommendation is to make retention a core success metric in our next product review."
      ]
    }
    $json$::jsonb,
    'q-and-a-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Conclusion повернув аудиторію до головної тези та завершився конкретною дією.",
      "feedbackIncorrect": "Не завершуйте просто повторенням даних. Підсумуйте insight і скажіть, що саме має змінитися після презентації."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "close a presentation with a clear insight and actionable recommendation",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'q-and-a-choice', 13, 'choice', 'Tom',
    $txt$During Q&A, someone asks for a number you don't have with you. Which response is most professional?$txt$,
    $txt$Оберіть відповідь, яка не вигадує дані та зберігає довіру аудиторії.$txt$,
    $json$
    [
      {
        "id": "follow-up",
        "text": "I don't have that figure with me, and I don't want to guess. I'll confirm it after the meeting and send it to you.",
        "value": "follow-up"
      },
      {
        "id": "invent",
        "text": "I think it's probably around 60%, although I'm not completely sure.",
        "value": "invent"
      },
      {
        "id": "avoid",
        "text": "That number isn't really important, so I'd rather move to another question.",
        "value": "avoid"
      }
    ]
    $json$::jsonb,
    '{"optionId":"follow-up"}'::jsonb,
    'final-summary',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Визнати відсутність даних і пообіцяти конкретний follow-up краще, ніж вигадувати відповідь.",
      "feedbackIncorrect": "Не вигадуйте цифру і не уникайте питання. Чітко визнайте, що даних немає під рукою, та запропонуйте follow-up."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "handle an unknown Q&A question without inventing information"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-summary', 14, 'input', 'Tom',
    $txt$Give the final two-minute version of your presentation: problem, structure, interpretation of the data, response to the main objection and recommendation.$txt$,
    $txt$Фінальний B2 synthesis: problem → evidence → interpretation → objection → recommendation.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Our current success measure focuses too heavily on registrations. While registrations increased by 28% last quarter, only 34% of new users returned after their first week. That means we're improving acquisition, but we don't yet know whether most new users are finding lasting value. I'm not suggesting that we stop measuring acquisition; it remains essential. However, registrations and retention answer different questions. Acquisition tells us whether we can attract users, while retention tells us whether they continue to engage after arriving. My recommendation is that we keep registration growth on the dashboard but add first-week and longer-term retention as core product metrics so leadership can judge both short-term growth and sustainable performance.",
        "Registrations are growing strongly, but growth in sign-ups alone can make product performance look healthier than it is. The 28% increase in registrations is positive, yet first-week retention of 34% shows that many new users don't return. Acquisition still matters, but retention gives us the missing view of ongoing value. I therefore recommend measuring the two together and making retention part of our standard product review."
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
      "feedbackCorrect": "Відмінно. Ви побудували завершену B2-презентацію: чітка теза, data interpretation, handling objections і конкретна recommendation.",
      "feedbackIncorrect": "Фінальний виступ має з'єднати проблему, дані, їхнє значення, основне objection і конкретну рекомендацію."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-giving-a-presentation-tom",
      "role": "Junior Analyst",
      "goal": "deliver a concise evidence-based professional presentation",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$Презентацію завершено. Ви чітко сформулювали основну тезу, структурували виступ, пояснили значення даних, професійно відповіли на objection та завершили конкретною рекомендацією.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Giving a Presentation completed",
      "learnedWords": [
        "signposting",
        "retention",
        "acquisition",
        "sustainable",
        "metric",
        "interpretation",
        "objection",
        "recommendation"
      ]
    }
    $json$::jsonb
  );

end $$;