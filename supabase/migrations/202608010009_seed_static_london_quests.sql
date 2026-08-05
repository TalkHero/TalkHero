-- =========================================================
-- TalkHero: статичні тестові місії London Adventure
-- 3 місії × 15 сцен; без AI evaluation.
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
  where slug = 'english-basics';

  if campaign_uuid is null then
    raise exception 'Не знайдено кампанію english-basics.';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'first-contact';

  if episode_uuid is null then
    raise exception 'Не знайдено епізод first-contact.';
  end if;

  -- -------------------------------------------------------
  -- London Underground
  -- -------------------------------------------------------
  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'underground';

  if quest_uuid is null then
    insert into public.quests (
      episode_id, slug, title, description, quest_type,
      cefr_level, order_index, estimated_minutes,
      xp_reward, coin_reward, status, config, metadata
    ) values (
      episode_uuid, 'underground', 'London Underground',
      'Buy a ticket, ask for the correct line and find the right platform.', 'conversation', 'A1',
      1, 10, 55, 18, 'published',
      '{"version":1,"sceneCount":15,"staticTest":true}'::jsonb,
      '{"adventure":"london-first-day","location":"underground","staticQuest":true}'::jsonb
    ) returning id into quest_uuid;
  else
    update public.quests set
      title = 'London Underground',
      description = 'Buy a ticket, ask for the correct line and find the right platform.',
      cefr_level = 'A1',
      estimated_minutes = 10,
      xp_reward = 55,
      coin_reward = 18,
      status = 'published',
      config = '{"version":1,"sceneCount":15,"staticTest":true}'::jsonb,
      metadata = coalesce(metadata, '{}'::jsonb) || '{"adventure":"london-first-day","location":"underground","staticQuest":true}'::jsonb,
      updated_at = now()
    where id = quest_uuid;
  end if;

  select id into act_uuid
  from public.quest_acts
  where quest_id = quest_uuid and act_code = 'main';

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id, act_code, title, description, order_index,
      status, checkpoint, metadata
    ) values (
      quest_uuid, 'main', 'At the Underground station',
      'Buy a ticket and find the correct route.', 0, 'published', false,
      '{"staticTest":true}'::jsonb
    ) returning id into act_uuid;
  else
    update public.quest_acts set
      title = 'At the Underground station',
      description = 'Buy a ticket and find the correct route.',
      status = 'published',
      updated_at = now()
    where id = act_uuid;
  end if;

  delete from public.quest_scenes where quest_id = quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type,
    speaker, content, prompt, options, expected_answer,
    next_scene_code, branching, evaluation_config, metadata
  ) values
  (
    quest_uuid, act_uuid, 'intro', 0, 'narration',
    'Емма',
    'Ви на станції лондонського метро. Ваше завдання — купити квиток, уточнити маршрут і знайти правильну платформу.',
    null,
    '[]'::jsonb,
    null,
    'staff-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "emotion": "encouraging"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'staff-greeting', 1, 'dialogue',
    'Oliver',
    'Good morning. How can I help you?',
    null,
    '[]'::jsonb,
    null,
    'destination-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "emotion": "neutral"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'destination-choice', 2, 'choice',
    'Oliver',
    'Choose the correct way to say where you want to go.',
    'Ви хочете дістатися Oxford Circus.',
    '[{"id": "oxford", "text": "I need to get to Oxford Circus.", "value": "oxford"}, {"id": "hotel", "text": "I have a hotel reservation.", "value": "hotel"}, {"id": "coffee", "text": "I''d like a cappuccino.", "value": "coffee"}]'::jsonb,
    '{"optionId": "oxford"}'::jsonb,
    'ticket-translate',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно! Ви чітко назвали пункт призначення.", "feedbackIncorrect": "Оберіть фразу про поїздку до Oxford Circus."}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "goal": "state destination"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'ticket-translate', 3, 'translate',
    'Емма',
    'Один квиток, будь ласка.',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["One ticket please", "One ticket, please", "A ticket please", "A ticket, please"]}'::jsonb,
    'single-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Чудово! Це природний спосіб попросити квиток.", "feedbackIncorrect": "Спробуйте: One ticket, please."}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "goal": "buy a ticket"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'single-dialogue', 4, 'dialogue',
    'Oliver',
    'Single or return?',
    null,
    '[]'::jsonb,
    null,
    'single-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'single-choice', 5, 'choice',
    'Oliver',
    'Choose the answer for a one-way ticket.',
    'Який квиток вам потрібен?',
    '[{"id": "single", "text": "A single, please.", "value": "single"}, {"id": "return", "text": "A return, please.", "value": "return"}, {"id": "room", "text": "A single room, please.", "value": "room"}]'::jsonb,
    '{"optionId": "single"}'::jsonb,
    'payment-input',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно — single означає квиток в один бік.", "feedbackIncorrect": "Оберіть варіант A single, please."}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "goal": "single ticket"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'payment-input', 6, 'input',
    'Oliver',
    'That is three pounds. How would you like to pay?',
    'Напишіть, що ви оплатите карткою.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["By card please", "By card, please", "Card please", "Card, please", "I will pay by card", "I''ll pay by card"]}'::jsonb,
    'route-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре! Відповідь зрозуміла й природна.", "feedbackIncorrect": "Спробуйте: By card, please."}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "goal": "payment"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'route-dialogue', 7, 'dialogue',
    'Oliver',
    'Take the Central line eastbound and change at Tottenham Court Road.',
    null,
    '[]'::jsonb,
    null,
    'line-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'line-choice', 8, 'choice',
    'Oliver',
    'Which line should you take first?',
    'Оберіть правильну лінію.',
    '[{"id": "central", "text": "The Central line.", "value": "central"}, {"id": "district", "text": "The District line.", "value": "district"}, {"id": "piccadilly", "text": "The Piccadilly line.", "value": "piccadilly"}]'::jsonb,
    '{"optionId": "central"}'::jsonb,
    'change-translate',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Так, спочатку потрібна Central line.", "feedbackIncorrect": "Послухайте репліку ще раз: Central line."}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "goal": "identify line"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'change-translate', 9, 'translate',
    'Емма',
    'Де мені потрібно зробити пересадку?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["Where do I need to change", "Where do I need to change?", "Where should I change", "Where should I change?"]}'::jsonb,
    'platform-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 15, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Відмінно! Це корисне питання в метро.", "feedbackIncorrect": "Спробуйте: Where do I need to change?"}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "goal": "ask about transfer"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'platform-dialogue', 10, 'dialogue',
    'Oliver',
    'Use platform four. The next train leaves in three minutes.',
    null,
    '[]'::jsonb,
    null,
    'platform-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'platform-choice', 11, 'choice',
    'Oliver',
    'Choose the correct platform.',
    'На яку платформу потрібно йти?',
    '[{"id": "four", "text": "Platform four.", "value": "four"}, {"id": "three", "text": "Platform three.", "value": "three"}, {"id": "five", "text": "Platform five.", "value": "five"}]'::jsonb,
    '{"optionId": "four"}'::jsonb,
    'thanks-input',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно — platform four.", "feedbackIncorrect": "Оберіть платформу чотири."}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "goal": "find platform"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'thanks-input', 12, 'input',
    'Oliver',
    'Do you need any more help?',
    'Напишіть, що все зрозуміло, і подякуйте.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["No thank you", "No, thank you", "No thanks", "No, thanks", "That''s all thank you", "That is all thank you"]}'::jsonb,
    'final-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Чудово! Ви ввічливо завершили розмову.", "feedbackIncorrect": "Спробуйте: No, thank you."}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "goal": "finish politely"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'final-dialogue', 13, 'dialogue',
    'Oliver',
    'You''re welcome. Have a good journey!',
    null,
    '[]'::jsonb,
    null,
    'summary',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Station assistant", "avatar": "🚇", "emotion": "happy"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'summary', 14, 'completion',
    'Емма',
    'Ви купили квиток, уточнили лінію, місце пересадки та правильну платформу.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🎉", "emotion": "celebrating", "learnedWords": ["single", "return", "line", "change", "platform", "eastbound"]}'::jsonb
  );

  -- -------------------------------------------------------
  -- Hotel Check-in
  -- -------------------------------------------------------
  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'hotel';

  if quest_uuid is null then
    insert into public.quests (
      episode_id, slug, title, description, quest_type,
      cefr_level, order_index, estimated_minutes,
      xp_reward, coin_reward, status, config, metadata
    ) values (
      episode_uuid, 'hotel', 'Hotel Check-in',
      'Confirm a reservation, provide details and ask about hotel services.', 'conversation', 'A1',
      2, 11, 60, 20, 'published',
      '{"version":1,"sceneCount":15,"staticTest":true}'::jsonb,
      '{"adventure":"london-first-day","location":"hotel","staticQuest":true}'::jsonb
    ) returning id into quest_uuid;
  else
    update public.quests set
      title = 'Hotel Check-in',
      description = 'Confirm a reservation, provide details and ask about hotel services.',
      cefr_level = 'A1',
      estimated_minutes = 11,
      xp_reward = 60,
      coin_reward = 20,
      status = 'published',
      config = '{"version":1,"sceneCount":15,"staticTest":true}'::jsonb,
      metadata = coalesce(metadata, '{}'::jsonb) || '{"adventure":"london-first-day","location":"hotel","staticQuest":true}'::jsonb,
      updated_at = now()
    where id = quest_uuid;
  end if;

  select id into act_uuid
  from public.quest_acts
  where quest_id = quest_uuid and act_code = 'main';

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id, act_code, title, description, order_index,
      status, checkpoint, metadata
    ) values (
      quest_uuid, 'main', 'Checking in',
      'Check in and ask useful questions about the hotel.', 0, 'published', false,
      '{"staticTest":true}'::jsonb
    ) returning id into act_uuid;
  else
    update public.quest_acts set
      title = 'Checking in',
      description = 'Check in and ask useful questions about the hotel.',
      status = 'published',
      updated_at = now()
    where id = act_uuid;
  end if;

  delete from public.quest_scenes where quest_id = quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type,
    speaker, content, prompt, options, expected_answer,
    next_scene_code, branching, evaluation_config, metadata
  ) values
  (
    quest_uuid, act_uuid, 'intro', 0, 'narration',
    'Емма',
    'Ви прибули до готелю. Потрібно підтвердити бронювання, отримати ключ і уточнити важливі деталі.',
    null,
    '[]'::jsonb,
    null,
    'reception-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "emotion": "encouraging"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'reception-greeting', 1, 'dialogue',
    'Sophie',
    'Good afternoon. Welcome to the Royal Garden Hotel. How can I help you?',
    null,
    '[]'::jsonb,
    null,
    'reservation-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "emotion": "happy"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'reservation-choice', 2, 'choice',
    'Sophie',
    'Choose the correct check-in phrase.',
    'У вас є бронювання.',
    '[{"id": "reservation", "text": "I have a reservation.", "value": "reservation"}, {"id": "ticket", "text": "I need a train ticket.", "value": "ticket"}, {"id": "coffee", "text": "I''d like a coffee.", "value": "coffee"}]'::jsonb,
    '{"optionId": "reservation"}'::jsonb,
    'name-input',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно! Це стандартна фраза під час заселення.", "feedbackIncorrect": "Оберіть фразу I have a reservation."}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "confirm reservation"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'name-input', 3, 'input',
    'Sophie',
    'What name is the reservation under?',
    'Напишіть: «Бронювання на ім’я Andrey Bardakov».',
    '[]'::jsonb,
    '{"acceptedAnswers": ["The reservation is under Andrey Bardakov", "It is under Andrey Bardakov", "It''s under Andrey Bardakov", "Andrey Bardakov"]}'::jsonb,
    'passport-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре! Адміністратор зможе знайти бронювання.", "feedbackIncorrect": "Спробуйте: The reservation is under Andrey Bardakov."}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "give booking name"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'passport-dialogue', 4, 'dialogue',
    'Sophie',
    'Thank you. May I see your passport, please?',
    null,
    '[]'::jsonb,
    null,
    'passport-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'passport-choice', 5, 'choice',
    'Sophie',
    'Choose the most natural response.',
    'Що ви відповісте?',
    '[{"id": "here", "text": "Of course. Here you are.", "value": "here"}, {"id": "no", "text": "No, I am a platform.", "value": "no"}, {"id": "menu", "text": "Can I see the menu?", "value": "menu"}]'::jsonb,
    '{"optionId": "here"}'::jsonb,
    'nights-translate',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Чудово! Here you are — природна фраза, коли передаєте документ.", "feedbackIncorrect": "Оберіть Of course. Here you are."}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "show passport"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'nights-translate', 6, 'translate',
    'Емма',
    'Я залишаюся на три ночі.',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["I am staying for three nights", "I''m staying for three nights", "I will stay for three nights", "I''ll stay for three nights"]}'::jsonb,
    'room-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 15, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Відмінно! Ви правильно вказали тривалість проживання.", "feedbackIncorrect": "Спробуйте: I''m staying for three nights."}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "goal": "state length of stay"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'room-dialogue', 7, 'dialogue',
    'Sophie',
    'Your room is on the third floor. Breakfast is from seven to ten.',
    null,
    '[]'::jsonb,
    null,
    'breakfast-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'breakfast-choice', 8, 'choice',
    'Sophie',
    'When is breakfast served?',
    'Оберіть правильний час.',
    '[{"id": "seven-ten", "text": "From seven to ten.", "value": "seven-ten"}, {"id": "six-nine", "text": "From six to nine.", "value": "six-nine"}, {"id": "eight-eleven", "text": "From eight to eleven.", "value": "eight-eleven"}]'::jsonb,
    '{"optionId": "seven-ten"}'::jsonb,
    'wifi-input',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Так, сніданок із сьомої до десятої.", "feedbackIncorrect": "Оберіть From seven to ten."}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "understand breakfast time"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'wifi-input', 9, 'input',
    'Sophie',
    'Do you have any questions?',
    'Запитайте пароль від Wi-Fi.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["What is the Wi-Fi password", "What''s the Wi-Fi password", "What is the wifi password", "What''s the wifi password", "Could I have the Wi-Fi password"]}'::jsonb,
    'checkout-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре! Це корисне запитання в готелі.", "feedbackIncorrect": "Спробуйте: What''s the Wi-Fi password?"}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "ask for wifi"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'checkout-dialogue', 10, 'dialogue',
    'Sophie',
    'The password is Royal2026. Check-out is at eleven o''clock.',
    null,
    '[]'::jsonb,
    null,
    'checkout-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'checkout-choice', 11, 'choice',
    'Sophie',
    'What time is check-out?',
    'Оберіть правильну відповідь.',
    '[{"id": "eleven", "text": "At eleven o''clock.", "value": "eleven"}, {"id": "ten", "text": "At ten o''clock.", "value": "ten"}, {"id": "twelve", "text": "At twelve o''clock.", "value": "twelve"}]'::jsonb,
    '{"optionId": "eleven"}'::jsonb,
    'late-translate',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно — check-out об одинадцятій.", "feedbackIncorrect": "Оберіть At eleven o''clock."}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "understand checkout"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'late-translate', 12, 'translate',
    'Емма',
    'Чи можу я виїхати пізніше?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["Can I check out later", "Can I check out later?", "Could I check out later", "Could I check out later?", "Is late check-out possible", "Is late checkout possible"]}'::jsonb,
    'key-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 15, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Чудово! Це природне питання про пізній виїзд.", "feedbackIncorrect": "Спробуйте: Could I check out later?"}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "goal": "ask for late checkout"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'key-dialogue', 13, 'dialogue',
    'Sophie',
    'Late check-out may be available. Please ask tomorrow morning. Here is your key card.',
    null,
    '[]'::jsonb,
    null,
    'thanks-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'thanks-choice', 14, 'choice',
    'Sophie',
    'Choose a polite ending.',
    'Як завершити розмову?',
    '[{"id": "thanks", "text": "Thank you very much.", "value": "thanks"}, {"id": "platform", "text": "Which platform is it?", "value": "platform"}, {"id": "cash", "text": "Cash or card?", "value": "cash"}]'::jsonb,
    '{"optionId": "thanks"}'::jsonb,
    'summary',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Ідеально! Ви ввічливо завершили заселення.", "feedbackIncorrect": "Оберіть Thank you very much."}'::jsonb,
    '{"role": "Receptionist", "avatar": "🏨", "goal": "finish politely"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'summary', 15, 'completion',
    'Емма',
    'Ви підтвердили бронювання, передали паспорт, уточнили сніданок, Wi-Fi та час виїзду.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🎉", "emotion": "celebrating", "learnedWords": ["reservation", "passport", "nights", "breakfast", "Wi-Fi password", "check-out", "key card"]}'::jsonb
  );

  -- -------------------------------------------------------
  -- At the Airport
  -- -------------------------------------------------------
  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'airport';

  if quest_uuid is null then
    insert into public.quests (
      episode_id, slug, title, description, quest_type,
      cefr_level, order_index, estimated_minutes,
      xp_reward, coin_reward, status, config, metadata
    ) values (
      episode_uuid, 'airport', 'At the Airport',
      'Check in for a flight, handle baggage and find the departure gate.', 'conversation', 'A2',
      3, 12, 70, 24, 'published',
      '{"version":1,"sceneCount":15,"staticTest":true}'::jsonb,
      '{"adventure":"london-first-day","location":"airport","staticQuest":true}'::jsonb
    ) returning id into quest_uuid;
  else
    update public.quests set
      title = 'At the Airport',
      description = 'Check in for a flight, handle baggage and find the departure gate.',
      cefr_level = 'A2',
      estimated_minutes = 12,
      xp_reward = 70,
      coin_reward = 24,
      status = 'published',
      config = '{"version":1,"sceneCount":15,"staticTest":true}'::jsonb,
      metadata = coalesce(metadata, '{}'::jsonb) || '{"adventure":"london-first-day","location":"airport","staticQuest":true}'::jsonb,
      updated_at = now()
    where id = quest_uuid;
  end if;

  select id into act_uuid
  from public.quest_acts
  where quest_id = quest_uuid and act_code = 'main';

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id, act_code, title, description, order_index,
      status, checkpoint, metadata
    ) values (
      quest_uuid, 'main', 'Flight check-in',
      'Check in, drop off baggage and find your gate.', 0, 'published', false,
      '{"staticTest":true}'::jsonb
    ) returning id into act_uuid;
  else
    update public.quest_acts set
      title = 'Flight check-in',
      description = 'Check in, drop off baggage and find your gate.',
      status = 'published',
      updated_at = now()
    where id = act_uuid;
  end if;

  delete from public.quest_scenes where quest_id = quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type,
    speaker, content, prompt, options, expected_answer,
    next_scene_code, branching, evaluation_config, metadata
  ) values
  (
    quest_uuid, act_uuid, 'intro', 0, 'narration',
    'Емма',
    'Ви в аеропорту Heathrow. Потрібно зареєструватися на рейс, здати багаж і знайти вихід на посадку.',
    null,
    '[]'::jsonb,
    null,
    'agent-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "emotion": "encouraging"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'agent-greeting', 1, 'dialogue',
    'Daniel',
    'Good morning. May I see your passport and booking confirmation?',
    null,
    '[]'::jsonb,
    null,
    'documents-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "emotion": "neutral"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'documents-choice', 2, 'choice',
    'Daniel',
    'Choose the natural response.',
    'Ви передаєте документи.',
    '[{"id": "documents", "text": "Of course. Here they are.", "value": "documents"}, {"id": "coffee", "text": "A cappuccino, please.", "value": "coffee"}, {"id": "hotel", "text": "I need a single room.", "value": "hotel"}]'::jsonb,
    '{"optionId": "documents"}'::jsonb,
    'destination-input',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно! Here they are використовують для кількох документів.", "feedbackIncorrect": "Оберіть Of course. Here they are."}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "goal": "provide documents"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'destination-input', 3, 'input',
    'Daniel',
    'Where are you flying today?',
    'Напишіть, що ви летите до Нью-Йорка.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["I am flying to New York", "I''m flying to New York", "I fly to New York", "To New York"]}'::jsonb,
    'bags-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре! Пункт призначення названо чітко.", "feedbackIncorrect": "Спробуйте: I''m flying to New York."}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "goal": "state destination"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'bags-dialogue', 4, 'dialogue',
    'Daniel',
    'How many bags are you checking in?',
    null,
    '[]'::jsonb,
    null,
    'bags-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'bags-choice', 5, 'choice',
    'Daniel',
    'Choose the correct answer for one checked bag.',
    'Скільки валіз ви здаєте?',
    '[{"id": "one", "text": "One suitcase.", "value": "one"}, {"id": "two", "text": "Two passports.", "value": "two"}, {"id": "none", "text": "A window seat.", "value": "none"}]'::jsonb,
    '{"optionId": "one"}'::jsonb,
    'weight-dialogue',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно — one suitcase.", "feedbackIncorrect": "Оберіть One suitcase."}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "goal": "state baggage count"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'weight-dialogue', 6, 'dialogue',
    'Daniel',
    'Your bag is two kilograms over the limit. You can remove some items or pay an extra fee.',
    null,
    '[]'::jsonb,
    null,
    'fee-translate',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'fee-translate', 7, 'translate',
    'Емма',
    'Скільки коштує додатковий багаж?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["How much is the extra baggage", "How much is extra baggage", "How much does the extra baggage cost", "How much is the extra fee", "How much does the extra fee cost"]}'::jsonb,
    'fee-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 15, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Відмінно! Ви правильно запитали про вартість.", "feedbackIncorrect": "Спробуйте: How much is the extra baggage?"}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "goal": "ask about baggage fee"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'fee-dialogue', 8, 'dialogue',
    'Daniel',
    'The extra fee is thirty pounds.',
    null,
    '[]'::jsonb,
    null,
    'pay-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'pay-choice', 9, 'choice',
    'Daniel',
    'Choose a polite payment response.',
    'Ви погоджуєтеся оплатити.',
    '[{"id": "pay", "text": "That''s fine. I''ll pay by card.", "value": "pay"}, {"id": "refuse", "text": "I need platform four.", "value": "refuse"}, {"id": "room", "text": "Breakfast is at seven.", "value": "room"}]'::jsonb,
    '{"optionId": "pay"}'::jsonb,
    'seat-input',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре! Ви підтвердили оплату й спосіб платежу.", "feedbackIncorrect": "Оберіть That''s fine. I''ll pay by card."}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "goal": "accept fee"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'seat-input', 10, 'input',
    'Daniel',
    'Would you prefer a window or an aisle seat?',
    'Напишіть, що ви хочете місце біля проходу.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["An aisle seat please", "An aisle seat, please", "I would like an aisle seat", "I''d like an aisle seat", "Aisle please", "Aisle, please"]}'::jsonb,
    'boarding-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Правильно! Aisle seat — місце біля проходу.", "feedbackIncorrect": "Спробуйте: An aisle seat, please."}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "goal": "choose seat"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'boarding-dialogue', 11, 'dialogue',
    'Daniel',
    'Here is your boarding pass. Boarding starts at 14:20 from gate B16.',
    null,
    '[]'::jsonb,
    null,
    'gate-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'gate-choice', 12, 'choice',
    'Daniel',
    'Which gate should you go to?',
    'Оберіть правильний вихід.',
    '[{"id": "b16", "text": "Gate B16.", "value": "b16"}, {"id": "b15", "text": "Gate B15.", "value": "b15"}, {"id": "c16", "text": "Gate C16.", "value": "c16"}]'::jsonb,
    '{"optionId": "b16"}'::jsonb,
    'boarding-translate',
    '{}'::jsonb,
    '{"mode": "exact", "points": 10, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Так, ваш вихід — B16.", "feedbackIncorrect": "Оберіть Gate B16."}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "goal": "identify gate"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'boarding-translate', 13, 'translate',
    'Емма',
    'Коли починається посадка?',
    'Перекладіть англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers": ["When does boarding start", "When does boarding start?", "What time does boarding start", "What time does boarding start?"]}'::jsonb,
    'final-dialogue',
    '{}'::jsonb,
    '{"mode": "case_insensitive", "points": 15, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Чудово! Це важливе питання в аеропорту.", "feedbackIncorrect": "Спробуйте: When does boarding start?"}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🙂", "goal": "ask boarding time"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'final-dialogue', 14, 'dialogue',
    'Daniel',
    'Boarding starts at 14:20. Please be at the gate thirty minutes early. Have a pleasant flight!',
    null,
    '[]'::jsonb,
    null,
    'summary',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Check-in agent", "avatar": "✈️", "emotion": "happy"}'::jsonb
  ),
  (
    quest_uuid, act_uuid, 'summary', 15, 'completion',
    'Емма',
    'Ви зареєструвалися на рейс, здали багаж, оплатили перевищення ваги, обрали місце та знайшли вихід.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role": "Ваш наставник", "avatar": "🎉", "emotion": "celebrating", "learnedWords": ["booking confirmation", "checked baggage", "over the limit", "extra fee", "aisle seat", "boarding pass", "gate"]}'::jsonb
  );

end $$;
