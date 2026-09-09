-- TalkHero C2 / Mission 5: Diplomatic Reception
-- Additive seed. Does not delete or overwrite existing quest scenes/progress.

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  select id into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-mastery';

  if campaign_uuid is null then
    raise exception 'Campaign london-mastery not found';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'mastery-and-influence';

  if episode_uuid is null then
    raise exception 'Episode mastery-and-influence not found';
  end if;

  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'diplomatic-reception';

  if quest_uuid is not null then
    raise exception 'Quest diplomatic-reception already exists; refusing to overwrite existing content or progress';
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
    'diplomatic-reception',
    'Diplomatic Reception',
    'Ведіть дипломатичну розмову рівня C2: читайте підтекст, працюйте з understatement, непрямими запереченнями, register shifts, ambiguity та subtle persuasion.',
    'conversation',
    'C2',
    4,
    24,
    480,
    200,
    'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $qjson${"adventure":{"campaignSlug":"london-mastery","subtitle":"Читайте між рядків","objectives":["розпізнавати дипломатичний підтекст","працювати з understatement","заперечувати без ескалації","уточнювати навмисну неоднозначність","змінювати register відповідно до контексту","просувати домовленість через subtle persuasion"]},"location":"london-diplomatic-reception","difficulty":"C2","premiumMission":true}$qjson$::jsonb
  )
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
    'The Reception',
    'Navigate high-context diplomatic language and secure forward movement without forcing premature commitment.',
    0,
    'published',
    false,
    $qjson${"cefrLevel":"C2","focus":["subtext","understatement","register","ambiguity","subtle persuasion"]}$qjson$::jsonb
  )
  returning id into act_uuid;

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
  -- 0 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'briefing',
    0,
    'narration',
    null,
    $txt$Ви присутні на закритому дипломатичному прийомі в Лондоні як представник міжнародної організації. Ваше завдання — обговорити потенційну спільну ініціативу між кількома партнерами. Формально всі сторони підтримують співпрацю, але одна делегація не хоче публічно брати на себе зобов’язання. У цій місії важливі підтекст, стриманість, точність формулювань і вміння просувати позицію без прямого тиску.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'adrian-opening',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "location": "London Diplomatic Reception"}$qjson$::jsonb
  ),

  -- 1 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-opening',
    1,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$You will hear a great deal of polite language tonight. The difficult part is deciding which parts are genuinely positive and which parts are merely non-committal. Let us start with this: if a delegate says, 'We would certainly be interested in exploring the idea further,' what do you hear?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'read-subtext',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 2 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'read-subtext',
    2,
    'input',
    $txt$Adrian$txt$,
    $txt$Interpret the statement without overreading it. Explain what it signals positively and what it carefully avoids committing to.$txt$,
    $txt$Не сприймайте формальну ввічливість як гарантію підтримки. Покажіть різницю між openness to discussion і actual commitment.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'adrian-understatement',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 45, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "goal": "distinguish polite openness from substantive commitment", "skill": "reading-subtext"}'::jsonb
  ),

  -- 3 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-understatement',
    3,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$Now suppose the same delegate says, 'There may be some practical considerations we would need to reflect on.' In diplomatic language, that can sometimes mean the objections are substantial. How would you respond without forcing them into a public refusal?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'invite-objection',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 4 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'invite-objection',
    4,
    'input',
    $txt$Adrian$txt$,
    $txt$Invite the delegate to clarify their concerns in a way that gives them room to speak candidly without losing face.$txt$,
    $txt$Сформулюйте репліку, яка не каже 'What is your problem?' і не применшує заперечення. Дайте співрозмовнику безпечний простір для конкретизації.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["It would be helpful to understand which practical considerations you see as most significant, so we can assess whether there is scope to address them without asking anyone to move prematurely.", "Perhaps we could look more closely at the concerns behind that reservation. If there are specific implementation issues, it may be possible to deal with those before discussing any formal commitment."]}$qjson$::jsonb,
    'adrian-soft-disagreement',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 45, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "goal": "invite substantive concerns while preserving the counterpart's face", "skill": "face-saving-language"}$qjson$::jsonb
  ),

  -- 5 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-soft-disagreement',
    5,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$Good. The delegate then suggests postponing the entire initiative for a year. You believe that would effectively kill the project, but saying so bluntly would make the room defensive. How do you disagree?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'polite-resistance',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 6 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'polite-resistance',
    6,
    'input',
    $txt$Adrian$txt$,
    $txt$Disagree clearly but diplomatically. Acknowledge the rationale for caution, then explain why a full-year delay would create strategic costs and propose a less absolute alternative.$txt$,
    $txt$Використайте diplomatic softening, але не настільки м’яко, щоб позиція стала незрозумілою.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'adrian-ambiguity',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "goal": "express clear disagreement while preserving cooperation and offering an alternative", "skill": "polite-disagreement"}'::jsonb
  ),

  -- 7 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-ambiguity',
    7,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$Later, another official tells you, 'I think we are broadly aligned.' That sounds encouraging, but the wording is deliberately elastic. Which reply best tests the alignment without making the official feel challenged?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'clarify-alignment',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 8 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'clarify-alignment',
    8,
    'choice',
    $txt$Adrian$txt$,
    $txt$Choose the response that politely converts vague alignment into something more concrete.$txt$,
    $txt$Оберіть варіант, який перевіряє зміст 'broadly aligned', але не ставить співрозмовника в оборонну позицію.$txt$,
    $qjson$[{"id": "a", "text": "Excellent, so we can announce your support tomorrow."}, {"id": "b", "text": "That is encouraging. It may be useful to identify where the alignment is strongest and which points still require further discussion."}, {"id": "c", "text": "Broadly aligned is too vague. I need a clearer answer."}]$qjson$::jsonb,
    $qjson${"optionId": "b"}$qjson$::jsonb,
    'adrian-register-shift',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "exact", "points": 35, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "skill": "clarifying-ambiguity"}$qjson$::jsonb
  ),

  -- 9 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-register-shift',
    9,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$A junior adviser approaches you away from the main group and speaks more openly: 'Off the record, the minister likes the proposal, but the domestic politics are difficult.' Your register can now be less ceremonial, but the information is still sensitive. How would you respond?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'adjust-register',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 10 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adjust-register',
    10,
    'input',
    $txt$Adrian$txt$,
    $txt$Respond in a more natural private register while respecting the sensitivity of the information. Show that you understand the political constraint and explore what kind of support might still be realistic.$txt$,
    $txt$Покажіть register shift: менше церемонності, більше природності, але без фамільярності або необережного використання off-the-record інформації.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'adrian-indirect-pressure',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 55, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "goal": "adapt register while respecting confidentiality and exploring feasible support", "skill": "register-control"}'::jsonb
  ),

  -- 11 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-indirect-pressure',
    11,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$One delegation now says it could support the initiative only if another country moves first. You suspect this is a way of avoiding responsibility while keeping the door open. How do you challenge that condition without accusing them of bad faith?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'challenge-condition',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 12 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'challenge-condition',
    12,
    'input',
    $txt$Adrian$txt$,
    $txt$Question the condition tactfully. Ask whether there is a form of parallel or conditional commitment that would remove the need for one party to move first.$txt$,
    $txt$Не кажіть, що вони 'avoiding responsibility'. Переформулюйте проблему як coordination problem і запропонуйте конструктивний механізм.$txt$,
    $qjson$[]$qjson$::jsonb,
    $qjson${"acceptedAnswers": ["I understand the concern about moving in isolation. Would there be value in exploring a reciprocal arrangement under which several partners confirm their participation at the same point, rather than requiring one to move first?", "Perhaps the issue is less willingness than sequencing. If that is the case, we could consider a conditional commitment that only takes effect once a defined group of partners has agreed."]}$qjson$::jsonb,
    'adrian-final-push',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 50, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "goal": "reframe a delaying condition as a coordination problem and propose reciprocal commitment", "skill": "subtle-persuasion"}$qjson$::jsonb
  ),

  -- 13 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'adrian-final-push',
    13,
    'dialogue',
    $txt$Adrian$txt$,
    $txt$We are nearing the end of the evening. You need to leave the senior delegate with a proposal that is specific enough to create momentum but flexible enough for them to accept without appearing to have made a public concession. What do you say?$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    'closing-proposal',
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser"}$qjson$::jsonb
  ),

  -- 14 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'closing-proposal',
    14,
    'input',
    $txt$Adrian$txt$,
    $txt$Make a concise closing proposal. Preserve ambiguity where useful, but secure a concrete next step, responsible participants and a timeframe for further discussion.$txt$,
    $txt$Фінальна дипломатична репліка має поєднати flexibility і forward movement. Не вимагайте публічного 'yes', але добийтеся конкретного процесу.$txt$,
    $qjson$[]$qjson$::jsonb,
    null,
    'complete',
    $qjson${}$qjson$::jsonb,
    $qjson${"mode": "ai", "points": 65, "allowRetry": true, "maxAttempts": 2, "feedbackCorrect": "Добре: відповідь точна, дипломатична й передає потрібний підтекст без зайвої прямолінійності.", "feedbackIncorrect": "Спробуйте точніше врахувати підтекст, рівень формальності та дипломатичні наслідки формулювання."}$qjson$::jsonb,
    '{"cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2, "npcId": "london-mastery-diplomatic-reception-adrian-vale", "role": "Senior Diplomatic Adviser", "goal": "secure a concrete next step without forcing premature public commitment", "skill": "diplomatic-closing", "learnedWords": ["non-committal", "practical considerations", "scope to address", "broadly aligned", "domestic constraints", "reciprocal arrangement", "conditional commitment", "without prejudice to"]}'::jsonb
  ),

  -- 15 ---------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Місію завершено! Ви пройшли C2-дипломатичну розмову: читали підтекст, працювали з understatement, м’яко заперечували, уточнювали навмисну неоднозначність, змінювали register і просували домовленість без прямого тиску.$txt$,
    null,
    $qjson$[]$qjson$::jsonb,
    null,
    null,
    $qjson${}$qjson$::jsonb,
    $qjson${}$qjson$::jsonb,
    $qjson${"cefrLevel": "C2", "summary": "Diplomatic Reception completed", "skills": ["reading subtext", "face-saving language", "polite disagreement", "clarifying ambiguity", "register control", "subtle persuasion"]}$qjson$::jsonb
  );

end $$;
