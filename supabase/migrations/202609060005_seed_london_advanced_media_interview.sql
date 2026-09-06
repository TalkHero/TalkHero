-- =========================================================
-- TalkHero
-- C1: London Advanced
-- Mission #5: Media Interview
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
    'media-interview',
    'Media Interview',
    'Пройдіть складне інтерв’ю з журналісткою під публічним тиском: працюйте з loaded questions, false premises, витоками внутрішніх листів, невизначеністю та ризиком сказати більше, ніж підтверджено.',
    'conversation',
    'C1',
    4,
    23,
    300,
    120,
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
        "subtitle": "Public pressure, framing and disciplined communication",
        "objectives": [
          "відрізняти confirmed facts від interpretation",
          "виправляти false premise без конфронтації",
          "відповідати на loaded questions",
          "уникати speculation",
          "bridge back to the key message",
          "визнавати uncertainty без evasiveness",
          "коректно працювати з leaked information",
          "формулювати короткі on-record statements"
        ]
      },
      "location": "london-news-studio"
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
    'The Interview',
    'Дайте публічне інтерв’ю Rachel, Investigative Journalist, не втрачаючи точності, контролю над framing і довіри.',
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
    $txt$Your company is under media scrutiny after a controversial product change. Some users say the change reduced transparency, while the company says it was intended to simplify the service.

No regulatory breach has been confirmed. However, a journalist has obtained part of an internal email in which a senior manager warned that the change could create reputational risk.

