-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #10: Cross-Cultural Conflict
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  select id
  into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-advanced';

  if campaign_uuid is null then
    raise exception 'Campaign london-advanced not found';
  end if;

  select id
  into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'advanced-life';

  if episode_uuid is null then
    raise exception 'Episode advanced-life not found';
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
    'cross-cultural-conflict',
    'Cross-Cultural Conflict',
    'Врегулюйте напруження в міжнародній команді, не зводячи поведінку людей до культурних стереотипів. Відокремлюйте behaviour, interpretation, assumption та impact і створіть робочі правила комунікації.',
    'conversation',
    'C1',
    9,
    25,
    350,
    145,
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
        "campaignSlug": "london-advanced",
        "subtitle": "Resolve international conflict without stereotypes",
        "objectives": [
          "відокремлювати behaviour від interpretation",
          "виявляти assumptions без cultural stereotyping",
          "reframe конфлікт нейтральною мовою",
          "демонструвати perspective-taking",
          "використовувати diplomatic disagreement",
          "clarify communication expectations",
          "перетворювати abstract tension на concrete working agreements",
          "synthesize multiple perspectives"
        ]
      },
      "location": "london-global-operations-room"
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
    'Global Team Conflict',
    'Допоможіть Kenji, Regional Operations Director, розібрати конфлікт між міжнародними командами та створити спільні правила роботи.',
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
    quest_uuid,
    act_uuid,
    'context',
    0,
    'narration',
    null,
    $txt$You are supporting a multinational product programme involving teams in London, Tokyo and Berlin.

Over the past six weeks, delivery has slowed and trust between the teams has deteriorated.

Several incidents have contributed:

• A Berlin project lead wrote in a shared channel: “This proposal is not ready. The assumptions are weak and the timeline is unrealistic.”
• Some London colleagues saw the message as direct but useful.
• Several Tokyo colleagues described it privately as unnecessarily confrontational.

Later:

• A Tokyo manager replied to a disputed timeline with: “We may want to reconsider whether the current approach is fully aligned with the original expectations.”
• The Berlin team interpreted that message as vague and assumed there was no serious objection.
• The Tokyo team believed they had clearly signalled that the plan should not proceed.

Another problem followed:

• London managers often resolve issues informally in live calls and document decisions afterwards.
• Tokyo colleagues have asked for more written preparation before meetings.
• Berlin colleagues complain that too much preparation slows decisions.

No team agrees on the cause of the conflict.

Some people have started using statements such as:
“That's just how they communicate.”
“They avoid saying what they really mean.”
“They are always too aggressive.”
“They need to adapt to our way of working.”

Kenji, Regional Operations Director, has brought you into a meeting.

Your goal is not to decide which national communication style is correct.

