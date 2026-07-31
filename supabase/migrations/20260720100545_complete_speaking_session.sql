create unique index if not exists speaking_sessions_user_conversation_unique_idx
  on public.speaking_sessions (
    user_id,
    conversation_id
  )
  where conversation_id is not null;

  drop function if exists public.complete_speaking_session(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  timestamptz
);

create or replace function public.complete_speaking_session(
  p_conversation_id uuid,
  p_overall_score integer,
  p_grammar_score integer,
  p_fluency_score integer,
  p_vocabulary_score integer,
  p_naturalness_score integer,
  p_answers_count integer,
  p_duration_seconds integer,
  p_started_at timestamptz
)

returns table (
  session_id uuid,
  xp_earned integer,
  total_xp integer,
  level integer,
  previous_level integer,
  leveled_up boolean,
  already_completed boolean
)

language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_session_id uuid;
  v_xp_earned integer;
  v_total_xp integer;
  v_level integer;
  v_previous_level integer;
v_leveled_up boolean;
  v_existing_session public.speaking_sessions%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_overall_score not between 0 and 100
    or p_grammar_score not between 0 and 100
    or p_fluency_score not between 0 and 100
    or p_vocabulary_score not between 0 and 100
    or p_naturalness_score not between 0 and 100 then
    raise exception 'Speaking scores must be between 0 and 100';
  end if;

  if p_answers_count < 0 then
    raise exception 'Answers count cannot be negative';
  end if;

  if p_duration_seconds < 0 then
    raise exception 'Duration cannot be negative';
  end if;

  if p_started_at > now() then
    raise exception 'Session start time cannot be in the future';
  end if;

  if p_conversation_id is not null then
    select *
    into v_existing_session
    from public.speaking_sessions
    where user_id = v_user_id
      and conversation_id = p_conversation_id
    limit 1;

    if found then
      select
        coalesce(p.xp, 0),
        coalesce(p.level, 1)
      into
        v_total_xp,
        v_level
      from public.profiles p
      where p.id = v_user_id;

      return query
select
  v_existing_session.id,
  v_existing_session.xp_earned,
  v_total_xp,
  v_level,
  v_level,
  false,
  true;

      return;
    end if;
  end if;

  v_xp_earned :=
    case
      when p_answers_count = 0 then 0
      when p_overall_score >= 95 then 60
      when p_overall_score >= 85 then 50
      when p_overall_score >= 75 then 40
      when p_overall_score >= 60 then 30
      else 20
    end;

  insert into public.speaking_sessions (
    user_id,
    conversation_id,
    overall_score,
    grammar_score,
    fluency_score,
    vocabulary_score,
    naturalness_score,
    answers_count,
    duration_seconds,
    xp_earned,
    started_at,
    completed_at
  )
  values (
    v_user_id,
    p_conversation_id,
    p_overall_score,
    p_grammar_score,
    p_fluency_score,
    p_vocabulary_score,
    p_naturalness_score,
    p_answers_count,
    p_duration_seconds,
    v_xp_earned,
    p_started_at,
    now()
  )
  returning id into v_session_id;

  select coalesce(level, 1)
into v_previous_level
from public.profiles
where id = v_user_id;

  update public.profiles
  set
    xp = coalesce(xp, 0) + v_xp_earned,
    level = floor(
      (coalesce(xp, 0) + v_xp_earned)::numeric / 100
    )::integer + 1
  where id = v_user_id
  returning
    xp,
    profiles.level
  into
    v_total_xp,
    v_level;

  if not found then
    raise exception 'Profile not found';
  end if;

  return query
select
  v_session_id,
  v_xp_earned,
  v_total_xp,
  v_level,
  v_previous_level,
  v_level > v_previous_level,
  false;
end;
$$;

revoke all
  on function public.complete_speaking_session(
    uuid,
    integer,
    integer,
    integer,
    integer,
    integer,
    integer,
    integer,
    timestamptz
  )
  from public;

grant execute
  on function public.complete_speaking_session(
    uuid,
    integer,
    integer,
    integer,
    integer,
    integer,
    integer,
    integer,
    timestamptz
  )
  to authenticated;
