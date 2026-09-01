-- =========================================================
-- TalkHero London Independence — B1
-- Mission #10: Talking to the Landlord
-- NPC: Daniel — Landlord
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
  where slug = 'london-independence'
    and status = 'published';

  if campaign_uuid is null then
    raise exception 'Campaign not found: london-independence';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'independent-life'
    and status = 'published';

  if episode_uuid is null then
    raise exception 'Episode not found: independent-life';
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
    'talking-to-the-landlord',
    'Talking to the Landlord',
    'Поговоріть із landlord про повторну протічку, поясніть серйозність проблеми та домовтеся про повноцінний ремонт.',
    'conversation',
    'B1',
    9,
    15,
    210,
    90,
    'published',
    '{"version":1,"sceneCount":16}'::jsonb,
    '{
      "adventure":{
        "campaignSlug":"london-independence",
        "subtitle":"Повторна проблема в квартирі",
        "objectives":[
          "описати повторну проблему",
          "пояснити, коли вона знову з''явилася",
          "описати ризики та наслідки",
          "нагадати про попередній ремонт",
          "відхилити тимчасове рішення",
          "домовитися про конкретний план ремонту",
          "підтвердити дату та час"
        ]
      },
      "location":"flat"
    }'::jsonb
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
    'The Leak Is Back',
    'Поясніть Daniel, чому потрібен нормальний ремонт, а не ще одне тимчасове рішення.',
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
    quest_uuid, act_uuid, 'leak-returns', 0, 'narration', null,
    'Увечері ви помічаєте воду на стелі у вітальні. Це та сама ділянка, яку ремонтували кілька тижнів тому. Під час сильного дощу вода знову почала капати, і пляма стала більшою.',
    null,
    '[]'::jsonb,
    null,
    'daniel-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"Flat","emotion":"concerned"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-greeting', 1, 'dialogue', 'Daniel',
    'Hi. You said there was another problem in the flat. What''s happened?',
    null,
    '[]'::jsonb,
    null,
    'describe-leak',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'describe-leak', 2, 'input', 'Daniel',
    'Explain what has happened.',
    'Скажіть, що протічка в стелі повернулася, вода знову капає під час дощу, а пляма стала більшою.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "The leak in the ceiling has come back. It started dripping again when it rained, and the damp patch has become much bigger.",
        "The same leak has returned. Water is coming through the ceiling again when it rains, and the stain is getting larger.",
        "Unfortunately, the ceiling is leaking again. It started during the rain, and the wet area is much bigger than before."
      ]
    }'::jsonb,
    'daniel-asks-when',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви пояснили, що проблема повторна і стала серйознішою.",
      "feedbackIncorrect":"Скажіть, що leak повернувся, вода капає під час дощу, а пляма збільшилася."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"describe a recurring housing problem",
      "grammar":["present perfect","comparatives"]
    }'::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-asks-when', 3, 'dialogue', 'Daniel',
    'When did you first notice that it had started leaking again?',
    null,
    '[]'::jsonb,
    null,
    'explain-timeline',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-timeline', 4, 'input', 'Daniel',
    'Explain the sequence of events.',
    'Поясніть, що вперше помітили невелику вологу пляму два дні тому, але сьогодні після сильного дощу вода почала капати.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I first noticed a small damp patch two days ago, but after the heavy rain today it actually started dripping.",
        "There was a small wet mark a couple of days ago, and then today, after the heavy rain, water started coming through.",
        "I noticed some damp two days ago, but it became much worse today when it started raining heavily."
      ]
    }'::jsonb,
    'daniel-minimises',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви чітко описали послідовність розвитку проблеми.",
      "feedbackIncorrect":"Згадайте два моменти: невелика пляма два дні тому і вода після сильного дощу сьогодні."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"describe a timeline"
    }'::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-minimises', 5, 'dialogue', 'Daniel',
    'Right. It might just need sealing again. I could ask someone to put another temporary patch on it tomorrow.',
    null,
    '[]'::jsonb,
    null,
    'reject-temporary-fix',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'reject-temporary-fix', 6, 'choice', 'Daniel',
    'You do not think another temporary patch is enough.',
    'Ввічливо, але впевнено відхиліть тимчасове рішення.',
    '[
      {
        "id":"good",
        "text":"I''m afraid I don''t think another temporary patch will be enough. The same problem came back after the last repair.",
        "value":"good"
      },
      {
        "id":"rude",
        "text":"That''s useless. You never fix anything properly.",
        "value":"rude"
      },
      {
        "id":"accept",
        "text":"Fine, just patch it again.",
        "value":"accept"
      }
    ]'::jsonb,
    '{"optionId":"good"}'::jsonb,
    'daniel-defends-repair',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":20,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Ви відхилили слабке рішення й пояснили причину.",
      "feedbackIncorrect":"Скажіть, що тимчасового ремонту недостатньо, бо проблема вже поверталася."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"reject a temporary solution politely"
    }'::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-defends-repair', 7, 'dialogue', 'Daniel',
    'I understand, but last time the contractor said the problem had been fixed. Are you sure it''s coming from exactly the same place?',
    null,
    '[]'::jsonb,
    null,
    'refer-previous-repair',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"thinking"
    }'::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'refer-previous-repair', 8, 'input', 'Daniel',
    'Explain why you think it is the same problem.',
    'Скажіть, що вода з''являється в тому самому місці, і нагадайте, що після минулого ремонту ви домовилися стежити, чи проблема повернеться.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Yes, it''s coming through in exactly the same place. After the last repair, we agreed that I''d keep an eye on it and let you know if it came back.",
        "I''m quite sure because the water is appearing in the same part of the ceiling. We also agreed I''d contact you if the problem returned.",
        "It''s definitely the same area. After the previous repair, we agreed that I should tell you straight away if the leak came back."
      ]
    }'::jsonb,
    'daniel-asks-risk',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна відповідь. Ви використали конкретний доказ і послалися на попередню домовленість.",
      "feedbackIncorrect":"Скажіть, що вода в тому самому місці, і нагадайте про вашу попередню домовленість."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"refer to previous agreement",
      "skill":"argumentation"
    }'::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-asks-risk', 9, 'dialogue', 'Daniel',
    'Okay. Apart from the dripping, is it causing any other problems at the moment?',
    null,
    '[]'::jsonb,
    null,
    'explain-risk',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"concerned"
    }'::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'explain-risk', 10, 'input', 'Daniel',
    'Explain why the problem is urgent.',
    'Поясніть, що вода капає поруч із лампою і ви хвилюєтеся, що це може бути небезпечно, якщо проблема погіршиться.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "The water is dripping quite close to the ceiling light, so I''m concerned it could become dangerous if the leak gets worse.",
        "It''s leaking near one of the lights, and I''m worried there could be an electrical risk if more water comes through.",
        "The main concern is that the leak is close to the light fitting, so I don''t think it''s safe to leave it for too long."
      ]
    }'::jsonb,
    'daniel-agrees-inspection',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви пояснили не лише незручність, а й потенційний ризик.",
      "feedbackIncorrect":"Скажіть, що вода поруч із light fitting і це може бути небезпечно."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"explain urgency and risk",
      "skill":"problem_solving"
    }'::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-agrees-inspection', 11, 'dialogue', 'Daniel',
    'I agree, we shouldn''t leave that. I can get the contractor to inspect the roof properly, but the earliest appointment I can get is Friday afternoon.',
    null,
    '[]'::jsonb,
    null,
    'negotiate-time',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"neutral"
    }'::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'negotiate-time', 12, 'input', 'Daniel',
    'Friday afternoon is difficult because you will be at work.',
    'Поясніть, що ви працюєте в п’ятницю вдень, і попросіть організувати ранок або ранній вечір.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I''ll be at work on Friday afternoon. Would it be possible to arrange either a morning appointment or something in the early evening?",
        "Friday afternoon is difficult for me because I''ll be working. Could the contractor come in the morning or after work instead?",
        "I won''t be home on Friday afternoon. Is there any chance we could arrange a morning or early evening appointment?"
      ]
    }'::jsonb,
    'daniel-offers-time',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви не просто відмовилися від часу, а запропонували дві альтернативи.",
      "feedbackIncorrect":"Поясніть, чому Friday afternoon не підходить, і запропонуйте morning або early evening."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"negotiate a repair time"
    }'::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'daniel-offers-time', 13, 'dialogue', 'Daniel',
    'I''ve just checked. He can come at 8:30 on Friday morning. He''ll inspect the roof and the ceiling, and if he finds the source of the leak, he''ll repair it properly rather than just patching it.',
    null,
    '[]'::jsonb,
    null,
    'confirm-arrangement',
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "emotion":"happy"
    }'::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'confirm-arrangement', 14, 'input', 'Daniel',
    'Confirm the final arrangement.',
    'Підтвердьте час і що цього разу contractor має знайти джерело протічки та зробити повноцінний ремонт.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Great, so he''ll come at 8:30 on Friday morning, inspect where the water is coming from and repair the actual cause of the leak.",
        "Just to confirm, the contractor will be here at 8:30 on Friday and will investigate the source of the leak rather than only patching the ceiling.",
        "That works for me. Friday at 8:30, and this time he''ll check the source properly and carry out a full repair."
      ]
    }'::jsonb,
    'complete',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":25,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви чітко зафіксували і час, і очікуваний результат ремонту.",
      "feedbackIncorrect":"Підтвердьте Friday 8:30 і те, що contractor має знайти source of the leak та зробити proper repair."
    }'::jsonb,
    '{
      "npcId":"london-life-reporting-a-problem-daniel",
      "role":"Landlord",
      "goal":"confirm a repair agreement"
    }'::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Домовленість досягнута! Ви описали повторну проблему, пояснили ризики, послалися на попередній ремонт, відхилили тимчасове рішення та домовилися про повноцінну перевірку й ремонт у конкретний час.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "summary":"Talking to the Landlord completed",
      "learnedWords":[
        "leak",
        "damp patch",
        "dripping",
        "temporary patch",
        "come back",
        "keep an eye on",
        "previous repair",
        "light fitting",
        "electrical risk",
        "contractor",
        "source of the leak",
        "proper repair"
      ]
    }'::jsonb
  );

end $$;