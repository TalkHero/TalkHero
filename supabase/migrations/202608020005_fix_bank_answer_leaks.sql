-- TalkHero curated Bank fix
do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  select id into campaign_uuid
  from public.quest_campaigns
  where slug = 'english-basics'
    and status = 'published';

  if campaign_uuid is null then
    raise exception 'Campaign not found: english-basics';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'first-contact'
    and status = 'published';

  if episode_uuid is null then
    raise exception 'Episode not found: first-contact';
  end if;

  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'bank';

  if quest_uuid is null then
    insert into public.quests (
      episode_id, slug, title, description, quest_type,
      cefr_level, order_index, estimated_minutes,
      xp_reward, coin_reward, status, config, metadata
    ) values (
      episode_uuid, 'bank', 'At the Bank',
      'Exchange money, ask about the rate and fee, provide identification and confirm the transaction.', 'conversation',
      'A2', 6,
      12, 75,
      25, 'published', '{"version":1,"sceneCount":17,"staticTest":true,"generated":false,"curated":true}'::jsonb, '{"templateCategory":"services","staticTest":true,"staticQuest":true,"generatedBy":"TalkHero curated release fix","adventure":"london-first-day","location":"bank"}'::jsonb
    )
    returning id into quest_uuid;
  else
    update public.quests
    set
      title = 'At the Bank',
      description = 'Exchange money, ask about the rate and fee, provide identification and confirm the transaction.',
      quest_type = 'conversation',
      cefr_level = 'A2',
      order_index = 6,
      estimated_minutes = 12,
      xp_reward = 75,
      coin_reward = 25,
      status = 'published',
      config = '{"version":1,"sceneCount":17,"staticTest":true,"generated":false,"curated":true}'::jsonb,
      metadata = coalesce(metadata, '{}'::jsonb) || '{"templateCategory":"services","staticTest":true,"staticQuest":true,"generatedBy":"TalkHero curated release fix","adventure":"london-first-day","location":"bank"}'::jsonb,
      updated_at = now()
    where id = quest_uuid;
  end if;

  select id into act_uuid
