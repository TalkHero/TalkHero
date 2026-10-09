begin;

-- ============================================================
-- Use the Ukraine learning day for daily streak progression.
--
-- Supabase/PostgreSQL runs in UTC, while TalkHero currently
-- treats a calendar day as Europe/Kyiv.
--
-- Daily streak dates use Europe/Kyiv.
--
-- Existing Speaking and Quest functions that rely on
-- current_date or timestamptz::date receive a function-local
-- Europe/Kyiv TimeZone below. Explicit activity dates therefore
-- remain untouched.
-- ============================================================


create or replace function public.touch_user_daily_streak(
  p_user_id uuid,
  p_activity_date date
    default ((now() at time zone 'Europe/Kyiv')::date)
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
  v_activity_date date;
  v_last_activity_date date;
  v_current_streak integer;
  v_longest_streak integer;
  v_streak_increased boolean := false;
begin
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  v_activity_date :=
    coalesce(
      p_activity_date,
      (now() at time zone 'Europe/Kyiv')::date
    );


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

  elsif v_last_activity_date = v_activity_date then
    v_streak_increased := false;

  elsif v_last_activity_date = v_activity_date - 1 then
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
    last_activity_date = v_activity_date
  where id = p_user_id;

  return query
  select
    v_current_streak,
    v_longest_streak,
    v_activity_date,
    v_streak_increased;
end;
$function$;


create or replace function public.update_daily_streak(
  p_activity_date date
    default ((now() at time zone 'Europe/Kyiv')::date)
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
  v_today date;
  v_activity_date date;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  v_today :=
    (now() at time zone 'Europe/Kyiv')::date;

  v_activity_date :=
    coalesce(p_activity_date, v_today);

  if v_activity_date is distinct from v_today then
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
    v_activity_date
  ) as result;
end;
$function$;

-- Speaking uses current_date internally when completing a session.
-- Execute that function with the TalkHero learning-day timezone.
alter function public.complete_speaking_session(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  timestamp with time zone
)
set timezone to 'Europe/Kyiv';


-- Quest completion uses both current_date and completed_at::date.
-- Function-local timezone makes both represent the Kyiv calendar day.
alter function public.award_quest_completion_progress()
set timezone to 'Europe/Kyiv';


commit;