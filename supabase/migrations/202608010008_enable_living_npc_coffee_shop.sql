-- =========================================================
-- TalkHero: Living NPC для Coffee Shop
-- Без нового scene_type.
-- =========================================================

do $$
declare
  target_scene_id uuid;
begin
  select scene.id
  into target_scene_id
  from public.quest_scenes scene
  join public.quests quest
    on quest.id = scene.quest_id
  join public.quest_episodes episode
    on episode.id = quest.episode_id
  join public.quest_campaigns campaign
    on campaign.id = episode.campaign_id
  where campaign.slug = 'english-basics'
    and episode.slug = 'first-contact'
    and quest.slug = 'coffee-shop'
    and scene.scene_code = 'drink-translate';

  if target_scene_id is null then
    raise exception
      'Не знайдено сцену coffee-shop / drink-translate.';
  end if;

  update public.quest_scenes
  set
    speaker = 'Mia',
    content =
      'Good morning! What would you like to order?',
    prompt =
      'Поспілкуйтеся з Mia та зробіть повне замовлення.',
    evaluation_config = '{
      "mode": "ai",
      "points": 25,
      "allowRetry": true,
      "maxAttempts": 10
    }'::jsonb,
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || '{
        "aiConversation": true,
        "role": "Barista",
        "avatar": "☕",
        "emotion": "happy",
        "goal": "Order a cappuccino politely",
        "conversationGoal": "The learner must order a cappuccino, choose a size, and answer one short follow-up question politely.",
        "conversationHint": "Замовте капучино, оберіть розмір і дайте відповідь на уточнення баристи.",
        "cefrLevel": "A1",
        "minTurns": 2,
        "maxTurns": 4
      }'::jsonb,
    updated_at = now()
  where id = target_scene_id;
end $$;
