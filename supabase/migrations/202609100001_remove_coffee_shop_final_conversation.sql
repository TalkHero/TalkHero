-- =========================================================
-- Remove final-conversation from Coffee Shop mission
-- goodbye-choice now leads directly to summary
-- =========================================================

do $$
declare
  quest_uuid uuid;
begin

  select q.id
  into quest_uuid
  from public.quests q
  join public.quest_episodes e
    on e.id = q.episode_id
  join public.quest_campaigns c
    on c.id = e.campaign_id
  where c.slug = 'english-basics'
    and e.slug = 'first-contact'
    and q.slug = 'coffee-shop';

  if quest_uuid is null then
    raise exception
      'Quest english-basics / first-contact / coffee-shop not found.';
  end if;

  -- Goodbye now leads directly to summary.
  update public.quest_scenes
  set
    next_scene_code = 'summary',
    updated_at = now()
  where quest_id = quest_uuid
    and scene_code = 'goodbye-choice';

  -- Remove final-conversation first,
  -- freeing order_index 14.
  delete from public.quest_scenes
  where quest_id = quest_uuid
    and scene_code = 'final-conversation';

  -- Move summary into the freed position.
  update public.quest_scenes
  set
    order_index = 14,
    updated_at = now()
  where quest_id = quest_uuid
    and scene_code = 'summary';

end $$;
