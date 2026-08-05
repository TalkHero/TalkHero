-- TalkHero RC-02: Clothes Shop
do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  select id into campaign_uuid from public.quest_campaigns
  where slug='english-basics' and status='published';
  if campaign_uuid is null then raise exception 'Campaign not found: english-basics'; end if;

  select id into episode_uuid from public.quest_episodes
  where campaign_id=campaign_uuid and slug='first-contact' and status='published';
  if episode_uuid is null then raise exception 'Episode not found: first-contact'; end if;

  select id into quest_uuid from public.quests
  where episode_id=episode_uuid and slug='clothes-shop';

  if quest_uuid is null then
    insert into public.quests (
      episode_id,slug,title,description,quest_type,cefr_level,order_index,
      estimated_minutes,xp_reward,coin_reward,status,config,metadata
    ) values (
      episode_uuid,'clothes-shop','At the Clothes Shop','Find a T-shirt, ask for the right size and colour, try it on and pay.',
      'conversation','A1',10,
      10,70,24,
      'published','{"version":1,"sceneCount":18,"staticTest":true,"generated":true}'::jsonb,'{"templateCategory":"shopping","staticTest":true,"staticQuest":true,"generatedBy":"TalkHero Quest Authoring System v1","adventure":"london-first-day","location":"clothes-shop"}'::jsonb
    ) returning id into quest_uuid;
  else
    update public.quests set
      title='At the Clothes Shop',description='Find a T-shirt, ask for the right size and colour, try it on and pay.',
      quest_type='conversation',cefr_level='A1',
      order_index=10,estimated_minutes=10,
      xp_reward=70,coin_reward=24,status='published',
      config='{"version":1,"sceneCount":18,"staticTest":true,"generated":true}'::jsonb,metadata=coalesce(metadata,'{}'::jsonb)||'{"templateCategory":"shopping","staticTest":true,"staticQuest":true,"generatedBy":"TalkHero Quest Authoring System v1","adventure":"london-first-day","location":"clothes-shop"}'::jsonb,updated_at=now()
    where id=quest_uuid;
  end if;

  select id into act_uuid from public.quest_acts
  where quest_id=quest_uuid and act_code='main';

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id,act_code,title,description,order_index,status,checkpoint,metadata
    ) values (
      quest_uuid,'main','Shopping for clothes',
      'Choose an item, try it on and complete the purchase.',0,'published',false,'{"generated":true}'::jsonb
    ) returning id into act_uuid;
  else
    update public.quest_acts set
      title='Shopping for clothes',description='Choose an item, try it on and complete the purchase.',
      status='published',updated_at=now()
    where id=act_uuid;
  end if;

  delete from public.quest_scenes where quest_id=quest_uuid;

  insert into public.quest_scenes (
    quest_id,act_id,scene_code,order_index,scene_type,speaker,content,prompt,
    options,expected_answer,next_scene_code,branching,evaluation_config,metadata
  ) values
  (
    quest_uuid, act_uuid, 'intro', 0, 'narration',
    'Емма', 'Ви зайшли до магазину одягу. Потрібно знайти футболку, попросити потрібний розмір і колір, приміряти її та оплатити покупку.', null,
    '[]'::jsonb, null,
    'assistant-greeting', '{}'::jsonb, '{}'::jsonb, '{"role":"Ваш наставник","avatar":"🙂","emotion":"encouraging"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'assistant-greeting', 1, 'dialogue',
    'Chloe', 'Hello! Can I help you find something?', null,
    '[]'::jsonb, null,
    'looking-choice', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕","emotion":"friendly"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'looking-choice', 2, 'choice',
    'Chloe', 'Choose the correct response.', 'Ви шукаєте футболку.',
    '[{"id":"tshirt","text":"Yes, I''m looking for a T-shirt.","value":"tshirt"},{"id":"ticket","text":"I need a return ticket.","value":"ticket"},{"id":"medicine","text":"I have a headache.","value":"medicine"}]'::jsonb, '{"optionId":"tshirt"}'::jsonb,
    'colour-dialogue', '{}'::jsonb, '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно! Ви чітко пояснили, що шукаєте.","feedbackIncorrect":"Оберіть фразу про футболку."}'::jsonb, '{"role":"Sales assistant","avatar":"👕","goal":"state what you are looking for"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'colour-dialogue', 3, 'dialogue',
    'Chloe', 'Of course. What colour would you like?', null,
    '[]'::jsonb, null,
    'colour-input', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'colour-input', 4, 'input',
    'Chloe', 'What colour would you like?', 'Напишіть, що ви хотіли б синю футболку.',
    '[]'::jsonb, '{"acceptedAnswers":["I would like a blue T-shirt","I''d like a blue T-shirt","A blue T-shirt please","A blue T-shirt, please"]}'::jsonb,
    'size-dialogue', '{}'::jsonb, '{"mode":"case_insensitive","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Чудово! Ви правильно назвали колір.","feedbackIncorrect":"Спробуйте: I''d like a blue T-shirt."}'::jsonb, '{"role":"Sales assistant","avatar":"👕","goal":"choose a colour"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'size-dialogue', 5, 'dialogue',
    'Chloe', 'What size do you need?', null,
    '[]'::jsonb, null,
    'size-choice', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'size-choice', 6, 'choice',
    'Chloe', 'Choose the correct answer.', 'Вам потрібен середній розмір.',
    '[{"id":"medium","text":"Medium, please.","value":"medium"},{"id":"platform","text":"Platform five, please.","value":"platform"},{"id":"prescription","text":"Do I need a prescription?","value":"prescription"}]'::jsonb, '{"optionId":"medium"}'::jsonb,
    'stock-dialogue', '{}'::jsonb, '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно — medium означає середній розмір.","feedbackIncorrect":"Оберіть Medium, please."}'::jsonb, '{"role":"Sales assistant","avatar":"👕","goal":"choose a size"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'stock-dialogue', 7, 'dialogue',
    'Chloe', 'Here you are. This one is medium.', null,
    '[]'::jsonb, null,
    'try-on-translate', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'try-on-translate', 8, 'translate',
    'Емма', 'Чи можу я це приміряти?', 'Перекладіть англійською.',
    '[]'::jsonb, '{"acceptedAnswers":["Can I try it on","Can I try it on?","Could I try it on","Could I try it on?"]}'::jsonb,
    'fitting-room-dialogue', '{}'::jsonb, '{"mode":"case_insensitive","points":15,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Відмінно! Це природне питання в магазині одягу.","feedbackIncorrect":"Спробуйте: Can I try it on?"}'::jsonb, '{"role":"Ваш наставник","avatar":"🙂","goal":"ask to try on clothes"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'fitting-room-dialogue', 9, 'dialogue',
    'Chloe', 'Certainly. The fitting room is over there, next to the mirrors.', null,
    '[]'::jsonb, null,
    'fitting-room-choice', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'fitting-room-choice', 10, 'choice',
    'Chloe', 'Where is the fitting room?', 'Оберіть правильну відповідь.',
    '[{"id":"mirrors","text":"Next to the mirrors.","value":"mirrors"},{"id":"checkout","text":"At the checkout.","value":"checkout"},{"id":"entrance","text":"Outside the entrance.","value":"entrance"}]'::jsonb, '{"optionId":"mirrors"}'::jsonb,
    'fit-dialogue', '{}'::jsonb, '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Так, примірочна знаходиться біля дзеркал.","feedbackIncorrect":"Оберіть Next to the mirrors."}'::jsonb, '{"role":"Sales assistant","avatar":"👕","goal":"understand fitting room location"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'fit-dialogue', 11, 'dialogue',
    'Chloe', 'How does it fit?', null,
    '[]'::jsonb, null,
    'fit-input', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'fit-input', 12, 'input',
    'Chloe', 'How does it fit?', 'Напишіть, що футболка трохи завелика.',
    '[]'::jsonb, '{"acceptedAnswers":["It is a little too big","It''s a little too big","It is slightly too big","It''s slightly too big"]}'::jsonb,
    'smaller-dialogue', '{}'::jsonb, '{"mode":"case_insensitive","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Добре! Ви правильно описали посадку одягу.","feedbackIncorrect":"Спробуйте: It''s a little too big."}'::jsonb, '{"role":"Sales assistant","avatar":"👕","goal":"describe the fit"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'smaller-dialogue', 13, 'dialogue',
    'Chloe', 'No problem. I can bring you a small one.', null,
    '[]'::jsonb, null,
    'buy-translate', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'buy-translate', 14, 'translate',
    'Емма', 'Я візьму її.', 'Перекладіть англійською.',
    '[]'::jsonb, '{"acceptedAnswers":["I will take it","I''ll take it"]}'::jsonb,
    'payment-dialogue', '{}'::jsonb, '{"mode":"case_insensitive","points":15,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно! I''ll take it означає, що ви вирішили купити товар.","feedbackIncorrect":"Спробуйте: I''ll take it."}'::jsonb, '{"role":"Ваш наставник","avatar":"🙂","goal":"confirm the purchase"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'payment-dialogue', 15, 'dialogue',
    'Chloe', 'Great. That will be twenty pounds. Cash or card?', null,
    '[]'::jsonb, null,
    'payment-choice', '{}'::jsonb, '{}'::jsonb, '{"role":"Sales assistant","avatar":"👕"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'payment-choice', 16, 'choice',
    'Chloe', 'Choose your payment method.', 'Ви платите карткою.',
    '[{"id":"card","text":"By card, please.","value":"card"},{"id":"fitting","text":"Where is the fitting room?","value":"fitting"},{"id":"size","text":"Do you have this in medium?","value":"size"}]'::jsonb, '{"optionId":"card"}'::jsonb,
    'summary', '{}'::jsonb, '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Чудово! Ви обрали оплату карткою.","feedbackIncorrect":"Оберіть By card, please."}'::jsonb, '{"role":"Sales assistant","avatar":"👕","goal":"pay for the item"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'summary', 17, 'completion',
    'Емма', 'Ви знайшли футболку, обрали колір і розмір, приміряли її, попросили менший розмір та оплатили покупку.', null,
    '[]'::jsonb, null,
    null, '{}'::jsonb, '{}'::jsonb, '{"role":"Ваш наставник","avatar":"🎉","emotion":"celebrating","learnedWords":["T-shirt","size","medium","small","fitting room","try on","too big","I''ll take it","receipt"]}'::jsonb
  );
end $$;
