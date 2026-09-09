alter table public.quest_run_events
add column if not exists submission_id uuid null;

create unique index if not exists quest_run_events_submission_event_unique
on public.quest_run_events (
  run_id,
  submission_id,
  event_type
)
where submission_id is not null;


create or replace function public.commit_quest_scene_submission(
  p_run_id uuid,
  p_scene_id uuid,
  p_submission_id uuid,
  p_attempt_number integer,

  p_new_status text,
  p_new_current_scene_id uuid,
  p_new_current_scene_code text,
  p_new_completed_scene_count integer,
  p_new_score integer,
  p_new_xp_earned integer,
  p_new_coins_earned integer,
  p_new_state jsonb,
  p_completed_at timestamptz,

  p_result jsonb,

  p_events jsonb default '[]'::jsonb,
  p_conversation_messages jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.quest_runs%rowtype;
  v_submission public.quest_scene_submissions%rowtype;
  v_attempt_submission public.quest_scene_submissions%rowtype;

  v_event jsonb;
  v_message jsonb;
begin
  /*
   * Lock the run first.
   *
   * Concurrent submissions for the same run are serialized here.
   */
  select *
  into v_run
  from public.quest_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'QUEST_RUN_NOT_FOUND';
  end if;


  /*
   * Exact replay of the same submission ID.
   *
   * If it already completed, return the stored result.
   */
  select *
  into v_submission
  from public.quest_scene_submissions
  where run_id = p_run_id
    and submission_id = p_submission_id;

  if found then
    if v_submission.status = 'completed'
       and v_submission.result is not null then
      return v_submission.result;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'QUEST_SUBMISSION_ALREADY_EXISTS';
  end if;


  /*
   * Prevent another submission ID from committing
   * the same logical scene attempt.
   */
  select *
  into v_attempt_submission
  from public.quest_scene_submissions
  where run_id = p_run_id
    and scene_id = p_scene_id
    and attempt_number = p_attempt_number;

  if found then
    raise exception using
      errcode = 'P0001',
      message = 'QUEST_ATTEMPT_ALREADY_SUBMITTED';
  end if;


  /*
   * Optimistic state validation.
   *
   * The caller evaluated exactly this scene.
   * If another request already advanced the run,
   * this transaction must not apply stale output.
   */
  if v_run.status <> 'in_progress' then
    raise exception using
      errcode = 'P0001',
      message = 'QUEST_RUN_NOT_IN_PROGRESS';
  end if;

  if v_run.current_scene_id is distinct from p_scene_id then
    raise exception using
      errcode = 'P0001',
      message = 'QUEST_SCENE_ALREADY_CHANGED';
  end if;


  /*
   * Claim exists only inside this transaction.
   *
   * If anything below fails, PostgreSQL rolls
   * this insert back as well.
   */
  insert into public.quest_scene_submissions (
    run_id,
    scene_id,
    submission_id,
    attempt_number,
    status
  )
  values (
    p_run_id,
    p_scene_id,
    p_submission_id,
    p_attempt_number,
    'processing'
  );


  /*
   * Persist quest run progression.
   */
  update public.quest_runs
  set
    status = p_new_status,

    current_scene_id = p_new_current_scene_id,
    current_scene_code = p_new_current_scene_code,

    completed_scene_count = p_new_completed_scene_count,

    score = p_new_score,

    xp_earned = p_new_xp_earned,
    coins_earned = p_new_coins_earned,

    state = coalesce(
      p_new_state,
      state
    ),

    completed_at = p_completed_at,

    updated_at = now()
  where id = p_run_id;


  /*
   * Core quest events.
   */
  for v_event in
    select value
    from jsonb_array_elements(
      coalesce(
        p_events,
        '[]'::jsonb
      )
    )
  loop
    insert into public.quest_run_events (
      run_id,

      scene_id,
      scene_code,

      event_type,

      user_input,
      evaluation,

      is_correct,
      score_awarded,

      response_time_ms,

      metadata,

      submission_id
    )
    values (
      p_run_id,

      case
        when nullif(
          v_event ->> 'sceneId',
          ''
        ) is null
          then null
        else
          (v_event ->> 'sceneId')::uuid
      end,

      coalesce(
        v_event ->> 'sceneCode',
        ''
      ),

      v_event ->> 'eventType',

      v_event -> 'userInput',
      v_event -> 'evaluation',

      case
        when v_event ? 'isCorrect'
          and v_event ->> 'isCorrect' is not null
          then (v_event ->> 'isCorrect')::boolean
        else null
      end,

      case
        when v_event ? 'scoreAwarded'
          and v_event ->> 'scoreAwarded' is not null
          then (v_event ->> 'scoreAwarded')::integer
        else null
      end,

      case
        when v_event ? 'responseTimeMs'
          and v_event ->> 'responseTimeMs' is not null
          then (v_event ->> 'responseTimeMs')::integer
        else null
      end,

      coalesce(
        v_event -> 'metadata',
        '{}'::jsonb
      ),

      p_submission_id
    );
  end loop;


  /*
   * Conversation history is part of the same
   * durable quest transition.
   */
  for v_message in
    select value
    from jsonb_array_elements(
      coalesce(
        p_conversation_messages,
        '[]'::jsonb
      )
    )
  loop
    insert into public.quest_conversation_messages (
      run_id,
      scene_id,
      message_key,
      role,
      speaker,
      content,
      metadata
    )
    values (
      p_run_id,

      case
        when nullif(
          v_message ->> 'sceneId',
          ''
        ) is null
          then null
        else
          (v_message ->> 'sceneId')::uuid
      end,

      nullif(
        v_message ->> 'messageKey',
        ''
      ),

      v_message ->> 'role',

      nullif(
        v_message ->> 'speaker',
        ''
      ),

      v_message ->> 'content',

      coalesce(
        v_message -> 'metadata',
        '{}'::jsonb
      )
    )
    on conflict (
      run_id,
      message_key
    )
    do nothing;
  end loop;


  /*
   * Submission completion belongs to the same commit
   * as run progression, events and conversation.
   */
  update public.quest_scene_submissions
  set
    status = 'completed',
    result = p_result,
    completed_at = now()
  where run_id = p_run_id
    and submission_id = p_submission_id
    and status = 'processing';

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'QUEST_SUBMISSION_COMPLETE_FAILED';
  end if;


  return p_result;
end;
$$;


revoke all
on function public.commit_quest_scene_submission(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  uuid,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  timestamptz,
  jsonb,
  jsonb,
  jsonb
)
from public;

revoke all
on function public.commit_quest_scene_submission(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  uuid,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  timestamptz,
  jsonb,
  jsonb,
  jsonb
)
from anon;

revoke all
on function public.commit_quest_scene_submission(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  uuid,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  timestamptz,
  jsonb,
  jsonb,
  jsonb
)
from authenticated;

grant execute
on function public.commit_quest_scene_submission(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  uuid,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  timestamptz,
  jsonb,
  jsonb,
  jsonb
)
to service_role;
