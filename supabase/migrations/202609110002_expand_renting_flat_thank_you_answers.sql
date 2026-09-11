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
    expected_answer = jsonb_build_object(
      'acceptedAnswers',
      jsonb_build_array(
        'Thank you for your help.',
        'Thank you for your help',
        'Thanks for your help.',
        'Thanks for your help',

        'Thank you for the help.',
        'Thank you for the help',
        'Thanks for the help.',
        'Thanks for the help',

        'Thank you very much.',
        'Thank you very much',
        'Thanks very much.',
        'Thanks very much',

        'Thank you.',
        'Thank you',
        'Thanks.',
        'Thanks',

        'Thank you, goodbye.',
        'Thank you, goodbye',
        'Thanks, goodbye.',
        'Thanks, goodbye',

        'Thank you. Goodbye.',
        'Thank you. Goodbye',
        'Thanks. Goodbye.',
        'Thanks. Goodbye',

        'Thank you for your help. Goodbye.',
        'Thank you for your help. Goodbye',
        'Thanks for your help. Goodbye.',
        'Thanks for your help. Goodbye',

        'Thank you for the help. Goodbye.',
        'Thank you for the help. Goodbye',
        'Thanks for the help. Goodbye.',
        'Thanks for the help. Goodbye'
      )
    ),

    evaluation_config =
      coalesce(
        evaluation_config,
        '{}'::jsonb
      )
      || jsonb_build_object(
        'mode',
        'case_insensitive',
        'allowRetry',
        true,
        'maxAttempts',
        2,
        'allowNaturalExtension',
        true,
        'points',
        20,
        'feedbackCorrect',
        'Perfect. Friendly and polite.',
        'feedbackIncorrect',
        'Finish politely, for example: Thank you for your help.'
      ),

    updated_at = now()

  where id = target_scene_id;
end $$;
