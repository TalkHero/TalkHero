update public.quest_scenes
set evaluation_config =
  coalesce(evaluation_config, '{}'::jsonb)
  || jsonb_build_object(
    'allowNaturalExtension',
    true
  )
where scene_code = 'receipt-input'
  and content = 'Would you like a receipt?';