Your goal is to identify observable behaviour, separate it from interpretation, surface conflicting expectations and create practical working agreements.$txt$,
    null,
    '[]'::jsonb,
    null,
    'kenji-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London Global Operations Room","emotion":"focused"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-opening',
    1,
    'dialogue',
    'Kenji',
    $txt$Before we discuss solutions, tell me what you think is actually happening here. And please be careful not to explain the problem with national stereotypes.$txt$,
    null,
    '[]'::jsonb,
    null,
    'diagnose-conflict',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diagnose-conflict',
    2,
    'input',
    'Kenji',
    $txt$Diagnose the conflict using observable behaviour and competing interpretations, not national labels.$txt$,
    $txt$C1: behaviour → interpretation → expectation → impact. Avoid “Germans are direct” or “Japanese people are indirect”. $txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The conflict appears to come from different expectations about how disagreement should be expressed and how decisions should be confirmed. The observable behaviours are quite specific: some messages are very explicit, others signal disagreement indirectly, and teams rely on different amounts of written preparation. The problem is that each group is interpreting unfamiliar behaviour through its own expectations.",
        "I would describe this as a coordination and interpretation problem rather than a cultural personality problem. People are using different signals for disagreement, urgency and commitment. Because those signals are not shared, one person's attempt to be clear is interpreted as aggressive, while another person's attempt to be diplomatic is interpreted as agreement."
      ]
    }
    $json$::jsonb,
    'kenji-example',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви описали mechanism конфлікту без cultural stereotypes.",
      "feedbackIncorrect": "Не пояснюйте проблему через nationality. Назвіть конкретну behaviour, interpretation та expectation."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "diagnose conflict without stereotyping",
      "skill": "behavioural-analysis",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-example',
    3,
    'dialogue',
    'Kenji',
    $txt$Let's take the Berlin message: “This proposal is not ready. The assumptions are weak and the timeline is unrealistic.” Some people call that aggressive. Is “aggressive” a fact?$txt$,
    null,
    '[]'::jsonb,
    null,
    'separate-observation',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'separate-observation',
    4,
    'input',
    'Kenji',
    $txt$Separate the observable message from the interpretation and explain why that distinction matters.$txt$,
    $txt$Use neutral language. “Aggressive” is an interpretation unless you specify the behaviour that created that impression.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The observable fact is that the message directly rejected the proposal and described the assumptions and timeline negatively. “Aggressive” is an interpretation of that wording and tone. The distinction matters because we can discuss specific language and its impact, whereas arguing about whether someone is an aggressive person quickly becomes personal and defensive.",
        "We can say the message used explicit negative judgements such as “weak” and “unrealistic”. We cannot treat “aggressive” as an objective fact. If we separate those things, we can ask whether that wording is effective for this team without assigning motives or personality traits."
      ]
    }
    $json$::jsonb,
    'kenji-indirect',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви відокремили observation від interpretation.",
      "feedbackIncorrect": "Назвіть конкретне observable wording. Не подавайте “aggressive” як neutral fact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "separate observation from interpretation",
      "skill": "precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-indirect',
    5,
    'dialogue',
    'Kenji',
    $txt$Now the other example. The Tokyo manager said, “We may want to reconsider whether the current approach is fully aligned with the original expectations.” Berlin interpreted that as a minor concern. Tokyo believed it was a clear objection. Who is at fault?$txt$,
    null,
    '[]'::jsonb,
    null,
    'perspective-taking',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'perspective-taking',
    6,
    'input',
    'Kenji',
    $txt$Explain both interpretations fairly and identify the coordination failure.$txt$,
    $txt$Не шукайте винного. Show how the same sentence can produce two reasonable readings under different expectations.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I do not think fault is the most useful frame. The Tokyo manager may have intended the sentence as a serious objection expressed diplomatically, while the Berlin team may reasonably have read the hedging as uncertainty rather than a stop signal. The coordination failure is that the team has no shared convention for signalling whether a concern is optional, significant or blocking.",
        "Both interpretations make sense given different expectations. One side used softened language to communicate serious disagreement, while the other side treated softened language as evidence that the concern was not decisive. The practical problem is the absence of an explicit severity signal."
      ]
    }
    $json$::jsonb,
    'kenji-stereotype',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви показали обидві перспективи без призначення культурної вини.",
      "feedbackIncorrect": "Не вирішуйте, хто “правильно” комунікував. Поясніть обидва readings і shared coordination gap."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "represent competing perspectives fairly",
      "skill": "perspective-taking",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-stereotype',
    7,
    'dialogue',
    'Kenji',
    $txt$A London manager says, “We are wasting time. Everyone knows some cultures are more direct and others are more indirect. Why can't we just acknowledge that and move on?” How would you respond?$txt$,
    null,
    '[]'::jsonb,
    null,
    'challenge-stereotype',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'challenge-stereotype',
    8,
    'input',
    'Kenji',
    $txt$Challenge the stereotype diplomatically without denying that communication patterns can differ.$txt$,
    $txt$C1 nuance: cultural patterns may inform hypotheses, but they should not become explanations for individuals.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Cultural patterns can be useful as hypotheses, but they become risky when we use them to predict individuals or excuse poor coordination. We already have enough concrete evidence to discuss the actual behaviours in this team. I would rather agree on explicit working norms than assume every colleague communicates according to a national pattern.",
        "I would not say cultural differences are irrelevant. They may help explain why certain communication choices feel natural to different people. But they should not replace direct evidence. The better question is what this team needs in order to recognise disagreement, urgency and commitment consistently."
      ]
    }
    $json$::jsonb,
    'team-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви не заперечили cultural context, але не перетворили його на stereotype.",
      "feedbackIncorrect": "Не кажіть, що culture either explains everything or means nothing. Дайте calibrated response."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "challenge stereotypes with nuance",
      "skill": "nuanced-disagreement",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'team-choice',
    9,
    'choice',
    'Kenji',
    $txt$Which team rule would best reduce ambiguity without forcing everyone to use exactly the same personal communication style?$txt$,
    $txt$Choose the rule that standardises the meaning of critical signals rather than standardising personality.$txt$,
    $json$
    [
      {
        "id": "signals",
        "text": "Keep individual communication styles, but use explicit labels for decision status: concern, recommendation, blocking issue, and final decision.",
        "value": "signals"
      },
      {
        "id": "direct",
        "text": "Require everyone to communicate directly and avoid hedging so messages cannot be misunderstood.",
        "value": "direct"
      },
      {
        "id": "local",
        "text": "Let each office keep its own communication norms and ask other teams to adapt when they work with them.",
        "value": "local"
      }
    ]
    $json$::jsonb,
    '{"optionId":"signals"}'::jsonb,
    'kenji-meetings',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Ми standardise critical signals, а не personalities.",
      "feedbackIncorrect": "Сильне правило має зменшувати ambiguity без вимоги однакового стилю від усіх."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "choose a practical coordination norm",
      "skill": "team-design",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-meetings',
    10,
    'dialogue',
    'Kenji',
    $txt$There is also disagreement about meetings. Some people want written preparation. Others want faster live discussion. If we choose one approach, someone will feel disadvantaged. What would you propose?$txt$,
    null,
    '[]'::jsonb,
    null,
    'design-process',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'design-process',
    11,
    'input',
    'Kenji',
    $txt$Design a process that balances preparation, speed and clarity instead of simply choosing one team's preference.$txt$,
    $txt$Strong answer = hybrid process + purpose of each step + clear decision capture.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would use a short written pre-read for decisions that affect multiple offices, followed by a live discussion focused on unresolved points. We should then record the final decision, owner and any remaining objections immediately after the meeting. That gives people time to prepare without turning every discussion into a long documentation exercise.",
        "A hybrid process would be more effective than choosing one style. For significant decisions, circulate the key question and relevant evidence in advance, use the meeting for debate, and finish with an explicit written summary of what was decided and what remains open."
      ]
    }
    $json$::jsonb,
    'kenji-resistance',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви перетворили competing preferences на workable process.",
      "feedbackIncorrect": "Не обирайте просто “more meetings” або “more documents”. Побудуйте hybrid workflow."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "design a hybrid communication process",
      "skill": "process-design",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-resistance',
    12,
    'dialogue',
    'Kenji',
    $txt$One manager pushes back: “This is all process. The real problem is that some people are simply too sensitive and others are too blunt.” How do you move the conversation forward without becoming defensive?$txt$,
    null,
    '[]'::jsonb,
    null,
    'reframe-personality',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-personality',
    13,
    'input',
    'Kenji',
    $txt$Reframe the personality argument into something observable and manageable.$txt$,
    $txt$Avoid agreeing with labels like “too sensitive” or “too blunt”. Translate them into behaviour and impact.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "There may be genuine differences in tolerance for direct language, but labels such as “too sensitive” and “too blunt” do not tell us what to change. We can be more specific: certain wording is being interpreted as personal criticism, while softened objections are being missed. Those are communication outcomes we can design around.",
        "I would move away from personality labels. The manageable issue is that some messages create more interpersonal friction than intended, while some objections are not being recognised as objections. We can address both problems through clearer signals and agreed feedback norms."
      ]
    }
    $json$::jsonb,
    'kenji-final',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви reframed personality conflict into observable team behaviour.",
      "feedbackIncorrect": "Не сперечайтеся про те, хто sensitive або blunt. Перекладіть labels у concrete behaviour та impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "reframe personality labels into behaviour",
      "skill": "conflict-reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'kenji-final',
    14,
    'input',
    'Kenji',
    $txt$Summarise the working agreement you would recommend to all three teams. It needs to be practical enough that people can use it next week.$txt$,
    $txt$Final C1 synthesis: problem diagnosis + communication rules + meeting process + review mechanism. Keep it executive and concrete.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I would recommend four agreements. First, distinguish clearly between a concern, a recommendation and a blocking issue. Second, describe problems in behavioural terms rather than using personality or cultural labels. Third, use a short written pre-read for significant cross-office decisions, followed by live discussion and an explicit written decision record. Finally, review the process after a month and adjust it based on where misunderstandings are still occurring.",
        "The teams do not need identical communication styles, but they do need shared signals. I would define explicit levels of disagreement, require important decisions to end with a documented owner and status, and use advance context for complex meetings. I would also ask managers to challenge stereotypes when they appear and review the agreement after several weeks using real examples of what is or is not working."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 70,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна synthesis: shared signals, practical process і review mechanism.",
      "feedbackIncorrect": "Фінал має дати конкретний working agreement, а не лише загальні слова про respect."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-cross-cultural-conflict-kenji",
      "role": "Regional Operations Director",
      "goal": "synthesize a practical cross-cultural working agreement",
      "skill": "executive-synthesis",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 15 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'complete',
    15,
    'completion',
    null,
    $txt$Cross-Cultural Conflict завершено. Ви відокремлювали observable behaviour від interpretation, уникали cultural stereotypes, представляли кілька perspectives чесно, reframed personality conflict і створили конкретні правила міжнародної командної роботи.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "observable behaviour",
        "shared expectation",
        "communication norm",
        "blocking issue",
        "severity signal",
        "written pre-read",
        "decision record",
        "cultural stereotype",
        "working agreement",
        "to surface an assumption"
      ]
    }
    $json$::jsonb
  );

end $$;