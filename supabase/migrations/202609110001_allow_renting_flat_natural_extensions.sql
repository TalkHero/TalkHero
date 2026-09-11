do $$
declare
  target_scene_id uuid;
begin
  select qs.id
  into target_scene_id
  from public.quest_scenes qs
  join public.quests q
    on q.id = qs.quest_id
  where q.slug = 'renting-a-flat'
    and qs.scene_code = 'thank-you'
  limit 1;

  if target_scene_id is null then
    raise notice 'Scene renting-a-flat / thank-you not found. Migration skipped.';
    return;
  end if;

  update public.quest_scenes
  set
    evaluation_config =
      coalesce(evaluation_config, '{}'::jsonb)
      || jsonb_build_object(
        'allowNaturalExtension',
        true
      ),
    updated_at = now()
  where id = target_scene_id;
end $$;
