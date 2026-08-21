-- =========================================================
-- TalkHero:
-- Merge legacy "you" spelling error keys into spelling:you.
--
-- Historical keys were created before static quest errors
-- received stable spelling keys.
-- =========================================================

do $$
declare
  user_record record;
  merged_occurrence_count integer;
  merged_successful_uses integer;
  merged_is_mastered boolean;
  merged_first_seen_at timestamptz;
  merged_last_seen_at timestamptz;
  merged_last_success_at timestamptz;
  merged_mastered_at timestamptz;
  merged_created_at timestamptz;
  latest_original_text text;
  latest_corrected_text text;
  latest_explanation text;
begin
  for user_record in
    select distinct user_id
    from public.user_language_errors
    where error_key in (
      'spelling:you',
      'spelling:no-thank-yo-to-no-thank-you',
      'word_choice:no-thank-yo-to-no-thank-you'
    )
  loop
    select
      sum(occurrence_count),
      max(successful_uses),
      bool_or(is_mastered),
      min(first_seen_at),
      max(last_seen_at),
      max(last_success_at),
      min(mastered_at),
      min(created_at)
    into
      merged_occurrence_count,
      merged_successful_uses,
      merged_is_mastered,
      merged_first_seen_at,
      merged_last_seen_at,
      merged_last_success_at,
      merged_mastered_at,
      merged_created_at
    from public.user_language_errors
    where user_id = user_record.user_id
      and error_key in (
        'spelling:you',
        'spelling:no-thank-yo-to-no-thank-you',
        'word_choice:no-thank-yo-to-no-thank-you'
      );

    select
      original_text,
      corrected_text,
      explanation
    into
      latest_original_text,
      latest_corrected_text,
      latest_explanation
    from public.user_language_errors
    where user_id = user_record.user_id
      and error_key in (
        'spelling:you',
        'spelling:no-thank-yo-to-no-thank-you',
        'word_choice:no-thank-yo-to-no-thank-you'
      )
    order by last_seen_at desc
    limit 1;

    /*
     * Remove all historical variants first so the unique
     * constraint on (user_id, error_key) cannot conflict.
     */
    delete from public.user_language_errors
    where user_id = user_record.user_id
      and error_key in (
        'spelling:you',
        'spelling:no-thank-yo-to-no-thank-you',
        'word_choice:no-thank-yo-to-no-thank-you'
      );

    insert into public.user_language_errors (
      user_id,
      error_type,
      error_key,
      original_text,
      corrected_text,
      explanation,
      occurrence_count,
      successful_uses,
      is_mastered,
      first_seen_at,
      last_seen_at,
      last_success_at,
      mastered_at,
      created_at,
      updated_at
    )
    values (
      user_record.user_id,
      'spelling',
      'spelling:you',
      coalesce(latest_original_text, 'you'),
      coalesce(latest_corrected_text, 'you'),
      latest_explanation,
      greatest(coalesce(merged_occurrence_count, 1), 1),
      greatest(coalesce(merged_successful_uses, 0), 0),

      /*
       * Preserve an already-mastered target.
       * Also remain consistent with the current 3-use rule.
       */
      coalesce(merged_is_mastered, false)
        or coalesce(merged_successful_uses, 0) >= 3,

      coalesce(merged_first_seen_at, now()),
      coalesce(merged_last_seen_at, now()),
      merged_last_success_at,

      case
        when coalesce(merged_is_mastered, false)
          or coalesce(merged_successful_uses, 0) >= 3
        then coalesce(
          merged_mastered_at,
          merged_last_success_at,
          now()
        )
        else null
      end,

      coalesce(merged_created_at, now()),
      now()
    );
  end loop;
end $$;