from public.quest_acts
where quest_id = quest_uuid
order by order_index
limit 1;

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id, act_code, title, description,
      order_index, status, checkpoint, metadata
    ) values (
      quest_uuid, 'main',
      'Currency Exchange',
      'Complete a simple currency-exchange transaction at a London bank.',
      0, 'published', false, '{"curated":true}'::jsonb
    )
    returning id into act_uuid;
  else
    update public.quest_acts
    set
      title = 'Currency Exchange',
      description = 'Complete a simple currency-exchange transaction at a London bank.',
      status = 'published',
      updated_at = now()
    where id = act_uuid;
  end if;

  delete from public.quest_scenes
  where quest_id = quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type,
    speaker, content, prompt, options, expected_answer,
    next_scene_code, branching, evaluation_config, metadata
  ) values
  (
    quest_uuid,
    act_uuid,
    'intro',
    0,
    'narration',
    'Емма',
    'Ви прийшли до банку, щоб обміняти гроші. Потрібно пояснити мету візиту, уточнити курс і комісію, надати документ та підтвердити операцію.',
    null,
    '[]'::jsonb,
    null,
    'clerk-greeting',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Ваш наставник","avatar":"🙂","emotion":"encouraging","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'clerk-greeting',
    1,
    'dialogue',
    'Olivia',
    'Good afternoon. How can I help you today?',
    null,
    '[]'::jsonb,
    null,
    'state-purpose',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"friendly","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'state-purpose',
    2,
    'choice',
    'Olivia',
    'How can I help you today?',
    'Оберіть фразу про обмін валюти.',
    '[{"id":"exchange","text":"I''d like to exchange some money, please.","value":"exchange"},{"id":"ticket","text":"I''d like a return ticket, please.","value":"ticket"},{"id":"medicine","text":"I''d like some painkillers, please.","value":"medicine"}]'::jsonb,
    '{"optionId":"exchange"}'::jsonb,
    'currency-question',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно! Ви чітко пояснили мету візиту.","feedbackIncorrect":"Оберіть фразу про обмін грошей."}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"state the purpose of the visit","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'currency-question',
    3,
    'dialogue',
    'Olivia',
    'Certainly. Which currency would you like to exchange?',
    null,
    '[]'::jsonb,
    null,
    'currency-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"helpful","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'currency-input',
    4,
    'input',
    'Olivia',
    'Which currency would you like to exchange?',
    'Напишіть англійською, що ви хочете обміняти долари США на фунти.',
    '[]'::jsonb,
    '{"acceptedAnswers":["I''d like to exchange US dollars for pounds","I would like to exchange US dollars for pounds","I''d like to exchange dollars for pounds","I want to exchange US dollars for pounds"]}'::jsonb,
    'amount-question',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":15,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Чудово! Ви правильно назвали обидві валюти.","feedbackIncorrect":"Спробуйте: I''d like to exchange US dollars for pounds."}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"name the currencies","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'amount-question',
    5,
    'dialogue',
    'Olivia',
    'How much would you like to exchange?',
    null,
    '[]'::jsonb,
    null,
    'amount-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'amount-choice',
    6,
    'choice',
    'Olivia',
    'How much would you like to exchange?',
    'Ви хочете обміняти сто доларів.',
    '[{"id":"hundred","text":"One hundred dollars, please.","value":"hundred"},{"id":"platform","text":"Platform four, please.","value":"platform"},{"id":"medium","text":"Medium, please.","value":"medium"}]'::jsonb,
    '{"optionId":"hundred"}'::jsonb,
    'rate-dialogue',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно! Ви назвали потрібну суму.","feedbackIncorrect":"Оберіть One hundred dollars, please."}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"state the amount","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'rate-dialogue',
    7,
    'dialogue',
    'Olivia',
    'Today''s exchange rate is seventy-eight pence for one dollar.',
    null,
    '[]'::jsonb,
    null,
    'rate-translate',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"professional","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'rate-translate',
    8,
    'translate',
    'Емма',
    'Чи можете ви сказати мені обмінний курс?',
    'Перекладіть речення англійською.',
    '[]'::jsonb,
    '{"acceptedAnswers":["Could you tell me the exchange rate","Can you tell me the exchange rate","Could you tell me what the exchange rate is"]}'::jsonb,
    'fee-question',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":15,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Відмінно! Ви правильно запитали про курс.","feedbackIncorrect":"Спробуйте: Could you tell me the exchange rate?"}'::jsonb,
    '{"role":"Ваш наставник","avatar":"🙂","emotion":"encouraging","goal":"ask about the exchange rate","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'fee-question',
    9,
    'dialogue',
    'Olivia',
    'There is also a two-pound service fee.',
    null,
    '[]'::jsonb,
    null,
    'fee-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"professional","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'fee-input',
    10,
    'input',
    'Olivia',
    'Would you like to ask anything about the service fee?',
    'Запитайте англійською, чи є додаткова комісія.',
    '[]'::jsonb,
    '{"acceptedAnswers":["Is there an additional fee","Is there any additional fee","Are there any additional fees","Do I have to pay an additional fee"]}'::jsonb,
    'id-dialogue',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":15,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно! Ви уточнили додаткові витрати.","feedbackIncorrect":"Спробуйте: Is there an additional fee?"}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"ask about fees","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'id-dialogue',
    11,
    'dialogue',
    'Olivia',
    'I need to see some identification before we continue.',
    null,
    '[]'::jsonb,
    null,
    'id-choice',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"professional","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'id-choice',
    12,
    'choice',
    'Olivia',
    'Could I see your identification, please?',
    'Оберіть правильну відповідь.',
    '[{"id":"passport","text":"Of course. Here is my passport.","value":"passport"},{"id":"receipt","text":"Could I have the receipt, please?","value":"receipt"},{"id":"bag","text":"Yes, I''d like a bag, please.","value":"bag"}]'::jsonb,
    '{"optionId":"passport"}'::jsonb,
    'confirmation-dialogue',
    '{}'::jsonb,
    '{"mode":"exact","points":10,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Правильно! Ви надали документ.","feedbackIncorrect":"Оберіть фразу про паспорт."}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"provide identification","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'confirmation-dialogue',
    13,
    'dialogue',
    'Olivia',
    'You will receive seventy-six pounds after the service fee. Would you like to continue?',
    null,
    '[]'::jsonb,
    null,
    'confirm-input',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"professional","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'confirm-input',
    14,
    'input',
    'Olivia',
    'Would you like to continue with the exchange?',
    'Напишіть англійською, що ви хочете продовжити.',
    '[]'::jsonb,
    '{"acceptedAnswers":["Yes, I would like to continue","Yes, I''d like to continue","Yes, I''d like to continue, please","Yes, please"]}'::jsonb,
    'receipt-dialogue',
    '{}'::jsonb,
    '{"mode":"case_insensitive","points":15,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Чудово! Ви підтвердили операцію.","feedbackIncorrect":"Спробуйте: Yes, I''d like to continue, please."}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"neutral","goal":"confirm the transaction","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'receipt-dialogue',
    15,
    'dialogue',
    'Olivia',
    'The transaction is complete. Here is your cash and your receipt.',
    null,
    '[]'::jsonb,
    null,
    'summary',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Bank clerk","avatar":"🏦","emotion":"happy","goal":"","learnedWords":[]}'::jsonb
  ),
  (
    quest_uuid,
    act_uuid,
    'summary',
    16,
    'completion',
    'Емма',
    'Ви обміняли валюту, уточнили курс і комісію, надали документ та підтвердили операцію.',
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"role":"Ваш наставник","avatar":"🎉","emotion":"celebrating","goal":"","learnedWords":["exchange rate","service fee","currency","identification","transaction","receipt"]}'::jsonb
  );
end $$;
