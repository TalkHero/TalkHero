begin;

-- ------------------------------------------------------------
-- Remove the legacy profiles.streak compatibility column.
--
-- Canonical daily streak fields:
--   profiles.current_streak
--   profiles.longest_streak
--
-- Application reads already use the canonical fields.
-- ------------------------------------------------------------

-- Fail safely if the expected legacy/canonical columns are missing
-- or if their values are no longer synchronized.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'streak'
  ) then
    raise exception 'Expected legacy column public.profiles.streak was not found';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'current_streak'
  ) then
    raise exception 'Expected canonical column public.profiles.current_streak was not found';
  end if;

  if exists (
    select 1
    from public.profiles
    where streak is distinct from current_streak
  ) then
    raise exception
      'Cannot remove public.profiles.streak: legacy and canonical streak values differ';
  end if;
end;
$$;


-- ------------------------------------------------------------
-- Canonical streak updater.
--
-- This replaces the previous implementation and removes the
-- temporary write to profiles.streak.
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
    last_activity_date = p_activity_date
  where id = p_user_id;

  return query
  select
    v_current_streak,
    v_longest_streak,
    p_activity_date,
    v_streak_increased;
end;
$function$;


-- Preserve the existing internal-only permission boundary.
revoke all
on function public.touch_user_daily_streak(uuid, date)
from public;

revoke all
on function public.touch_user_daily_streak(uuid, date)
from anon;

revoke all
on function public.touch_user_daily_streak(uuid, date)
from authenticated;


-- The compatibility column is no longer used by application code
-- or by the canonical streak updater.
alter table public.profiles
  drop column streak;

commit;