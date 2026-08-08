-- =========================================================
-- TalkHero Campaign #2
-- London Life -> Everyday Life -> Renting a Flat
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  insert into public.quest_campaigns (
    slug,
    title,
    description,
    cefr_level,
    status,
    order_index,
    metadata
  ) values (
    'london-life',
    'Життя в Лондоні',
    'Практикуйте англійську в реальних ситуаціях повсякденного життя в Лондоні.',
    'A2',
    'published',
    1,
    '{
      "adventure": {
        "location": "Лондон, Велика Британія",
        "subtitle": "Повсякденне життя"
      }
    }'::jsonb
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
    'everyday-life',
    'Повсякденне життя',
    'Навчіться вирішувати типові побутові ситуації англійською.',
    0,
    'published',
    '{
      "adventure": {
        "subtitle": "Життя у великому місті"
      }
    }'::jsonb
  )
  on conflict (campaign_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into episode_uuid;

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
    'renting-a-flat',
    'Renting a Flat',
    'Поговоріть з агентом, уточніть деталі квартири та домовтеся про перегляд.',
    'conversation',
    'A2',
    0,
    10,
    80,
    30,
    'published',
    '{"version":1}'::jsonb,
    '{
      "adventure": {
        "campaignSlug": "london-life",
        "subtitle": "Оренда квартири",
        "objectives": [
          "привітатися та пояснити, що ви шукаєте квартиру",
          "запитати про орендну плату",
          "уточнити, чи включені комунальні послуги",
          "домовитися про перегляд квартири"
        ]
      }
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
    'At the Estate Agency',
    'Поговоріть з агентом з нерухомості про оренду квартири.',
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
  (
    quest_uuid,
    act_uuid,
    'welcome',
    0,
    'narration',
    null,
    'Ви зайшли до агентства нерухомості в Лондоні. Вам потрібно знайти квартиру для оренди.',
    null,
    '[]'::jsonb,
    null,
    'agent-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Estate Agency"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'agent-greeting',
    1,
    'dialogue',
    'Sophie',
    'Good afternoon! How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'explain-goal',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'explain-goal',
    2,
    'choice',
    'Sophie',
    'Tell Sophie why you are here.',
    'What is the best answer?',
    '[{"id":"rent","text":"I''m looking for a flat to rent.","value":"rent"},{"id":"hotel","text":"I''d like to book a hotel room.","value":"hotel"},{"id":"coffee","text":"Can I have a coffee, please?","value":"coffee"}]'::jsonb,
    '{"optionId":"rent"}'::jsonb,
    'flat-details',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Exactly. You clearly explained what you need.","feedbackIncorrect":"Choose the sentence about renting a flat."}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'flat-details',
    3,
    'dialogue',
    'Sophie',
    'Of course. I have a one-bedroom flat in Camden. It is £1,450 per month.',
    null,
    '[]'::jsonb,
    null,
    'rent-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'rent-question',
    4,
    'input',
    'Sophie',
    'You want to confirm the monthly rent.',
    'Ask how much the rent is per month.',
    '[]'::jsonb,
    '{"acceptedAnswers":["How much is the rent per month?","How much is the rent?","What is the monthly rent?","What''s the monthly rent?"]}'::jsonb,
    'rent-answer',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":20,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Good question. That sounds natural.","feedbackIncorrect":"Try asking: How much is the rent per month?"}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'rent-answer',
    5,
    'dialogue',
    'Sophie',
    'The rent is £1,450 per month. The council tax is not included.',
    null,
    '[]'::jsonb,
    null,
    'bills-question',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'bills-question',
    6,
    'choice',
    'Sophie',
    'You also want to know about the bills.',
    'Which question should you ask?',
    '[{"id":"bills","text":"Are the bills included?","value":"bills"},{"id":"weather","text":"Is it raining today?","value":"weather"},{"id":"name","text":"What is your name?","value":"name"}]'::jsonb,
    '{"optionId":"bills"}'::jsonb,
    'bills-answer',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Correct. That is an important question when renting.","feedbackIncorrect":"Ask about the bills included with the rent."}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'bills-answer',
    7,
    'dialogue',
    'Sophie',
    'Water is included, but electricity, gas and council tax are separate.',
    null,
    '[]'::jsonb,
    null,
    'viewing-intro',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'viewing-intro',
    8,
    'dialogue',
    'Sophie',
    'Would you like to arrange a viewing?',
    null,
    '[]'::jsonb,
    null,
    'viewing-answer',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'viewing-answer',
    9,
    'input',
    'Sophie',
    'You want to see the flat tomorrow.',
    'Ask if you can view the flat tomorrow.',
    '[]'::jsonb,
    '{"acceptedAnswers":["Can I view the flat tomorrow?","Could I view the flat tomorrow?","Can I see the flat tomorrow?","Could I see the flat tomorrow?"]}'::jsonb,
    'viewing-time',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":20,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Excellent. Polite and clear.","feedbackIncorrect":"Try: Can I view the flat tomorrow?"}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'viewing-time',
    10,
    'dialogue',
    'Sophie',
    'Certainly. I have an appointment available at 4 p.m. tomorrow.',
    null,
    '[]'::jsonb,
    null,
    'confirm-time',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'confirm-time',
    11,
    'choice',
    'Sophie',
    'Confirm the appointment.',
    'What should you say?',
    '[{"id":"confirm","text":"Yes, 4 p.m. works for me.","value":"confirm"},{"id":"cancel","text":"I don''t want a flat.","value":"cancel"},{"id":"breakfast","text":"I usually have breakfast at eight.","value":"breakfast"}]'::jsonb,
    '{"optionId":"confirm"}'::jsonb,
    'address',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Great. The viewing is arranged.","feedbackIncorrect":"Choose the answer that confirms the appointment."}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'address',
    12,
    'dialogue',
    'Sophie',
    'Perfect. The flat is on Kentish Town Road. I will email you the full address.',
    null,
    '[]'::jsonb,
    null,
    'thank-you',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'thank-you',
    13,
    'input',
    'Sophie',
    'Finish the conversation politely.',
    'Thank Sophie for her help.',
    '[]'::jsonb,
    '{"acceptedAnswers":["Thank you for your help.","Thanks for your help.","Thank you very much.","Thanks very much."]}'::jsonb,
    'goodbye',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":20,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Perfect. Friendly and polite.","feedbackIncorrect":"Try: Thank you for your help."}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'goodbye',
    14,
    'dialogue',
    'Sophie',
    'You are very welcome. See you tomorrow at 4 p.m. Good luck with your flat search!',
    null,
    '[]'::jsonb,
    null,
    'complete',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Estate Agent","avatar":"🏠"}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    'Місію завершено! Ви домовилися про перегляд квартири в Лондоні.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"summary":"Renting a Flat completed"}'::jsonb
  );

end $$;