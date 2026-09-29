-- ============================================================
-- TalkHero progression unification
--
-- Canonical daily streak:
--   profiles.current_streak
--   profiles.longest_streak
--   profiles.last_activity_date
--
-- Legacy profiles.streak remains temporarily for compatibility,
-- but is no longer written by progression functions.
--
-- Also connects completed quests to global profile XP.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Backfill canonical streak fields from the legacy streak.
--
-- If the latest activity is today or yesterday, preserve the
-- largest known current streak. If it is older, the active
-- streak is already expired and is normalized to zero.
--
-- Longest streak always preserves the largest historical value.
-- ------------------------------------------------------------

with normalized as (
  select
    id,
    greatest(
      coalesce(longest_streak, 0),
      coalesce(current_streak, 0),
      coalesce(streak, 0)
    ) as normalized_longest_streak,
    case
      when last_activity_date is null then 0
      when last_activity_date >= current_date - 1 then
        greatest(
          coalesce(current_streak, 0),
          coalesce(streak, 0)
        )
      else 0
    end as normalized_current_streak
  from public.profiles
)
update public.profiles as profiles
set
  current_streak = normalized.normalized_current_streak,
  longest_streak = normalized.normalized_longest_streak,
  streak = normalized.normalized_current_streak
from normalized
where normalized.id = profiles.id;


-- ------------------------------------------------------------
-- 2. Internal canonical streak updater.
--
-- This helper intentionally does not use auth.uid().
-- Auth validation belongs to public RPC wrappers.
--
-- SECURITY DEFINER functions and DB triggers may therefore use
-- the same streak implementation for Chat, Speaking and Quest.
-- ------------------------------------------------------------

