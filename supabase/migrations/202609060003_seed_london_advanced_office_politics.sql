-- =========================================================
-- TalkHero Campaign #5
-- C1: London Advanced
-- Mission #3: Office Politics
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


  -- =======================================================
  -- Quest
  -- =======================================================

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
    'office-politics',
    'Office Politics',
    'Навчіться діяти в політично чутливій робочій ситуації: читати підтекст, захищати внесок своєї команди, дипломатично коригувати чужі припущення та говорити про конфлікт без ескалації.',
    'conversation',
    'C1',
    2,
    22,
    280,
    110,
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
        "subtitle": "Дипломатія, підтекст і захист професійної позиції",
        "objectives": [
          "розпізнавати підтекст у професійній комунікації",
          "відрізняти intent від impact",
          "коригувати неточне представлення фактів без ескалації",
          "захищати ownership і внесок своєї команди",
          "використовувати дипломатичну незгоду",
          "не приписувати співрозмовнику мотивів без доказів",
          "переформульовувати конфлікт навколо поведінки та наслідків",
          "зберігати робочі відносини без поступки суттю"
        ]
      },
      "location": "london-strategy-office"
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


  -- =======================================================
  -- Act
  -- =======================================================

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
    'The Political Conversation',
    'Проведіть складну розмову з Naomi, Strategy Director, захищаючи внесок своєї команди без руйнування робочих відносин.',
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


  -- =======================================================
  -- Scenes
  -- =======================================================

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
    $txt$Ви керуєте міжкомандним стратегічним проєктом. Під час зустрічі з керівництвом Naomi, Strategy Director, описує успіх ініціативи так, що більша частина заслуги звучить як результат роботи її команди. Формально вона не сказала нічого явно неправдивого, але внесок вашої команди майже зник із картини. Після зустрічі ви домовляєтесь поговорити приватно.$txt$,
    null,
    '[]'::jsonb,
    null,
    'naomi-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Strategy Office",
      "emotion": "focused"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-opening',
    1,
    'dialogue',
    'Naomi',
    $txt$I had a feeling you might want to speak after the meeting. I thought the presentation went well. Was there something in particular you wanted to discuss?$txt$,
    null,
    '[]'::jsonb,
    null,
    'read-the-subtext',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'read-the-subtext',
    2,
    'input',
    'Naomi',
    $txt$Open the conversation by describing the concern without accusing Naomi of deliberate credit-taking. Refer to what was said and how it may have been perceived.$txt$,
    $txt$Не починайте з “you stole our credit”. Спирайтеся на observable facts і perception: що прозвучало та який ефект це могло створити.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I wanted to come back to how the project was described in the meeting. A number of the outcomes were presented mainly in connection with your team, while the work my team led was barely mentioned. I don't want to assume that was intentional, but I was concerned that the presentation may have created an incomplete picture of how the results were achieved.",
        "There was one part of the presentation I wanted to clarify. When the delivery and implementation work was discussed, the contribution from my team wasn't really visible. I realise that may not have been your intention, but I think senior leadership could reasonably have come away with the impression that the work sat primarily with your team."
      ]
    }
    $json$::jsonb,
    'naomi-pushback',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильний початок: ви описали observable behaviour і impact, не приписуючи Naomi недоведених мотивів.",
      "feedbackIncorrect": "Уникайте звинувачення в намірах. Опишіть конкретно, що було сказано і яке враження це могло створити."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "raise a politically sensitive concern using facts and perceived impact rather than assumed intent",
      "skill": "subtext-awareness",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-pushback',
    3,
    'dialogue',
    'Naomi',
    $txt$I think you're reading more into it than was there. I was presenting the strategic outcome, not giving a detailed history of who did what. I certainly wasn't trying to exclude your team.$txt$,
    null,
    '[]'::jsonb,
    null,
    'diplomatic-correction',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'diplomatic-correction',
    4,
    'input',
    'Naomi',
    $txt$Respond without escalating. Acknowledge Naomi's explanation, but maintain that the resulting impression still matters.$txt$,
    $txt$Визнайте її пояснення, але не відмовляйтеся від суті. Розділіть intent і impact.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand that, and I'm not suggesting you deliberately excluded us. My concern is slightly different: regardless of intent, the way the outcome was framed left very little visibility of the work my team was accountable for. I think that matters because perceptions of ownership influence how people understand both responsibility and performance.",
        "That makes sense, and I accept that the purpose wasn't to allocate credit line by line. At the same time, I think the effect was that one team's contribution became much more visible than the other's. I'm less concerned with assigning blame than with making sure the record is accurate."
      ]
    }
    $json$::jsonb,
    'naomi-intent',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви прийняли пояснення Naomi щодо наміру, але чітко зберегли розмову про реальний impact.",
      "feedbackIncorrect": "Не сперечайтеся про її мотиви. Визнайте intent, але поясніть, чому наслідок комунікації все одно важливий."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "separate intent from impact while maintaining the substance of the concern",
      "skill": "diplomatic-disagreement",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-intent',
    5,
    'dialogue',
    'Naomi',
    $txt$If we're being precise, though, strategy did shape the direction of the project. Your team executed extremely well, but execution followed the strategic model we developed.$txt$,
    null,
    '[]'::jsonb,
    null,
    'intent-vs-impact',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'intent-vs-impact',
    6,
    'input',
    'Naomi',
    $txt$Respond to Naomi's framing. Recognise the legitimate strategic contribution, but challenge the implied hierarchy between strategy and execution.$txt$,
    $txt$Не заперечуйте внесок Strategy. Покажіть, чому “strategy created value, execution merely followed” є надто спрощеною версією.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I agree that Strategy shaped the initial direction, and I don't want to minimise that contribution. Where I'd qualify the distinction is that the execution wasn't simply the implementation of a finished model. Several of the assumptions changed once we tested them operationally, and my team made decisions that materially altered the final approach. So I think the outcome was more iterative than a strategy-then-execution sequence suggests.",
        "The strategic framework was important, absolutely. I would push back slightly on the idea that delivery simply followed it. In practice, implementation generated new information, and some of the most consequential choices were made while responding to that information. I think both teams influenced the final model."
      ]
    }
    $json$::jsonb,
    'naomi-credit',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна C1-відповідь: ви визнали внесок Strategy, але дипломатично відкинули надто просту ієрархію між strategy та execution.",
      "feedbackIncorrect": "Не замінюйте одну однобічну версію іншою. Визнайте стратегічний внесок і поясніть, як execution також формував результат."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "challenge an oversimplified hierarchy while acknowledging legitimate contribution",
      "skill": "nuance",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-credit',
    7,
    'dialogue',
    'Naomi',
    $txt$What exactly are you asking me to do differently? I don't think it's helpful if every senior meeting turns into a negotiation over who gets credit.$txt$,
    null,
    '[]'::jsonb,
    null,
    'protect-ownership',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'protect-ownership',
    8,
    'input',
    'Naomi',
    $txt$Make a concrete request that protects your team's ownership without turning the issue into a competition for praise.$txt$,
    $txt$Переведіть скаргу в конкретну домовленість: що саме має змінитися у майбутній комунікації.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'm not asking for a credit negotiation. What I'd like is for us to be explicit about shared ownership when we present the project, particularly where responsibilities were genuinely divided. For example, Strategy can lead on the strategic framework, while delivery and operational decisions should be attributed to the team that owned them. That would make the account more accurate without turning the presentation into a list of individual contributions.",
        "The practical change I'm asking for is quite small: when we describe major outcomes, let's identify where ownership was shared rather than allowing one function to stand in for the whole project. I think that protects both teams and gives leadership a more accurate view of how the work actually happened."
      ]
    }
    $json$::jsonb,
    'political-response',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви перетворили політичну проблему на конкретну професійну домовленість без боротьби за особисту похвалу.",
      "feedbackIncorrect": "Не залишайте розмову на рівні образи. Сформулюйте конкретний принцип або зміну поведінки для майбутньої комунікації."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "make a concrete request that protects ownership without framing the issue as competition for praise",
      "skill": "professional-boundaries",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'political-response',
    9,
    'choice',
    'Naomi',
    $txt$Naomi says: "I still think you're being rather sensitive about recognition." Which response is strongest?$txt$,
    $txt$Оберіть відповідь, яка не захищається емоційно і повертає розмову до професійного impact.$txt$,
    $json$
    [
      {
        "id": "reframe",
        "text": "I can see why it might sound that way, but I'm not raising it because I need personal recognition. I'm raising it because how ownership is represented affects accountability, team visibility and future decision-making.",
        "value": "reframe"
      },
      {
        "id": "defensive",
        "text": "I'm not sensitive at all. You're the one making this personal by refusing to admit what happened.",
        "value": "defensive"
      },
      {
        "id": "retreat",
        "text": "Perhaps you're right. It probably isn't worth discussing further.",
        "value": "retreat"
      }
    ]
    $json$::jsonb,
    '{"optionId":"reframe"}'::jsonb,
    'naomi-private-challenge',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 20,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Саме так. Ви не прийняли емоційне framing і повернули розмову до професійних наслідків.",
      "feedbackIncorrect": "Не захищайте власний характер і не відступайте. Переформулюйте питання навколо impact на accountability та ownership."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "reframe a personal characterisation into a professional concern",
      "skill": "reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-private-challenge',
    10,
    'dialogue',
    'Naomi',
    $txt$Let me be equally direct. From my perspective, your team has sometimes presented delivery decisions as if they were independent strategic choices. So if we're talking about accurate ownership, this may not be entirely one-sided.$txt$,
    null,
    '[]'::jsonb,
    null,
    'address-behaviour',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'address-behaviour',
    11,
    'input',
    'Naomi',
    $txt$Respond to Naomi's counter-criticism. Do not dismiss it simply because you raised the original issue. Ask for specificity and show willingness to apply the same standard to your own team.$txt$,
    $txt$Сильна позиція не означає, що ваша команда автоматично права. Запросіть конкретний приклад і покажіть симетричний стандарт.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "That's fair to raise, and I don't want to apply a different standard to my own team. If there are examples where we've presented implementation decisions as though they originated independently of the strategic work, I'd like to understand them. My concern is accurate ownership in both directions, so I would expect us to correct that as well.",
        "I wouldn't dismiss that. Could you give me a specific example? If my team has overstated its independence from the strategic work, then I think the same principle should apply: we should describe the contribution more accurately."
      ]
    }
    $json$::jsonb,
    'naomi-counterclaim',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильна відповідь: ви не втратили свою позицію, але застосували той самий стандарт до власної команди.",
      "feedbackIncorrect": "Не відкидайте контркритику автоматично. Запросіть конкретику й покажіть, що принцип accurate ownership діє в обидва боки."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "respond fairly to a counter-criticism while maintaining consistent standards",
      "skill": "perspective-taking",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'naomi-counterclaim',
    12,
    'dialogue',
    'Naomi',
    $txt$That's probably fair. I can think of a couple of cases where both teams simplified the story in their own favour. Perhaps the problem is less about credit and more about how we've been representing joint ownership.$txt$,
    null,
    '[]'::jsonb,
    null,
    'reframe-conflict',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'reframe-conflict',
    13,
    'input',
    'Naomi',
    $txt$Reframe the conflict around a shared problem and propose a principle both teams can use going forward.$txt$,
    $txt$Не шукайте переможця. Побудуйте спільний framing і правило, яке зменшить політичну напругу в майбутньому.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think that's a more useful way to frame it. The issue isn't that one team is taking credit from the other; it's that we've both been simplifying a genuinely interdependent project when we communicate upwards. A good principle might be to distinguish clearly between strategic ownership, delivery ownership and decisions that were genuinely shared. That gives leadership an accurate picture without forcing us to negotiate credit each time.",
        "Agreed. If we treat the problem as inaccurate representation of shared ownership rather than a competition between teams, it becomes easier to solve. I suggest that for major updates we explicitly identify which outcomes were led by one function and which emerged jointly."
      ]
    }
    $json$::jsonb,
    'final-position',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 55,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви перетворили персоналізований конфлікт на спільну професійну проблему й запропонували робочий принцип.",
      "feedbackIncorrect": "Не завершуйте доказом того, хто був правий. Переформулюйте ситуацію навколо спільної проблеми та запропонуйте принцип на майбутнє."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "reframe an interpersonal political conflict into a shared systemic problem",
      "skill": "conflict-reframing",
      "cefr": "C1"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid,
    act_uuid,
    'final-position',
    14,
    'input',
    'Naomi',
    $txt$Close the conversation. Summarise the agreement in a way that protects your team's contribution, recognises Naomi's legitimate concerns and preserves the working relationship.$txt$,
    $txt$Фінал: ownership + reciprocity + concrete next step + relationship. Не перетворюйте завершення на переможну промову.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think we've landed somewhere useful. I still want to make sure my team's contribution is visible where it materially shaped the outcome, and I recognise that the same standard has to apply when my team describes work that depended on Strategy. Going forward, let's be more explicit about strategic ownership, delivery ownership and genuinely shared decisions in senior updates. I think that gives both teams fair visibility while keeping the focus on the quality of the work rather than on competing for credit.",
        "I'm comfortable with that approach. My concern about visibility remains, but I also take your point that this has not necessarily been one-sided. If we both commit to representing joint ownership more precisely, we can protect accountability without damaging the partnership between the teams."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 60,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильне завершення C1: ви захистили суттєвий інтерес, визнали взаємність проблеми та зберегли професійні відносини.",
      "feedbackIncorrect": "Завершіть конкретною взаємною домовленістю. Захистіть ownership, але визнайте симетричний стандарт і збережіть робоче партнерство."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-advanced-office-politics-naomi",
      "role": "Strategy Director",
      "goal": "close a politically sensitive conversation with reciprocity, boundaries and a workable agreement",
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
    $txt$Розмову завершено. Ви відстояли внесок своєї команди, не приписуючи співрозмовнику недоведених мотивів, відокремили intent від impact, прийняли симетричну критику та переформулювали політичний конфлікт у спільну професійну проблему.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "learnedWords": [
        "shared ownership",
        "to qualify a distinction",
        "perceived impact",
        "to overstate a contribution",
        "accountability",
        "to reframe an issue",
        "reciprocity",
        "to apply the same standard"
      ]
    }
    $json$::jsonb
  );

end $$;