You are about to appear in a live interview with Rachel, an investigative journalist known for aggressive follow-up questions.$txt$,
    null,
    '[]'::jsonb,
    null,
    'rachel-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"location":"London News Studio","emotion":"tense"}'::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rachel-opening',
    1,
    'dialogue',
    'Rachel',
    $txt$Your company says this change was about simplification. Critics say it was designed to make important information harder for users to see. Why should anyone believe your version?$txt$,
    null,
    '[]'::jsonb,
    null,
    'opening-response',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'opening-response',
    2,
    'input',
    'Rachel',
    $txt$Answer the question without accepting the premise that the company intentionally hid information. Acknowledge the criticism and state what is actually known.$txt$,
    $txt$Не кажіть просто “that’s not true”. Correct the premise, acknowledge concern, then return to confirmed facts.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I wouldn't accept the assumption that the change was designed to hide information. What I can say is that the stated purpose was to simplify the user experience, and that is the basis on which the change was approved. At the same time, some users clearly feel that important information became less visible, and we have to take that criticism seriously.",
        "I think there are two separate points there. The intention was to simplify the service, and I haven't seen evidence that the purpose was to conceal information. But the user reaction is real, and if the effect was reduced clarity for some people, that deserves examination regardless of the original intention."
      ]
    }
    $json$::jsonb,
    'rachel-loaded',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви виправили premise, але не відмахнулися від legitimate concern.",
      "feedbackIncorrect": "Не приймайте формулювання журналіста як факт. Відокремте intention, evidence та user impact."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "correct a loaded premise without sounding defensive",
      "skill": "media-framing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rachel-loaded',
    3,
    'dialogue',
    'Rachel',
    $txt$But you knew users would be unhappy, didn't you? Internal discussions clearly show that reputational risk was anticipated before launch.$txt$,
    null,
    '[]'::jsonb,
    null,
    'fact-vs-inference',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'fact-vs-inference',
    4,
    'input',
    'Rachel',
    $txt$Distinguish the confirmed fact from Rachel's inference. Do not deny that reputational risk was discussed.$txt$,
    $txt$Ключ: “risk was discussed” ≠ “we knew users would react this way”. Покажіть різницю без evasiveness.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "It's fair to say that reputational risk was discussed. What I would separate from that is the conclusion that we therefore knew how users would respond. Risk discussions are part of normal decision-making precisely because outcomes are uncertain. We anticipated that there could be criticism; we did not know that the reaction would take the form or scale it eventually did.",
        "Yes, reputational risk was considered. That part is true. But considering a possible reaction isn't the same as knowing in advance that it will happen. We were dealing with uncertainty, and the actual response was stronger in some areas than expected."
      ]
    }
    $json$::jsonb,
    'rachel-email',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко відділили confirmed fact від inference журналіста.",
      "feedbackIncorrect": "Не заперечуйте факт обговорення reputational risk. Заперечуйте лише сильніший висновок, який із цього робить журналіст."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "distinguish confirmed evidence from interpretation",
      "skill": "precision",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rachel-email',
    5,
    'dialogue',
    'Rachel',
    $txt$Let me quote from the email we obtained: “There is a real risk that users will see this as less transparent.” That doesn't sound like uncertainty. That sounds like a warning your company chose to ignore.$txt$,
    null,
    '[]'::jsonb,
    null,
    'handle-leak',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'handle-leak',
    6,
    'input',
    'Rachel',
    $txt$Respond to the leaked quote. Accept what the quote actually establishes, but do not speculate about the rest of the email or internal motives.$txt$,
    $txt$Не кажіть, що email fake, якщо цього не знаєте. Не домислюйте контекст. Працюйте лише з тим, що quoted wording реально показує.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That sentence does show that someone internally identified a genuine reputational risk, and I don't think it would be credible to deny that. What it doesn't establish on its own is that the concern was ignored or that the final decision was taken despite a known outcome. I haven't seen the full material you're referring to, so I don't want to speculate about context I can't verify.",
        "The quote clearly reflects concern, and that should be acknowledged. But a warning about risk is not the same thing as proof that the company knew the outcome or deliberately dismissed the issue. Without the full context, I would be cautious about making a stronger claim."
      ]
    }
    $json$::jsonb,
    'rachel-evasive',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна медіа-відповідь: ви визнали evidence, але не пішли в speculation.",
      "feedbackIncorrect": "Не заперечуйте очевидне і не вигадуйте відсутній контекст. Визнайте, що quote показує, і поставте межу там, де evidence закінчується."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "respond to leaked material without overclaiming or speculating",
      "skill": "evidence-handling",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rachel-evasive',
    7,
    'dialogue',
    'Rachel',
    $txt$That sounds like a very polished way of saying “no comment.” Are you avoiding the question because the full answer would be damaging?$txt$,
    null,
    '[]'::jsonb,
    null,
    'avoid-evasion',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'avoid-evasion',
    8,
    'input',
    'Rachel',
    $txt$Respond substantively without pretending to know what you do not know. Make clear what you can answer and what remains unverified.$txt$,
    $txt$Мета: transparent boundary, а не “I can’t comment”. Дайте реальну відповідь у межах confirmed facts.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'm not avoiding the substance. The substantive answer is that reputational risk was discussed before launch, the change still went ahead, and the user reaction has raised legitimate questions about whether the trade-off was judged correctly. What I can't responsibly do is tell you what every participant intended or what the full email chain proves when I haven't verified it.",
        "There is something I can answer directly: yes, the company knew there was a possibility of criticism. What I can't confirm from the information I have is the stronger claim that decision-makers knew the change would reduce transparency and chose to proceed for that reason."
      ]
    }
    $json$::jsonb,
    'media-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви дали змістовну відповідь і чітко позначили epistemic boundary.",
      "feedbackIncorrect": "Не ховайтеся за “no comment”. Скажіть, що ви можете підтвердити, а потім поясніть, що саме залишається невідомим."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "remain substantive while respecting uncertainty",
      "skill": "register-control",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'media-choice',
    9,
    'choice',
    'Rachel',
    $txt$Rachel asks: “So was the launch a mistake — yes or no?” Which response is strongest?$txt$,
    $txt$Оберіть варіант, який не потрапляє в forced binary, але й не ухиляється.$txt$,
    $json$
    [
      {
        "id": "qualified",
        "text": "I think it's too early to reduce the decision to a simple yes or no. Some assumptions behind the launch are now clearly being challenged by user feedback, and we need to evaluate those honestly.",
        "value": "qualified"
      },
      {
        "id": "yes",
        "text": "Yes. Clearly it was a mistake and the company should admit that immediately.",
        "value": "yes"
      },
      {
        "id": "no",
        "text": "No. The decision was correct and the criticism has been exaggerated.",
        "value": "no"
      }
    ]
    $json$::jsonb,
    '{"optionId":"qualified"}'::jsonb,
    'rachel-bridge',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Ви відмовилися від false binary, але залишилися змістовними.",
      "feedbackIncorrect": "Не приймайте forced yes/no, якщо evidence ще не підтримує однозначний висновок."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "resist a false binary while answering substantively",
      "skill": "reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rachel-bridge',
    10,
    'dialogue',
    'Rachel',
    $txt$Users don't care about your internal review language. They want to know what changes now. Are you actually going to reverse the decision?$txt$,
    null,
    '[]'::jsonb,
    null,
    'bridge-message',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'bridge-message',
    11,
    'input',
    'Rachel',
    $txt$Use a bridge: answer what you can, then move to the concrete action users should care about. Do not promise a reversal if it has not been decided.$txt$,
    $txt$Answer → bridge → action. Не вигадуйте рішення, якого ще немає.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "A full reversal hasn't been decided, so I don't want to promise one. What I can say is that the design is being reviewed against the feedback we've received, and the immediate priority is to make sure users can access the information they consider important without unnecessary friction. If that requires changing the current implementation, that should be part of the review.",
        "I can't confirm a reversal today because that decision hasn't been made. What matters now is whether the current design is giving users sufficient clarity. We're reviewing that directly, and changes are possible if the evidence shows the balance was wrong."
      ]
    }
    $json$::jsonb,
    'rachel-accountability',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний bridge: ви відповіли на question, не вигадали рішення й перевели фокус на concrete action.",
      "feedbackIncorrect": "Не обіцяйте reversal без рішення. Дайте коротку відповідь і переведіть розмову на реальну дію, яка вже відбувається."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "bridge from uncertainty to a concrete public message",
      "skill": "message-discipline",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'rachel-accountability',
    12,
    'dialogue',
    'Rachel',
    $txt$Who is accountable, then? Because “we are reviewing the process” is the sort of phrase companies use when they don't want anyone to take responsibility.$txt$,
    null,
    '[]'::jsonb,
    null,
    'address-accountability',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'address-accountability',
    13,
    'input',
    'Rachel',
    $txt$Acknowledge accountability without inventing personal blame before the facts are established.$txt$,
    $txt$Distinguish organisational accountability from unverified individual blame.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The company is accountable for the decision and for its impact on users. That doesn't mean it would be responsible for me to name an individual as personally at fault before we have established how the decision was made and what evidence was available. Accountability requires us to explain the reasoning, correct problems where they exist and be clear about what changes follow.",
        "There should absolutely be accountability. At this stage, the accountability I can speak to is organisational: we made the change, users experienced the consequences, and we have to respond to that. Assigning individual blame before the facts are clear would be a different claim, and I don't think I should make it without evidence."
      ]
    }
    $json$::jsonb,
    'final-on-record',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви визнали accountability, але не перетворили її на недоведене персональне звинувачення.",
      "feedbackIncorrect": "Не відмовляйтеся від accountability, але й не називайте винного без підтверджених фактів."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "accept accountability without making unsupported claims of personal blame",
      "skill": "public-accountability",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-on-record',
    14,
    'input',
    'Rachel',
    $txt$Rachel gives you twenty seconds for a final answer: “What should users watching this interview believe about your company tonight?” Give a concise on-record statement that could survive being quoted as a headline.$txt$,
    $txt$Фінальна C1-відповідь: concise, factual, accountable, no speculation, no empty PR language.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "They should believe that we recognise the concern, that we are not dismissing the impact users have described, and that we will judge the decision against the evidence rather than defend it simply because we made it. We know the change was controversial; what we are still establishing is whether it struck the right balance. If it didn't, we need to correct it.",
        "I would ask users to judge us by what we do next. We accept responsibility for the change, we are reviewing the evidence behind the criticism, and we won't pretend certainty where the facts are still being established. If the design reduced clarity in a material way, we should change it."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 65,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний on-record statement: коротко, змістовно, відповідально й без speculation.",
      "feedbackIncorrect": "Стисніть відповідь. Дайте одну чітку позицію: що підтверджено, за що компанія відповідає і що відбудеться далі."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-media-interview-rachel",
      "role": "Investigative Journalist",
      "goal": "deliver a concise, quotable and evidence-disciplined closing statement",
      "skill": "synthesis",
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
    $txt$Інтерв’ю завершено. Ви працювали з loaded questions, leaked material, false premises, uncertainty, accountability та public framing, не переходячи до speculation або порожнього “no comment”.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "loaded question",
        "false premise",
        "on the record",
        "to bridge",
        "to qualify a claim",
        "confirmed facts",
        "reputational risk",
        "public accountability"
      ]
    }
    $json$::jsonb
  );

end $$;