-- TalkHero C2 / Mission 4: Crisis Management
-- Additive seed: existing quests and progress are not deleted.
do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  select id into campaign_uuid from public.quest_campaigns
  where slug = 'london-mastery';
  if campaign_uuid is null then
    raise exception 'Campaign london-mastery not found';
  end if;
  select id into episode_uuid from public.quest_episodes
  where campaign_id = campaign_uuid and slug = 'mastery-and-influence';
  if episode_uuid is null then
    raise exception 'Episode mastery-and-influence not found';
  end if;
  select id into quest_uuid from public.quests
  where episode_id = episode_uuid and slug = 'crisis-management';
  if quest_uuid is not null then
    raise exception 'Quest crisis-management already exists; refusing to overwrite existing content or progress';
  end if;
  insert into public.quests (
    episode_id, slug, title, description, quest_type, cefr_level,
    order_index, estimated_minutes, xp_reward, coin_reward,
    status, config, metadata
  ) values (
    episode_uuid, 'crisis-management', 'Crisis Management',
    'Керуйте кризовою нарадою за неповних даних: визначайте пріоритети, калібруйте впевненість, координуйте рішення та переглядайте оцінку відповідно до нових доказів.',
    'conversation', 'C2', 3, 25, 460, 190, 'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $qjson${"adventure":{"campaignSlug":"london-mastery","subtitle":"Рішення під тиском","objectives":["відокремлювати підтверджені факти від припущень","визначати пріоритети та критерії ескалації","ухвалювати пропорційні рішення за невизначеності","координувати експертів і відповідальних","переглядати оцінку за новими доказами","готувати точний executive briefing"]},"location":"london-crisis-operations-room","difficulty":"C2","premiumMission":true}$qjson$::jsonb
  ) returning id into quest_uuid;
  insert into public.quest_acts (
    quest_id, act_code, title, description, order_index,
    status, checkpoint, metadata
  ) values (
    quest_uuid, 'main', 'Crisis Operations Room',
    'Coordinate an evidence-led response to a developing incident.',
    0, 'published', false,
    $qjson${"cefrLevel":"C2","focus":["calibrated certainty","prioritisation","contingency planning","executive governance","synthesis"]}$qjson$::jsonb
  ) returning id into act_uuid;
  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type, speaker,
    content, prompt, options, expected_answer, next_scene_code,
    branching, evaluation_config, metadata
  ) values
  -- 0 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'briefing',
    0,
    'narration',
    null,
    $txt$Ви очолюєте кризову нараду технологічної компанії. Уранці команда виявила можливий несанкціонований доступ до частини клієнтських даних. Масштаб інциденту ще не встановлено. Сервіс працює, але окремі системи можуть бути скомпрометовані. Потрібно захистити користувачів, зберегти докази, координувати фахівців і повідомляти лише перевірену інформацію. Ви не повинні вигадувати факти або обіцяти результат, який ще не можете гарантувати.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'leila-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "location": "London Crisis Operations Room"}$qjson$::jsonb
  ),

  -- 1 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-opening',
    1,
    'dialogue',
    $txt$Leila$txt$,
    $txt$We have indications of unauthorised access, but we do not yet know whether customer records were actually extracted. The technical team wants another hour to investigate. Operations is asking whether we should take the affected service offline. What is your immediate priority?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'establish-priorities',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 2 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'establish-priorities',
    2,
    'input',
    $txt$Leila$txt$,
    $txt$Set the immediate priorities without treating unconfirmed data extraction as established fact. Address containment, evidence preservation, customer protection and a clear decision-making structure.$txt$,
    $txt$Сформулюйте пріоритети у правильній послідовності. Відокремте підтверджений доступ від непідтвердженого витоку та визначте, хто ухвалює рішення.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'leila-conflicting-signals',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "goal": "establish proportionate containment, evidence preservation and accountable coordination without overstating the facts", "skill": "crisis-prioritisation"}'::jsonb
  ),

  -- 3 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-conflicting-signals',
    3,
    'dialogue',
    $txt$Leila$txt$,
    $txt$Security believes the suspicious activity has stopped. A separate monitoring team is still seeing unusual traffic, although it may be unrelated. The operations director says the situation is under control. Would you be comfortable using that phrase?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'calibrate-certainty',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 4 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'calibrate-certainty',
    4,
    'input',
    $txt$Leila$txt$,
    $txt$Explain why 'under control' may be premature. State what is known, what remains uncertain and what would justify a stronger assessment.$txt$,
    $txt$Дайте коротке управлінське формулювання з calibrated certainty. Не плутайте відсутність нових підтверджених доказів із доказом відсутності ризику.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["We have contained the activity identified so far, but I would not describe the incident as fully under control while the additional traffic remains unexplained. We need to establish whether it is related and confirm that the affected access paths are secure before making that claim.", "The evidence supports saying that the known activity has been contained, not that the wider risk has been eliminated. I would want the remaining indicators investigated and the containment measures independently verified."]}$qjson$::jsonb,
    'leila-service-decision',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 45, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "goal": "distinguish confirmed containment from unresolved indicators and define evidence needed for a stronger claim", "skill": "calibrated-certainty"}$qjson$::jsonb
  ),

  -- 5 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-service-decision',
    5,
    'dialogue',
    $txt$Leila$txt$,
    $txt$Taking the service offline would reduce some immediate exposure, but it would also disrupt thousands of customers. Keeping it running may preserve continuity, yet could leave us exposed if the compromise is wider than we think. We need a decision now.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'proportionate-decision',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 6 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'proportionate-decision',
    6,
    'input',
    $txt$Leila$txt$,
    $txt$Make a proportionate decision framework rather than choosing blindly between total shutdown and doing nothing. Explain what would trigger isolation, what limited measures could be taken immediately and who must reassess the decision.$txt$,
    $txt$Запропонуйте умовне рішення: негайні обмеження ризику, критерії повного відключення, відповідальний за рішення та час повторної оцінки. Не вигадуйте технічних гарантій.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'leila-communication-pressure',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "goal": "define a proportionate containment decision with explicit escalation triggers and reassessment", "skill": "contingency-planning"}'::jsonb
  ),

  -- 7 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-communication-pressure',
    7,
    'dialogue',
    $txt$Leila$txt$,
    $txt$Communications has drafted a statement saying, 'No customer data has been compromised.' Legal has objected because the investigation is incomplete. Which wording should we approve?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'statement-choice',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 8 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'statement-choice',
    8,
    'choice',
    $txt$Leila$txt$,
    $txt$Choose the statement that is transparent, accurate and does not create false reassurance.$txt$,
    $txt$Оберіть формулювання, яке повідомляє підтверджені факти, визнає невизначеність і обіцяє конкретне оновлення, а не гарантований результат.$txt$,
    $qjson$[{"id": "a", "text": "We can confirm that no customer data has been compromised and there is no further risk."}, {"id": "b", "text": "We are investigating unauthorised access to part of our systems. We have taken containment measures, are assessing whether customer data was affected, and will provide a further update as soon as verified information is available."}, {"id": "c", "text": "We are aware of an issue and have no further comment until the investigation is complete."}]$qjson$::jsonb,
    $qjson${"optionId": "b"}$qjson$::jsonb,
    'leila-accountability',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "exact", "points": 35, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "skill": "risk-communication"}$qjson$::jsonb
  ),

  -- 9 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-accountability',
    9,
    'dialogue',
    $txt$Leila$txt$,
    $txt$The chief executive wants a single person to own the response. Security, legal, operations and communications all have legitimate responsibilities, but their recommendations may conflict. How do we avoid either paralysis or one person overruling specialist advice?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'decision-governance',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 10 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'decision-governance',
    10,
    'input',
    $txt$Leila$txt$,
    $txt$Design a concise decision-making structure. Distinguish specialist recommendations from executive accountability, specify escalation of disagreements and establish a shared record of decisions.$txt$,
    $txt$Поясніть, як поєднати єдину відповідальність із незалежною експертною оцінкою. Додайте механізм ескалації та фіксації рішень.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'leila-new-evidence',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "goal": "establish accountable crisis governance without suppressing specialist disagreement", "skill": "executive-governance"}'::jsonb
  ),

  -- 11 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-new-evidence',
    11,
    'dialogue',
    $txt$Leila$txt$,
    $txt$We now have evidence that a limited set of customer records may have been accessed, but the number and contents are still being verified. The initial assumption that the incident was confined to one system is also in doubt. What changes in your response?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'revise-assumptions',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 12 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'revise-assumptions',
    12,
    'input',
    $txt$Leila$txt$,
    $txt$Revise the response in light of the new evidence. Explain what must be reassessed, how customer protection and applicable notification obligations should be considered, and why the earlier assessment must not be defended merely because it was already communicated.$txt$,
    $txt$Покажіть здатність змінити позицію без втрати довіри. Не вигадуйте юридичних строків або конкретного масштабу витоку.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["The new evidence changes our working assessment, so we should reassess the scope of containment, prioritise protection of potentially affected customers and have legal determine the applicable notification obligations. We should also correct any earlier statement that is no longer supported rather than defend it for the sake of consistency.", "We need to update the incident assessment, verify which records may have been affected and review whether additional containment or customer protection is required. Legal should assess the relevant notification requirements, and our communications must reflect the new evidence without presenting preliminary findings as final."]}$qjson$::jsonb,
    'leila-final-brief',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "goal": "revise the response transparently as evidence changes, including reassessment of scope, protection and applicable notification duties", "skill": "evidence-led-revision"}$qjson$::jsonb
  ),

  -- 13 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'leila-final-brief',
    13,
    'dialogue',
    $txt$Leila$txt$,
    $txt$The board is joining in two minutes. Give me a briefing they can act on: what we know, what we do not know, what we have done, the decisions still required and when they should expect the next update.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'executive-briefing',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response"}$qjson$::jsonb
  ),

  -- 14 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'executive-briefing',
    14,
    'input',
    $txt$Leila$txt$,
    $txt$Deliver a concise executive briefing. Separate confirmed facts, unresolved questions, actions taken, outstanding decisions, accountable owners and the next review point. Do not invent figures or claim the incident is resolved.$txt$,
    $txt$Побудуйте фінальний briefing у логічній послідовності. Важливі точність, пріоритети, відповідальність і чіткі наступні кроки.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 65, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, доречна до ситуації та зберігає необхідний рівень обережності.", "feedbackIncorrect": "Уточніть позицію, врахуйте обмеження ситуації та сформулюйте конкретну дію без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-crisis-management-leila-morgan", "role": "Director of Crisis Response", "goal": "deliver an actionable executive crisis briefing that distinguishes evidence, uncertainty, decisions and ownership", "skill": "executive-synthesis", "learnedWords": ["working assessment", "containment measures", "false reassurance", "escalation trigger", "evidence preservation", "applicable notification obligations", "reassess the scope", "accountable owner"]}'::jsonb
  ),

  -- 15 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Місію завершено! Ви провели кризову нараду C2-рівня: розмежовували факти й припущення, ухвалювали пропорційні рішення, координували відповідальних, переглядали оцінку за новими доказами та підготували точний executive briefing.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "summary": "Crisis Management completed", "skills": ["calibrated certainty", "crisis prioritisation", "contingency planning", "risk communication", "executive governance", "evidence-led revision"]}$qjson$::jsonb
  );
end $$;
