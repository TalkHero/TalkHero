-- =========================================================
-- TalkHero: розширена місія Coffee Shop
-- 15 сцен, 9 оцінюваних завдань, 10–12 хвилин.
-- =========================================================

do $$
declare
  quest_uuid uuid;
  act_uuid uuid;
begin
  select q.id
  into quest_uuid
  from public.quests q
  join public.quest_episodes e
    on e.id = q.episode_id
  join public.quest_campaigns c
    on c.id = e.campaign_id
  where c.slug = 'english-basics'
    and e.slug = 'first-contact'
    and q.slug = 'coffee-shop';

  if quest_uuid is null then
    raise exception
      'Не знайдено місію english-basics / first-contact / coffee-shop.';
  end if;

  update public.quests
  set
    title = 'Coffee Shop Mission',
    description = 'Complete a full coffee order: greeting, drink, size, takeaway, payment and goodbye.',
    estimated_minutes = 12,
    xp_reward = 60,
    coin_reward = 20,
    config = jsonb_build_object(
      'version', 2,
      'sceneCount', 15,
      'learningGoals', jsonb_build_array(
        'greeting',
        'polite ordering',
        'drink sizes',
        'takeaway',
        'payment',
        'thanks and goodbye'
      )
    ),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'adventure', 'london-first-day',
      'location', 'coffee-shop',
      'premiumMission', true
    ),
    updated_at = now()
  where id = quest_uuid;

  select id
  into act_uuid
  from public.quest_acts
  where quest_id = quest_uuid
    and act_code = 'main';

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id,
      act_code,
      title,
      description,
      order_index,
      status,
      checkpoint,
      metadata
    )
    values (
      quest_uuid,
      'main',
      'At the coffee shop',
      'Complete a full order from greeting to goodbye.',
      0,
      'published',
      false,
      '{"adventure":"london-first-day"}'::jsonb
    )
    returning id into act_uuid;
  else
    update public.quest_acts
    set
      title = 'At the coffee shop',
      description = 'Complete a full order from greeting to goodbye.',
      status = 'published',
      metadata = coalesce(metadata, '{}'::jsonb)
        || '{"adventure":"london-first-day"}'::jsonb,
      updated_at = now()
    where id = act_uuid;
  end if;

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
  )
  values
  -- 1
  (
    quest_uuid,
    act_uuid,
    'intro',
    0,
    'narration',
    'Емма',
    'Сьогодні ви пройдете повну ситуацію в кав’ярні: привітаєтеся, замовите напій, оберете розмір, уточните формат замовлення, оплатите й попрощаєтеся.',
    null,
    '[]'::jsonb,
    null,
    'barista-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Ваш наставник","avatar":"🙂","emotion":"encouraging"}'::jsonb
  ),

  -- 2
  (
    quest_uuid,
    act_uuid,
    'barista-greeting',
    1,
    'dialogue',
    'Mia',
    'Good morning! Welcome to TalkHero Coffee. What can I get for you?',
    null,
    '[]'::jsonb,
    null,
    'greeting-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Barista","avatar":"☕","emotion":"happy"}'::jsonb
  ),

  -- 3
  (
    quest_uuid,
    act_uuid,
    'greeting-choice',
    2,
    'choice',
    'Mia',
    'Choose the most natural greeting.',
    'Що ви скажете спочатку?',
    '[
      {"id":"morning","text":"Good morning!","value":"morning"},
      {"id":"night","text":"Good night!","value":"night"},
      {"id":"bye","text":"Goodbye!","value":"bye"}
    ]'::jsonb,
    '{"optionId":"morning"}'::jsonb,
    'drink-translate',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово! Це природне ранкове привітання.",
      "feedbackIncorrect":"Оберіть привітання, яке використовують уранці."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"greeting"}'::jsonb
  ),

  -- 4
  (
    quest_uuid,
    act_uuid,
    'drink-translate',
    3,
    'translate',
    'Емма',
    'Я хотів би капучино, будь ласка.',
    'Перекладіть фразу англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "I would like a cappuccino please",
        "I would like a cappuccino, please",
        "I''d like a cappuccino please",
        "I''d like a cappuccino, please",
        "Can I have a cappuccino please",
        "Can I have a cappuccino, please"
      ]
    }'::jsonb,
    'size-dialogue',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Відмінно! Це ввічливе й природне замовлення.",
      "feedbackIncorrect":"Спробуйте конструкцію: I''d like a cappuccino, please."
    }'::jsonb,
    '{"role":"Ваш наставник","avatar":"🙂","goal":"polite ordering"}'::jsonb
  ),

  -- 5
  (
    quest_uuid,
    act_uuid,
    'size-dialogue',
    4,
    'dialogue',
    'Mia',
    'Of course. Would you like a small, medium or large cappuccino?',
    null,
    '[]'::jsonb,
    null,
    'size-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  ),

  -- 6
  (
    quest_uuid,
    act_uuid,
    'size-choice',
    5,
    'choice',
    'Mia',
    'Choose a complete and polite answer.',
    'Яку відповідь оберете?',
    '[
      {"id":"medium","text":"A medium one, please.","value":"medium"},
      {"id":"medium-word","text":"Medium.","value":"medium-word"},
      {"id":"unrelated","text":"I have a reservation.","value":"unrelated"}
    ]'::jsonb,
    '{"optionId":"medium"}'::jsonb,
    'milk-input',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно — повна відповідь звучить ввічливо.",
      "feedbackIncorrect":"Оберіть повну відповідь із please."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"drink sizes"}'::jsonb
  ),

  -- 7
  (
    quest_uuid,
    act_uuid,
    'milk-input',
    6,
    'input',
    'Mia',
    'Would you like regular milk or oat milk?',
    'Напишіть, що ви хочете звичайне молоко.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "Regular milk please",
        "Regular milk, please",
        "I would like regular milk",
        "I''d like regular milk",
        "Regular milk"
      ]
    }'::jsonb,
    'extra-dialogue',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре! Бариста зрозуміє ваш вибір.",
      "feedbackIncorrect":"Спробуйте: Regular milk, please."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"preferences"}'::jsonb
  ),

  -- 8
  (
    quest_uuid,
    act_uuid,
    'extra-dialogue',
    7,
    'dialogue',
    'Mia',
    'Would you like anything else? We have croissants and muffins.',
    null,
    '[]'::jsonb,
    null,
    'extra-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  ),

  -- 9
  (
    quest_uuid,
    act_uuid,
    'extra-choice',
    8,
    'choice',
    'Mia',
    'Choose the reply that politely declines.',
    'Що ви скажете, якщо більше нічого не потрібно?',
    '[
      {"id":"no-thanks","text":"No, thank you. That''s all.","value":"no-thanks"},
      {"id":"yes","text":"Yes, I am a hotel.","value":"yes"},
      {"id":"bye","text":"Platform two, please.","value":"bye"}
    ]'::jsonb,
    '{"optionId":"no-thanks"}'::jsonb,
    'takeaway-translate',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово! Так природно завершують замовлення.",
      "feedbackIncorrect":"Оберіть ввічливу відмову."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"declining politely"}'::jsonb
  ),

  -- 10
  (
    quest_uuid,
    act_uuid,
    'takeaway-translate',
    9,
    'translate',
    'Емма',
    'З собою, будь ласка.',
    'Перекладіть фразу англійською.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "To go please",
        "To go, please",
        "For takeaway please",
        "For takeaway, please",
        "Takeaway please",
        "Takeaway, please"
      ]
    }'::jsonb,
    'payment-dialogue',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно! У Британії часто кажуть takeaway.",
      "feedbackIncorrect":"Спробуйте: To go, please."
    }'::jsonb,
    '{"role":"Ваш наставник","avatar":"🙂","goal":"takeaway"}'::jsonb
  ),

  -- 11
  (
    quest_uuid,
    act_uuid,
    'payment-dialogue',
    10,
    'dialogue',
    'Mia',
    'That will be four pounds fifty. Would you like to pay by cash or card?',
    null,
    '[]'::jsonb,
    null,
    'payment-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Barista","avatar":"☕"}'::jsonb
  ),

  -- 12
  (
    quest_uuid,
    act_uuid,
    'payment-choice',
    11,
    'choice',
    'Mia',
    'Choose the correct payment response.',
    'Ви хочете оплатити карткою.',
    '[
      {"id":"card","text":"By card, please.","value":"card"},
      {"id":"cash","text":"A large platform, please.","value":"cash"},
      {"id":"room","text":"My room is on the third floor.","value":"room"}
    ]'::jsonb,
    '{"optionId":"card"}'::jsonb,
    'receipt-input',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно — коротко й природно.",
      "feedbackIncorrect":"Оберіть відповідь про оплату карткою."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"payment"}'::jsonb
  ),

  -- 13
  (
    quest_uuid,
    act_uuid,
    'receipt-input',
    12,
    'input',
    'Mia',
    'Would you like a receipt?',
    'Напишіть ввічливу відповідь, що чек вам не потрібен.',
    '[]'::jsonb,
    '{
      "acceptedAnswers":[
        "No thank you",
        "No, thank you",
        "No thanks",
        "No, thanks",
        "I don''t need a receipt thank you",
        "I do not need a receipt thank you"
      ]
    }'::jsonb,
    'goodbye-choice',
    '{}'::jsonb,
    '{
      "mode":"case_insensitive",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово! Це ввічлива відповідь.",
      "feedbackIncorrect":"Спробуйте: No, thank you."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"receipt"}'::jsonb
  ),

  -- 14
  (
    quest_uuid,
    act_uuid,
    'goodbye-choice',
    13,
    'choice',
    'Mia',
    'Your cappuccino is ready. Have a lovely day!',
    'Як природно завершити розмову?',
    '[
      {"id":"thanks-bye","text":"Thank you! Have a nice day!","value":"thanks-bye"},
      {"id":"hello","text":"Good morning!","value":"hello"},
      {"id":"ticket","text":"Which platform do I need?","value":"ticket"}
    ]'::jsonb,
    '{"optionId":"thanks-bye"}'::jsonb,
    'summary',
    '{}'::jsonb,
    '{
      "mode":"exact",
      "points":10,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Ідеальне завершення розмови!",
      "feedbackIncorrect":"Оберіть подяку та прощання."
    }'::jsonb,
    '{"role":"Barista","avatar":"☕","goal":"thanks and goodbye"}'::jsonb
  ),

  -- 15
  (
    quest_uuid,
    act_uuid,
    'summary',
    14,
    'completion',
    'Емма',
    'Ви пройшли повну ситуацію в кав’ярні: привіталися, замовили капучино, обрали розмір і молоко, відмовилися від десерту, попросили напій із собою, оплатили карткою та попрощалися.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{
      "role":"Ваш наставник",
      "avatar":"🎉",
      "emotion":"celebrating",
      "learnedWords":[
        "cappuccino",
        "medium",
        "regular milk",
        "takeaway",
        "cash",
        "card",
        "receipt"
      ]
    }'::jsonb
  );
end $$;