create or replace function public.touch_user_daily_streak(
  p_user_id uuid,
  p_activity_date date default current_date
)
returns table(
  current_streak integer,
  longest_streak integer,
  last_activity_date date,
  streak_increased boolean
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_last_activity_date date;
  v_current_streak integer;
  v_longest_streak integer;
  v_streak_increased boolean := false;
begin
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  select
    profiles.last_activity_date,
    coalesce(profiles.current_streak, 0),
    coalesce(profiles.longest_streak, 0)
  into
    v_last_activity_date,
    v_current_streak,
    v_longest_streak
  from public.profiles
  where profiles.id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_last_activity_date is null then
    v_current_streak := 1;
    v_streak_increased := true;

  elsif v_last_activity_date = p_activity_date then
    v_streak_increased := false;

  elsif v_last_activity_date = p_activity_date - 1 then
    v_current_streak := v_current_streak + 1;
    v_streak_increased := true;

  else
    v_current_streak := 1;
    v_streak_increased := true;
  end if;

  v_longest_streak := greatest(
    v_longest_streak,
    v_current_streak
  );

  update public.profiles
  set
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = p_activity_date,

    -- Temporary compatibility mirror.
    -- Remove after all application reads use current_streak.
    streak = v_current_streak
  where id = p_user_id;

  return query
  select
    v_current_streak,
    v_longest_streak,
    p_activity_date,
    v_streak_increased;
end;
$function$;

revoke all
on function public.touch_user_daily_streak(uuid, date)
from public;

revoke all
on function public.touch_user_daily_streak(uuid, date)
from anon;

revoke all
on function public.touch_user_daily_streak(uuid, date)
from authenticated;


-- ------------------------------------------------------------
-- 3. Public authenticated streak RPC.
--
-- Keeps the existing API contract, but delegates to the single
-- canonical streak implementation.
-- ------------------------------------------------------------

create or replace function public.update_daily_streak(
  p_activity_date date default current_date
)
returns table(
  current_streak integer,
  longest_streak integer,
  last_activity_date date,
  streak_increased boolean
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_activity_date is distinct from current_date then
    raise exception 'Invalid activity date';
  end if;

  return query
  select
    result.current_streak,
    result.longest_streak,
    result.last_activity_date,
    result.streak_increased
  from public.touch_user_daily_streak(
    v_user_id,
    p_activity_date
  ) as result;
end;
$function$;


-- ------------------------------------------------------------
-- 4. XP awarding no longer mutates daily activity.
--
-- The return shape is deliberately preserved:
--   xp, level, streak, last_activity_date
--
-- `streak` in the returned RPC result now means canonical
-- current_streak, so existing TypeScript callers stay compatible.
-- ------------------------------------------------------------

create or replace function public.award_user_xp(
  p_user_id uuid,
  p_amount integer
)
returns table(
  xp integer,
  level integer,
  streak integer,
  last_activity_date date
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_current_xp integer;
  v_current_streak integer;
  v_last_activity_date date;
  v_new_xp integer;
  v_new_level integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if p_amount <= 0 then
    raise exception 'XP amount must be greater than zero';
  end if;

  select
    coalesce(profiles.xp, 0),
    coalesce(profiles.current_streak, 0),
    profiles.last_activity_date
  into
    v_current_xp,
    v_current_streak,
    v_last_activity_date
  from public.profiles
  where profiles.id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  v_new_xp := v_current_xp + p_amount;
  v_new_level := floor(v_new_xp / 100.0)::integer + 1;

  update public.profiles
  set
    xp = v_new_xp,
    level = v_new_level
  where id = p_user_id;

  return query
  select
    v_new_xp,
    v_new_level,
    v_current_streak,
    v_last_activity_date;
end;
$function$;


-- ------------------------------------------------------------
-- 5. Speaking completion:
--    XP + canonical daily streak in one DB transaction.
--
-- Existing conversation idempotency remains intact: an already
-- completed conversation returns before streak is touched.
-- ------------------------------------------------------------

create or replace function public.complete_speaking_session(
  p_conversation_id uuid,
  p_overall_score integer,
  p_grammar_score integer,
  p_fluency_score integer,
  p_vocabulary_score integer,
  p_naturalness_score integer,
  p_answers_count integer,
  p_duration_seconds integer,
  p_started_at timestamp with time zone
)
returns table(
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
as $function$
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

  select coalesce(pr.level, 1)
  into v_previous_level
  from public.profiles as pr
  where pr.id = v_user_id;

  update public.profiles as pr
  set
    xp = coalesce(pr.xp, 0) + v_xp_earned,
    level = floor(
      (coalesce(pr.xp, 0) + v_xp_earned)::numeric / 100
    )::integer + 1
  where pr.id = v_user_id
  returning
    pr.xp,
    pr.level
  into
    v_total_xp,
    v_level;

  if not found then
    raise exception 'Profile not found';
  end if;

  if p_answers_count > 0 then
    perform 1
    from public.touch_user_daily_streak(
      v_user_id,
      current_date
    );
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
$function$;


-- ------------------------------------------------------------
-- 6. Quest completion -> global profile progression.
--
-- Runs in the same transaction as quest_runs completion.
-- XP is therefore awarded exactly once for each transition
-- from an unfinished run to completed.
-- ------------------------------------------------------------

create or replace function public.award_quest_completion_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_xp_earned integer;
begin
  if new.status <> 'completed' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status is not distinct from 'completed' then
    return new;
  end if;

  v_xp_earned := greatest(
    coalesce(new.xp_earned, 0),
    0
  );

  update public.profiles as pr
  set
    xp = coalesce(pr.xp, 0) + v_xp_earned,
    level = floor(
      (coalesce(pr.xp, 0) + v_xp_earned)::numeric / 100
    )::integer + 1
  where pr.id = new.user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  perform 1
  from public.touch_user_daily_streak(
    new.user_id,
    coalesce(new.completed_at::date, current_date)
  );

  return new;
end;
$function$;

revoke all
on function public.award_quest_completion_progress()
from public;

revoke all
on function public.award_quest_completion_progress()
from anon;

revoke all
on function public.award_quest_completion_progress()
from authenticated;

-- ------------------------------------------------------------
-- 7. quest_runs writes are server-only.
--
-- The application reads quest_runs as the authenticated user,
-- but creation/completion/progression is performed by server
-- code using the service role.
--
-- This prevents a client from forging status/xp_earned and
-- triggering global XP rewards directly.
-- ------------------------------------------------------------

drop policy if exists
  "Users can create own quest runs"
on public.quest_runs;

drop policy if exists
  "Users can update own quest runs"
on public.quest_runs;

revoke insert, update, delete
on public.quest_runs
from anon;

revoke insert, update, delete
on public.quest_runs
from authenticated;


-- XP is awarded only when an existing legitimate run
-- transitions to completed.

drop trigger if exists award_quest_completion_progress_trigger
on public.quest_runs;

create trigger award_quest_completion_progress_trigger
after update of status
on public.quest_runs
for each row
execute function public.award_quest_completion_progress();