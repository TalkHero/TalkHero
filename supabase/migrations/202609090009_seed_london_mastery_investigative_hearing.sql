-- TalkHero C2 / Mission 7: Investigative Hearing
-- Additive seed. Existing quest scenes and progress are not overwritten.
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
  where episode_id = episode_uuid and slug = 'investigative-hearing';
  if quest_uuid is not null then
    raise exception 'Quest investigative-hearing already exists; refusing to overwrite existing content or progress';
  end if;
  insert into public.quests (
    episode_id, slug, title, description, quest_type, cefr_level,
    order_index, estimated_minutes, xp_reward, coin_reward,
    status, config, metadata
  ) values (
    episode_uuid, 'investigative-hearing', 'Investigative Hearing',
    'Давайте свідчення на незалежному слуханні: розмежовуйте факти й висновки, працюйте із суперечливими доказами, визнавайте відповідальність і виправляйте протокол.',
    'conversation', 'C2', 6, 26, 520, 220, 'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $qjson${"adventure":{"campaignSlug":"london-mastery","subtitle":"Точність під перехресним допитом","objectives":["розмежовувати факти та висновки","узгоджувати суперечливі докази","правильно застосовувати burden of proof","визнавати обґрунтовану відповідальність","виправляти протокол за новими доказами","формулювати точні фінальні свідчення"]},"location":"london-independent-inquiry","difficulty":"C2","premiumMission":true}$qjson$::jsonb
  ) returning id into quest_uuid;
  insert into public.quest_acts (
    quest_id, act_code, title, description, order_index,
    status, checkpoint, metadata
  ) values (
    quest_uuid, 'main', 'The Hearing',
    'Give evidence under sustained scrutiny without speculation or evasion.',
    0, 'published', false,
    $qjson${"cefrLevel":"C2","focus":["evidential precision","contradiction handling","burden of proof","accountability","correcting the record"]}$qjson$::jsonb
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
    $txt$Ви даєте свідчення незалежній комісії, яка розслідує збій у системі міського транспорту. Ви керували програмою модернізації, але не відповідали особисто за кожне технічне рішення. Частина документів суперечить попереднім публічним заявам. Ваше завдання — відповідати точно, визнавати обґрунтовані помилки, не перекладати відповідальність і не робити висновків, яких не підтверджують докази.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'nathan-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "location": "London Independent Inquiry"}$qjson$::jsonb
  ),

  -- 1 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-opening',
    1,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$You previously told the public that the programme was on schedule. Internal correspondence from the same week described several unresolved risks. Were you misleading the public?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'distinguish-record',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 2 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'distinguish-record',
    2,
    'input',
    $txt$Nathan Cole$txt$,
    $txt$Answer the allegation directly. Distinguish what the schedule statement meant, what the internal correspondence established and what you can or cannot conclude about whether the public was misled.$txt$,
    $txt$Не ухиляйтеся від запитання. Відокремте зміст заяви, відомі на той час ризики та висновок про її точність. Не вигадуйте власних спогадів чи документів.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'nathan-contradiction',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "goal": "address an apparent contradiction directly without inventing facts or denying legitimate scrutiny", "skill": "fact-inference-distinction"}'::jsonb
  ),

  -- 3 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-contradiction',
    3,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$The minutes record you saying, 'The remaining issues are manageable.' A later technical report calls one of those issues a potential single point of failure. How do you reconcile those statements?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'reconcile-evidence',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 4 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reconcile-evidence',
    4,
    'input',
    $txt$Nathan Cole$txt$,
    $txt$Explain how the two statements might be reconciled, while acknowledging that the evidence may also reveal an earlier underestimate of the risk.$txt$,
    $txt$Сформулюйте відповідь без вигаданої хронології. Визнайте можливість помилкової оцінки та поясніть, які документи потрібні для остаточного висновку.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["The statements are not necessarily inconsistent, because a risk can be considered manageable while still having serious consequences if controls fail. However, I cannot establish from those quotations alone whether our assessment was justified. We would need to examine the controls, the information available at the time and the subsequent technical findings. If the risk was underestimated, that should be acknowledged.", "There may be a distinction between identifying a serious risk and judging that it can be managed, but I would not rely on that distinction to dismiss the concern. The underlying assessments and contemporaneous evidence need to be reviewed before I can say whether the earlier judgement was reasonable."]}$qjson$::jsonb,
    'nathan-burden',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 45, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "goal": "reconcile apparently conflicting evidence without manufacturing an explanation", "skill": "contradiction-handling"}$qjson$::jsonb
  ),

  -- 5 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-burden',
    5,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$You have said there is no evidence that senior management deliberately concealed the risk. Are you asking this committee to conclude that no concealment occurred?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'burden-of-proof',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 6 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'burden-of-proof',
    6,
    'input',
    $txt$Nathan Cole$txt$,
    $txt$Clarify the difference between an absence of evidence, evidence of absence and a positive finding. Explain what conclusion the available record can support without shifting the burden unfairly.$txt$,
    $txt$Покажіть epistemic precision: 'not established' не означає 'disproved'. Не вимагайте, щоб комісія прийняла вашу версію без перевірки.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'nathan-document-gap',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "goal": "distinguish absence of evidence from evidence of absence and state a properly qualified conclusion", "skill": "burden-of-proof"}'::jsonb
  ),

  -- 7 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-document-gap',
    7,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$A key meeting has no complete minutes. One witness recalls a warning being raised; another does not. Which statement would be most appropriate for the official record?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'record-choice',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 8 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'record-choice',
    8,
    'choice',
    $txt$Nathan Cole$txt$,
    $txt$Choose the statement that accurately reflects the evidential uncertainty.$txt$,
    $txt$Оберіть відповідь, яка не перетворює неповні свідчення на встановлений факт і не відкидає їх без підстав.$txt$,
    $qjson$[{"id": "a", "text": "The warning was definitely raised, because one witness remembers it."}, {"id": "b", "text": "The available accounts differ, and the incomplete minutes do not resolve the discrepancy. The committee should examine any additional contemporaneous evidence before reaching a finding."}, {"id": "c", "text": "There is no reliable evidence of a warning, so the matter can be dismissed."}]$qjson$::jsonb,
    $qjson${"optionId": "b"}$qjson$::jsonb,
    'nathan-responsibility',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "exact", "points": 35, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "skill": "evidential-precision"}$qjson$::jsonb
  ),

  -- 9 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-responsibility',
    9,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$You were the programme director. Even if you did not make the technical decision, surely you must accept responsibility for the failure. Are you prepared to do so?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'strategic-concession',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 10 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'strategic-concession',
    10,
    'input',
    $txt$Nathan Cole$txt$,
    $txt$Acknowledge appropriate leadership responsibility without accepting unestablished personal culpability for every technical decision. Explain the distinction between accountability, causation and individual fault.$txt$,
    $txt$Дайте пряму відповідь, визнайте обґрунтовану відповідальність і не використовуйте розподіл ролей як спосіб уникнути accountability.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'nathan-new-evidence',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "goal": "accept appropriate leadership accountability while distinguishing it from unestablished individual fault", "skill": "strategic-concession"}'::jsonb
  ),

  -- 11 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-new-evidence',
    11,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$A newly disclosed email shows that you were copied into a warning about the same risk two days before your public statement. You previously said you were not aware of any such warning. Does that change your evidence?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'correct-record',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 12 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'correct-record',
    12,
    'input',
    $txt$Nathan Cole$txt$,
    $txt$Correct the record transparently. Distinguish being copied into an email from having read or understood it, but do not use that distinction to dismiss the new evidence.$txt$,
    $txt$Не вигадуйте, що ви точно прочитали або не прочитали лист. Визнайте, що попередня категорична заява потребує виправлення, і запропонуйте перевірити факти.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["Yes. My earlier statement was too categorical and should be corrected. The email establishes that I was copied into the warning, although that alone does not establish whether I read or understood it at the time. I would want the relevant records examined before making a further claim, and I accept that the distinction does not remove the need to account for how the warning was handled.", "That evidence requires me to qualify my previous answer. I can no longer say that there was no warning brought to my attention in the documentary record. Whether I actually read it or appreciated its significance is a separate question that I should not answer from speculation."]}$qjson$::jsonb,
    'nathan-final-testimony',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "goal": "correct an earlier statement in light of new evidence without inventing recollection or evading accountability", "skill": "correcting-the-record"}$qjson$::jsonb
  ),

  -- 13 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'nathan-final-testimony',
    13,
    'dialogue',
    $txt$Nathan Cole$txt$,
    $txt$For the record, please summarise what you accept, what remains disputed, what further evidence is needed and what lessons the organisation should draw. Keep your answer concise and do not prejudge the committee's findings.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'final-testimony',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel"}$qjson$::jsonb
  ),

  -- 14 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-testimony',
    14,
    'input',
    $txt$Nathan Cole$txt$,
    $txt$Deliver a concise final testimony. Separate established facts, acknowledged shortcomings, unresolved questions, evidence needed and proportionate organisational lessons. Avoid unsupported conclusions about intent or individual guilt.$txt$,
    $txt$Підсумуйте свідчення у формі, придатній для офіційного протоколу. Не вигадуйте фактів і не підміняйте висновки комісії власними припущеннями.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 65, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, аргументована й не виходить за межі наявних доказів.", "feedbackIncorrect": "Відокремте факти від висновків, визнайте обмеження доказів і дайте пряму відповідь без необґрунтованих припущень."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-investigative-hearing-nathan-cole", "role": "Lead Investigative Counsel", "goal": "deliver a balanced final testimony distinguishing established facts, accountability, uncertainty and lessons", "skill": "final-testimony", "learnedWords": ["contemporaneous evidence", "apparent contradiction", "single point of failure", "burden of proof", "absence of evidence", "evidential uncertainty", "correct the record", "unestablished culpability"]}'::jsonb
  ),

  -- 15 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Місію завершено! Ви пройшли C2-слухання: розмежовували факти й висновки, працювали із суперечливими свідченнями, визнавали відповідальність, виправляли протокол і формулювали обережні, але змістовні висновки.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "summary": "Investigative Hearing completed", "skills": ["evidential precision", "contradiction handling", "burden of proof", "strategic concession", "correcting the record", "final testimony"]}$qjson$::jsonb
  );
end $$;
