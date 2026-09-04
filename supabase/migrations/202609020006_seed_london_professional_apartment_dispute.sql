-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #7: Apartment Dispute
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
  where slug = 'london-professional';

  if campaign_uuid is null then
    raise exception 'Campaign london-professional not found';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'professional-life';

  if episode_uuid is null then
    raise exception 'Episode professional-life not found';
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
    'apartment-dispute',
    'Apartment Dispute',
    'Вирішіть суперечку щодо депозиту за квартиру: спокійно викладіть свою позицію, вимагайте докази, відокремте факти від припущень, домовтеся про справедливе рішення та зафіксуйте його письмово.',
    'conversation',
    'B2',
    6,
    20,
    230,
    90,
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
        "campaignSlug": "london-professional",
        "subtitle": "Відстоюйте свою позицію без конфлікту",
        "objectives": [
          "чітко формулювати свою позицію у суперечці",
          "запитувати докази замість сперечатися з припущеннями",
          "відокремлювати підтверджені факти від інтерпретацій",
          "встановлювати професійні межі",
          "не піддаватися тиску",
          "пропонувати справедливий компроміс",
          "визначати конкретні умови домовленості",
          "фіксувати рішення письмово",
          "ескалювати суперечку пропорційно ситуації"
        ]
      },
      "location": "london-apartment-office"
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
    'Resolving the Dispute',
    'Захистіть свою позицію та перетворіть суперечку на конкретну домовленість.',
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
    quest_uuid, act_uuid, 'briefing', 0, 'narration', null,
    $txt$Ви нещодавно виїхали з орендованої квартири в Лондоні. Після перевірки житла property management company повідомила, що хоче утримати £650 із вашого депозиту через пошкодження дерев'яної підлоги у вітальні. Ви не погоджуєтеся: частина слідів була ще до вашого заселення, а повного обґрунтування суми вам не надали. Ви зустрічаєтеся з Mark, Operations Manager, щоб вирішити суперечку.$txt$,
    null,
    '[]'::jsonb,
    null,
    'mark-opening',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "location": "London Property Management Office"
    }
    $json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mark-opening', 1, 'dialogue', 'Mark',
    $txt$Thanks for coming in. As we explained in the email, we're proposing to deduct £650 from your deposit because of damage to the wooden floor in the living room. I'd like to see if we can resolve this today.$txt$,
    null,
    '[]'::jsonb,
    null,
    'state-position',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'state-position', 2, 'input', 'Mark',
    $txt$State your position clearly but calmly. Do not accept the deduction, but do not become aggressive or accuse Mark of dishonesty.$txt$,
    $txt$Спокійно поясніть, з чим саме ви не погоджуєтеся і чому хочете переглянути deduction.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I understand that you've identified damage, but I don't agree that the full £650 deduction has been justified. Some of the marks were already present when I moved in, and I haven't yet seen evidence showing which damage you're attributing to my tenancy or how the amount was calculated.",
        "I'm happy to discuss the issue, but I can't agree to the £650 deduction as it stands. I believe some of the condition predates my tenancy, and I'd like to understand the evidence and calculation before accepting any charge."
      ]
    }
    $json$::jsonb,
    'mark-damage-claim',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 30,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви чітко не погодилися з deduction, але залишили простір для конструктивного обговорення.",
      "feedbackIncorrect": "Сформулюйте позицію твердо, але без агресії: ви не погоджуєтеся з deduction у поточному вигляді та хочете побачити його обґрунтування."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "state a clear position in a dispute without aggression or premature concession",
      "skill": "assertiveness",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mark-damage-claim', 3, 'dialogue', 'Mark',
    $txt$The checkout report shows several scratches that weren't highlighted in the final inspection notes from before your tenancy. The landlord believes the floor needs professional repair, which is where the £650 figure comes from.$txt$,
    null,
    '[]'::jsonb,
    null,
    'request-evidence',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'request-evidence', 4, 'input', 'Mark',
    $txt$Ask for specific evidence needed to evaluate the claim. Focus on comparison, attribution and the calculation of the amount.$txt$,
    $txt$Не сперечайтеся лише словами. Запитайте конкретні докази: стан до/після, зв'язок пошкодження з вашою орендою та розрахунок £650.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Could you show me the check-in and checkout evidence side by side so we can identify which scratches are actually new? I'd also like to see the repair estimate or invoice that explains how the £650 figure was calculated.",
        "Before I can assess the claim, could I see the dated photographs or inventory from the start of the tenancy, the checkout evidence and the contractor's breakdown for the proposed £650 repair?"
      ]
    }
    $json$::jsonb,
    'mark-evidence',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви перевели суперечку з тверджень на перевірювані докази: before/after evidence та розрахунок суми.",
      "feedbackIncorrect": "Попросіть конкретні матеріали, які дозволять перевірити claim: стан до і після оренди та обґрунтування £650."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "request specific evidence to evaluate a disputed damage claim",
      "skill": "clarification",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mark-evidence', 5, 'dialogue', 'Mark',
    $txt$I have the photographs here. They show some light marks before you moved in, but the checkout photos do show two deeper scratches. The £650 isn't an invoice, though. It's the landlord's estimate of what refinishing the whole living-room floor might cost.$txt$,
    null,
    '[]'::jsonb,
    null,
    'distinguish-facts',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "emotion": "thinking"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'distinguish-facts', 6, 'input', 'Mark',
    $txt$Separate what the evidence supports from what is still an assumption. Acknowledge inconvenient facts instead of denying everything.$txt$,
    $txt$Визнайте те, що справді підтверджено, але відокремте це від непідтвердженого припущення про необхідність ремонту всієї підлоги за £650.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "The photos seem to support that two deeper scratches appeared during my tenancy, so I'm not denying that point. What they don't establish is that the entire floor needs to be refinished or that £650 is the reasonable cost of addressing those scratches. I think we need evidence for that part separately.",
        "I can accept that the two deeper scratches weren't visible in the earlier photos. However, that doesn't automatically demonstrate that full-floor refinishing is necessary. The damage itself and the proposed remedy are two separate questions."
      ]
    }
    $json$::jsonb,
    'mark-pressure',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 35,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви визнали незручний факт, але не дозволили перетворити його на непідтверджений висновок.",
      "feedbackIncorrect": "Не заперечуйте очевидні докази. Відокремте підтверджені scratches від окремого питання: чи справді вони вимагають £650 ремонту."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "distinguish supported facts from unsupported conclusions in a dispute",
      "skill": "critical-evaluation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mark-pressure', 7, 'dialogue', 'Mark',
    $txt$I understand your point, but the landlord has already decided that £650 is appropriate. If we can't agree today, returning the rest of the deposit may take longer while the dispute is reviewed.$txt$,
    null,
    '[]'::jsonb,
    null,
    'set-boundary',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "emotion": "challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'set-boundary', 8, 'input', 'Mark',
    $txt$Respond to the pressure without becoming hostile. Make clear that speed alone is not a reason to accept an unsupported amount.$txt$,
    $txt$Встановіть межу: ви готові вирішити питання швидко, але не погодитеся на £650 лише для того, щоб уникнути затримки.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd prefer to resolve this quickly as well, but I don't think the possibility of a delay is a reason for me to accept an amount that hasn't been properly supported. I'm happy to keep working toward an agreement if we can base it on the evidence and a reasonable repair cost.",
        "I want to settle this efficiently, but I can't agree to £650 simply because disputing it may take longer. If we can establish a fair cost for the damage actually supported by the evidence, I'm willing to discuss that."
      ]
    }
    $json$::jsonb,
    'mark-compromise',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Добре. Ви не піддалися тиску, але залишили конструктивний шлях до домовленості.",
      "feedbackIncorrect": "Не переходьте до погроз і не поступайтеся лише через можливу затримку. Встановіть спокійну межу та поверніть розмову до evidence."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "set a firm boundary under pressure while preserving a path to agreement",
      "skill": "assertiveness",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mark-compromise', 9, 'dialogue', 'Mark',
    $txt$All right. I can ask for a contractor's quote specifically for repairing the damaged area rather than refinishing the whole floor. If that came back significantly lower, would you be willing to contribute toward the repair?$txt$,
    null,
    '[]'::jsonb,
    null,
    'negotiate-solution',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "emotion": "encouraging"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'negotiate-solution', 10, 'input', 'Mark',
    $txt$Negotiate a conditional compromise. Do not agree to an unknown amount; define what evidence and conditions would make a contribution reasonable.$txt$,
    $txt$Запропонуйте компроміс із чіткими умовами. Не погоджуйтеся платити невідому суму наперед.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "Yes, I'd be willing to consider a reasonable contribution if the quote is specifically for repairing the two new scratches and the cost is supported by a contractor rather than an estimate for replacing or refinishing more than necessary. I'd like to review the quote before agreeing to the final deduction.",
        "I'm open to contributing to the reasonable cost of repairing damage that the evidence links to my tenancy. If you obtain an itemised quote for the affected area, we can review it together and agree the deduction based on that rather than the current £650 estimate."
      ]
    }
    $json$::jsonb,
    'mark-final-condition',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Сильно. Ви запропонували компроміс, але прив'язали його до конкретних доказів і ще не погодили невідому суму.",
      "feedbackIncorrect": "Компроміс не означає погодитися на будь-яку суму. Визначте умови: relevant damage, itemised quote та review перед остаточним deduction."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "negotiate a conditional evidence-based compromise",
      "skill": "negotiation",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'mark-final-condition', 11, 'dialogue', 'Mark',
    $txt$That seems reasonable. I'll request an itemised quote today. Let's say the quote comes back at £180 for repairing the two scratches, and we agree that £180 is the final deduction. What would you want confirmed before we close the matter?$txt$,
    null,
    '[]'::jsonb,
    null,
    'document-agreement',
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "emotion": "neutral"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'document-agreement', 12, 'input', 'Mark',
    $txt$Turn the verbal settlement into a precise written agreement. Include the amount, what it covers, what happens to the remaining deposit and the next action.$txt$,
    $txt$Зафіксуйте домовленість: £180 → за що саме → що відбувається із залишком депозиту → що Mark має підтвердити письмово.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I'd like written confirmation that the agreed deduction is £180 specifically for repairing the two scratches, that no further floor-related deduction will be made, and that the remaining deposit will be released. Please also confirm when the refund will be processed.",
        "Could you confirm in writing that £180 is the full and final deduction for the two scratches, with the balance of the deposit returned to me, and include the expected date for the refund?"
      ]
    }
    $json$::jsonb,
    'escalation-choice',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 45,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Усна домовленість стала конкретною: amount, scope of deduction, remaining deposit і next action.",
      "feedbackIncorrect": "Не залишайте settlement розмитим. Зафіксуйте точну суму, що вона покриває, долю залишку депозиту та письмове підтвердження."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "convert a verbal settlement into a precise written agreement",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'escalation-choice', 13, 'choice', 'Mark',
    $txt$Suppose Mark later refuses to provide the evidence or reconsider the unsupported £650 deduction. What is the most appropriate next step?$txt$,
    $txt$Оберіть пропорційну ескалацію після того, як конструктивне пряме вирішення не спрацювало.$txt$,
    $json$
    [
      {
        "id": "formal-dispute",
        "text": "Document the disagreement and use the appropriate formal deposit-dispute process, providing the check-in and checkout evidence.",
        "value": "formal-dispute"
      },
      {
        "id": "threaten-publicly",
        "text": "Threaten to attack the company publicly online unless the entire deposit is returned immediately.",
        "value": "threaten-publicly"
      },
      {
        "id": "accept",
        "text": "Accept the £650 deduction because escalating the matter could take longer.",
        "value": "accept"
      }
    ]
    $json$::jsonb,
    '{"optionId":"formal-dispute"}'::jsonb,
    'final-resolution',
    '{}'::jsonb,
    $json$
    {
      "mode": "exact",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Правильно. Формальна evidence-based escalation є пропорційною, якщо пряме конструктивне вирішення не спрацювало.",
      "feedbackIncorrect": "Ескалація має бути пропорційною та evidence-based: не погроза і не автоматична поступка."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "choose a proportionate formal escalation when direct resolution fails"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-resolution', 14, 'input', 'Mark',
    $txt$Summarise the complete resolution: what evidence you accept, what you do not accept, the compromise, the agreed deduction and what must happen next.$txt$,
    $txt$Фінальна B2-відповідь: acknowledged facts → disputed assumption → evidence-based compromise → exact settlement → written next steps.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I accept that the evidence shows two deeper scratches appeared during my tenancy, but I don't accept that this justifies refinishing the entire floor or the original £650 estimate. We've agreed to use an itemised quote for repairing the affected area, and on the basis of the £180 quote, I accept £180 as the full and final deduction. Please confirm that in writing, confirm that there will be no additional floor-related charge and release the remaining deposit with the expected refund date.",
        "The photographs support responsibility for the two new scratches, but not the original assumption that the whole floor needs £650 of work. We therefore agreed that the deduction should reflect the documented repair cost for those scratches. With the quote at £180, I'll accept that amount as the final deduction, provided the settlement and return of the remaining deposit are confirmed in writing."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode": "ai",
      "points": 50,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно. Ви визнали підтверджені факти, відкинули непідтверджений висновок, домовилися про evidence-based settlement і зафіксували наступні кроки.",
      "feedbackIncorrect": "Фінальна відповідь має поєднати acknowledged facts, disputed assumption, compromise, точну суму settlement і письмові next steps."
    }
    $json$::jsonb,
    $json$
    {
      "npcId": "london-professional-apartment-dispute-mark",
      "role": "Operations Manager",
      "goal": "synthesise an evidence-based dispute resolution and precise settlement",
      "skill": "synthesis",
      "cefr": "B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$Суперечку вирішено. Ви спокійно захистили свою позицію, перевели розмову на докази, визнали підтверджені факти, не погодилися з непідтвердженою сумою, домовилися про справедливий settlement та зафіксували його письмово.$txt$,
    null,
    '[]'::jsonb,
    null,
    null,
    '{}'::jsonb,
    '{}'::jsonb,
    $json$
    {
      "summary": "Apartment Dispute completed",
      "learnedWords": [
        "deposit",
        "deduction",
        "damage",
        "evidence",
        "itemised quote",
        "settlement",
        "full and final",
        "dispute"
      ]
    }
    $json$::jsonb
  );

end $$;