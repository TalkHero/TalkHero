do $$
declare
  quest_uuid uuid;
begin
  select q.id
  into quest_uuid
  from public.quests q
  where q.slug = 'underground'
  limit 1;

  if quest_uuid is null then
    raise exception 'Underground quest was not found.';
  end if;

  update public.quest_scenes
  set
    expected_answer = jsonb_build_object(
      'acceptedAnswers',
      jsonb_build_array(
        'By card please',
        'By card, please',
        'Card please',
        'Card, please',
        'I will pay by card',
        'I''ll pay by card',
        'I would like to pay by card',
        'I''d like to pay by card',
        'I would like to pay by card, please',
        'I''d like to pay by card, please'
      )
    ),
    evaluation_config =
      coalesce(evaluation_config, '{}'::jsonb)
      || jsonb_build_object(
        'errorKey',
        'naturalness:card-payment-response'
      ),
    updated_at = now()
  where quest_id = quest_uuid
    and scene_code = 'payment-input';
end $$;
