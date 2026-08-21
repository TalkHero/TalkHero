-- =========================================================
-- TalkHero: Coffee Shop
-- Learn -> Practice -> Final Living NPC conversation
-- =========================================================

do $$
declare
  quest_uuid uuid;
  act_uuid uuid;
begin
  select q.id, a.id
  into quest_uuid, act_uuid
  from public.quests q
  join public.quest_episodes e
    on e.id = q.episode_id
  join public.quest_campaigns c
    on c.id = e.campaign_id
  join public.quest_acts a
    on a.quest_id = q.id
   and a.act_code = 'main'
  where c.slug = 'english-basics'
    and e.slug = 'first-contact'
    and q.slug = 'coffee-shop';

  if quest_uuid is null or act_uuid is null then
    raise exception
      'Coffee Shop quest or main act was not found.';
  end if;

  -- -------------------------------------------------------
  -- 1. Restore drink-translate as a normal preparation task.
  -- A previous migration temporarily converted it to Living NPC.
  -- -------------------------------------------------------

  update public.quest_scenes
  set
    scene_type = 'translate',
    speaker = 'Emma',
    content = 'Я хотів би капучино, будь ласка.',
    prompt = 'Перекладіть фразу англійською.',
    options = '[]'::jsonb,
    expected_answer = '{
      "acceptedAnswers": [
        "I would like a cappuccino please",
        "I would like a cappuccino, please",
        "I''d like a cappuccino please",
        "I''d like a cappuccino, please",
        "Can I have a cappuccino please",
        "Can I have a cappuccino, please"
      ]
    }'::jsonb,
    next_scene_code = 'size-dialogue',
    branching = '{}'::jsonb,
    evaluation_config = '{
      "mode": "case_insensitive",
      "points": 15,
      "allowRetry": true,
      "maxAttempts": 2,
      "feedbackCorrect": "Відмінно! Це ввічливе й природне замовлення.",
      "feedbackIncorrect": "Спробуйте конструкцію: I''d like a cappuccino, please."
    }'::jsonb,
    metadata = '{
      "role": "Ваш наставник",
      "avatar": "🙂",
      "goal": "polite ordering"
    }'::jsonb,
    updated_at = now()
  where quest_id = quest_uuid
    and scene_code = 'drink-translate';

  -- -------------------------------------------------------
  -- 2. Goodbye exercise now leads into the final challenge.
  -- -------------------------------------------------------

  update public.quest_scenes
  set
    next_scene_code = 'final-conversation',
    updated_at = now()
  where quest_id = quest_uuid
    and scene_code = 'goodbye-choice';

  -- -------------------------------------------------------
  -- 3. Move summary one position later.
  -- -------------------------------------------------------

  update public.quest_scenes
  set
    order_index = 15,
    updated_at = now()
  where quest_id = quest_uuid
    and scene_code = 'summary';

  -- -------------------------------------------------------
  -- 4. Add the final integrated Living NPC challenge.
  -- -------------------------------------------------------

  delete from public.quest_scenes
  where quest_id = quest_uuid
    and scene_code = 'final-conversation';

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
  values (
    quest_uuid,
    act_uuid,
    'final-conversation',
    14,
    'input',
    'Mia',
    'Good morning! Welcome to TalkHero Coffee. What can I get for you?',
    'Фінальне випробування: зробіть повне замовлення англійською разом із Mia.',
    '[]'::jsonb,
    null,
    'summary',
    '{}'::jsonb,
    '{
      "mode": "ai",
      "points": 40,
      "allowRetry": true,
      "maxAttempts": 12
    }'::jsonb,
    '{
      "aiConversation": true,
      "role": "Barista",
      "avatar": "☕",
      "emotion": "happy",
      "cefrLevel": "A1",

      "goal": "Complete a full coffee-shop transaction naturally",

      "conversationGoal":
        "The learner must complete one coherent coffee-shop transaction with Mia. They should order a cappuccino politely, choose a size, choose regular or oat milk, say whether they want anything else, choose for here or to go, choose cash or card, respond about the receipt, and finish with a polite goodbye. Mia must ask for missing information naturally one step at a time. Do not require the learner to repeat information already established.",

      "conversationHint":
        "Замовте капучино, оберіть розмір і молоко, скажіть чи хочете щось ще, оберіть формат замовлення, спосіб оплати, дайте відповідь про чек і ввічливо попрощайтеся.",

      "minTurns": 6,
      "maxTurns": 9
    }'::jsonb
  );

  -- -------------------------------------------------------
  -- 5. Update quest metadata for the new 16-scene structure.
  -- -------------------------------------------------------

  update public.quests
  set
    description =
      'Complete a full coffee order: greeting, drink, size, milk, takeaway, payment, receipt and goodbye.',
    estimated_minutes = 14,
    config =
      coalesce(config, '{}'::jsonb)
      || jsonb_build_object(
        'version', 3,
        'sceneCount', 16,
        'learningFlow', 'learn-practice-final-challenge'
      ),
    updated_at = now()
  where id = quest_uuid;

end $$;
