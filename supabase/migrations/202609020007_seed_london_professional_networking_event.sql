-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #8: Networking Event
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
    'networking-event',
    'Networking Event',
    'Познайомтеся з професіоналами на networking event: природно представтеся, підтримайте змістовну розмову, покажіть свою цінність без нав''язливого sales pitch та домовтеся про конкретний follow-up.',
    'conversation',
    'B2',
    7,
    18,
    220,
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
        "subtitle": "Перетворіть small talk на професійний контакт",
        "objectives": [
          "природно представлятися у професійному середовищі",
          "ставити змістовні follow-up questions",
          "знаходити спільні професійні теми",
          "коротко пояснювати власний досвід і цінність",
          "уникати нав'язливого sales pitch",
          "природно входити в групову розмову",
          "реагувати на інформацію співрозмовника",
          "завершувати розмову без незручності",
          "домовлятися про конкретний follow-up"
        ]
      },
      "location": "london-networking-event"
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
    'Building a Professional Connection',
    'Перетворіть коротке знайомство на природний і корисний професійний контакт.',
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
    $txt$Ви прийшли на професійний networking event у центрі Лондона. Тут немає формальних співбесід чи презентацій: люди знайомляться, обговорюють роботу та шукають корисні контакти. Біля столика з напоями ви знайомитеся з Isabella, Finance Controller у компанії, що швидко зростає. Ваше завдання — не продати себе за дві хвилини, а побудувати природний професійний контакт.$txt$,
    null,
    '[]'::jsonb,
    null,
    'isabella-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Professional Networking Event"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'isabella-opening', 1, 'dialogue', 'Isabella',
    $txt$Hi, I don't think we've met. I'm Isabella. I work in finance for a growing technology company. What brings you here tonight?$txt$,
    null,
    '[]'::jsonb,
    null,
    'introduce-yourself',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "emotion": "happy"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'introduce-yourself', 2, 'input', 'Isabella',
    $txt$Introduce yourself naturally. Give enough professional context to make conversation possible, but do not deliver a long CV or aggressive sales pitch.$txt$,
    $txt$Представтеся природно: хто ви, чим займаєтеся і чому прийшли. Не перетворюйте відповідь на резюме чи рекламний pitch.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Nice to meet you, Isabella. I'm working on digital products at the moment, mainly around user experience and growth. I came tonight to meet people from different parts of the industry and hear what challenges they're working on.",
        "I'm involved in building digital products, with a particular interest in how products grow and retain users. I thought this event would be a good chance to meet people outside my usual circle and learn what they're seeing in their businesses."
      ]
    }
    $json$::jsonb,
    'isabella-role',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Представлення коротке, природне і залишає Isabella достатньо тем для продовження розмови.",
      "feedbackIncorrect": "Дайте короткий професійний контекст і причину вашої присутності. Уникайте довгого CV, самовихваляння або прямого продажу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "introduce yourself naturally and concisely in a professional networking context",
      "skill": "professional-small-talk",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'isabella-role', 3, 'dialogue', 'Isabella',
    $txt$That sounds interesting. My role has changed a lot recently because the company has grown quickly. I used to spend most of my time on reporting, but now I'm much more involved in planning and decisions across the business.$txt$,
    null,
    '[]'::jsonb,
    null,
    'follow-up-question',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "emotion": "happy"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'follow-up-question', 4, 'input', 'Isabella',
    $txt$Ask a genuine follow-up question based on what Isabella just told you. Avoid generic interview questions that ignore her comment.$txt$,
    $txt$Поставте змістовне follow-up question саме про зміну її ролі або зростання компанії.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "What changed most for you when the company started growing? Was it mainly the amount of work, or did finance begin influencing different kinds of decisions?",
        "That's quite a shift. What kinds of business decisions are you now involved in that wouldn't have been part of your role before?"
      ]
    }
    $json$::jsonb,
    'isabella-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ваше питання прямо продовжує те, що сказала Isabella, тому розмова звучить природно, а не як інтерв'ю за шаблоном.",
      "feedbackIncorrect": "Поставте питання, яке показує, що ви слухали Isabella. Спирайтеся на зміну її ролі або швидке зростання компанії."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "ask a relevant follow-up question that demonstrates active listening",
      "skill": "conversation-management",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'isabella-challenge', 5, 'dialogue', 'Isabella',
    $txt$One big change is that we have to decide where growth is actually worth paying for. Different teams bring us ideas for new tools, campaigns and hires, but the difficult part is deciding which investments will genuinely improve the business rather than just add cost.$txt$,
    null,
    '[]'::jsonb,
    null,
    'connect-experience',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'connect-experience', 6, 'input', 'Isabella',
    $txt$Connect Isabella's challenge to relevant experience or an observation of your own. Add value to the conversation without taking it over.$txt$,
    $txt$Знайдіть спільну професійну тему. Коротко пов'яжіть її проблему зі своїм досвідом або спостереженням і поверніть розмову Isabella.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I've seen a similar tension on the product side. It's easy to justify a new feature by saying it could increase growth, but the harder question is what behaviour we expect it to change and how we'll know whether the investment worked. How do you usually evaluate that?",
        "That sounds familiar. In product work, teams can become attached to solutions before they've agreed on the outcome they're trying to improve. I've found it useful to define the expected impact first. Is finance involved that early in your process?"
      ]
    }
    $json$::jsonb,
    'group-transition',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви додали власний досвід, але не перетворили розмову на монолог і повернули фокус співрозмовниці.",
      "feedbackIncorrect": "Зв'яжіть її проблему зі своїм релевантним досвідом коротко. Не змінюйте тему і не використовуйте момент для самореклами."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "connect relevant experience while keeping the conversation reciprocal",
      "skill": "perspective-taking",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'group-transition', 7, 'dialogue', 'Isabella',
    $txt$Actually, two colleagues of mine are talking about exactly that near the window. One leads operations and the other works in product. We could join them if you'd like.$txt$,
    null,
    '[]'::jsonb,
    null,
    'join-conversation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'join-conversation', 8, 'input', 'Isabella',
    $txt$Join the group naturally. Acknowledge the existing conversation before contributing; do not interrupt with a long introduction or immediately redirect attention to yourself.$txt$,
    $txt$Увійдіть у групову розмову природно: коротко представтеся, визнайте тему, яку вже обговорюють, і додайте релевантну думку або питання.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Hi, I'm Alex. Isabella was just telling me you're discussing how to judge which growth investments are actually worthwhile. That's something I've run into on the product side as well. What are you finding hardest to evaluate?",
        "Nice to meet you both. Isabella mentioned you were talking about investment decisions during growth. I'd be interested to hear how you're balancing short-term pressure with longer-term value."
      ]
    }
    $json$::jsonb,
    'isabella-opportunity',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Природно. Ви увійшли в існуючу тему, а не змусили групу починати розмову заново навколо вас.",
      "feedbackIncorrect": "Не переривайте групу власним pitch. Визнайте поточну тему, коротко представтеся та приєднайтеся до неї."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "enter an existing professional group conversation naturally",
      "skill": "conversation-management",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'isabella-opportunity', 9, 'dialogue', 'Isabella',
    $txt$You mentioned product growth earlier. We're actually reviewing how we measure whether some of our digital investments are creating real customer value. It sounds as though you might have some experience with that.$txt$,
    null,
    '[]'::jsonb,
    null,
    'concise-value',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "emotion": "happy"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'concise-value', 10, 'input', 'Isabella',
    $txt$Explain your relevant value in two or three sentences. Be concrete, but do not turn the answer into a sales pitch or claim that you can solve everything.$txt$,
    $txt$Коротко поясніть, чим ваш досвід може бути релевантним. Покажіть конкретну цінність без перебільшень і нав'язливого продажу.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I've worked on connecting product metrics with actual user behaviour, especially when teams need to distinguish activity from meaningful retention or conversion. I wouldn't assume the same framework fits your business, but I could probably share a few ways we've approached that problem.",
        "A lot of my work has involved defining what success should look like before teams invest heavily in a feature or campaign. I may have some useful examples around linking product decisions to measurable customer behaviour."
      ]
    }
    $json$::jsonb,
    'isabella-wrap-up',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви показали релевантність конкретно, але не перебільшували й не перетворили networking на sales call.",
      "feedbackIncorrect": "Сформулюйте конкретну релевантність у 2–3 реченнях. Уникайте великих обіцянок, довгого CV та агресивного продажу."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "communicate relevant professional value concisely without overselling",
      "skill": "professional-communication",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'isabella-wrap-up', 11, 'dialogue', 'Isabella',
    $txt$I'd actually be interested in seeing one of those examples. We're not choosing a solution yet, but we're trying to improve the questions we ask before approving new investment. I need to leave in a few minutes, though.$txt$,
    null,
    '[]'::jsonb,
    null,
    'propose-follow-up',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'propose-follow-up', 12, 'input', 'Isabella',
    $txt$Suggest a low-pressure, concrete follow-up that matches Isabella's interest. Define what you will send or discuss rather than vaguely saying you should keep in touch.$txt$,
    $txt$Запропонуйте конкретний follow-up: що саме ви надішлете або обговорите і який простий наступний крок пропонуєте.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd be happy to send you a short example of the framework we used to connect investment decisions with customer behaviour. If it's useful, we could have a twenty-minute call next week and compare it with the questions your team is currently using.",
        "Why don't I send you a one-page example of how we've framed those decisions? You can see whether any of it is relevant, and if it is, we could arrange a short conversation next week."
      ]
    }
    $json$::jsonb,
    'follow-up-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Follow-up конкретний, легкий для Isabella і прямо пов'язаний із тим, що її зацікавило.",
      "feedbackIncorrect": "Не обмежуйтеся 'let's keep in touch'. Запропонуйте конкретний матеріал або тему та простий наступний крок."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "propose a specific low-pressure professional follow-up",
      "skill": "relationship-building",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'follow-up-choice', 13, 'choice', 'Isabella',
    $txt$Isabella gives you her contact details. Which follow-up is most effective?$txt$,
    $txt$Оберіть повідомлення, яке показує, що ви пам'ятаєте розмову і виконуєте конкретну обіцянку.$txt$,
    $json$
    [
      {
        "id": "specific",
        "text": "Send the promised example with a short note referring to her investment-measurement challenge and suggest a brief call next week.",
        "value": "specific"
      },
      {
        "id": "generic",
        "text": "Send: 'Great meeting you. Let's stay in touch!' without mentioning anything from the conversation.",
        "value": "generic"
      },
      {
        "id": "sales",
        "text": "Immediately send a long proposal explaining why she should hire you or buy your solution.",
        "value": "sales"
      }
    ]
    $json$::jsonb,
    '{"optionId":"specific"}'::jsonb,
    'final-networking',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Сильний follow-up продовжує конкретну розмову і виконує обіцянку, а не починає продаж із нуля.",
      "feedbackIncorrect": "Follow-up має бути персоналізованим, конкретним і пов'язаним із реальною розмовою."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "choose an effective personalised professional follow-up"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-networking', 14, 'input', 'Isabella',
    $txt$Close the conversation naturally. Refer to something specific you learned about Isabella, confirm your promised follow-up and leave without creating pressure.$txt$,
    $txt$Фінальна B2-відповідь: natural close → remembered detail → promised value → concrete follow-up → no pressure.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "It was really good meeting you, Isabella. I enjoyed hearing how your role has moved from reporting into broader investment decisions as the company has grown. I'll send you that short example on measuring customer value, and if it looks relevant, we can find twenty minutes next week to compare approaches. Enjoy the rest of the evening.",
        "Thanks, Isabella. The challenge you mentioned about deciding which growth investments create real value is something I'd like to continue discussing. I'll send the one-page example I mentioned, and you can decide whether a short call next week would be useful. It was great meeting you."
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
      "feedbackCorrect": "Відмінно. Ви завершили розмову природно, показали active listening і перетворили знайомство на конкретний професійний follow-up.",
      "feedbackIncorrect": "Фінал має показати, що ви слухали Isabella, нагадати про конкретну обіцянку та запропонувати наступний крок без тиску."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-networking-event-isabella",
      "role": "Finance Controller",
      "goal": "close a networking conversation naturally and establish a concrete follow-up",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$Networking contact established. Ви природно представилися, підтримали змістовну двосторонню розмову, показали релевантний досвід без нав'язливого продажу та домовилися про конкретний follow-up.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Networking Event completed",
      "learnedWords": [
        "networking",
        "follow-up",
        "investment",
        "customer value",
        "growth",
        "relevant",
        "framework",
        "keep in touch"
      ]
    }
    $json$::jsonb
  );

end $$;