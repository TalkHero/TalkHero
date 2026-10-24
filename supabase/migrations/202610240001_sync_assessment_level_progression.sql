-- Synchronize the user's English level after a successfully completed
-- assessment level test.
--
-- Allowed progression:
-- A1 -> A2
-- A2 -> B1
-- B1 -> B2
-- B2 -> C1
--
-- C1 is currently the highest level for which an assessment test exists.
-- The trigger never lowers a user's level and never skips levels.

create or replace function public.sync_profile_level_from_assessment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_level text;
  expected_next_level text;
begin
  if new.status <> 'completed'
     or new.passed is not true
     or new.final_level is null then
    return new;
  end if;

  -- Run only when the attempt actually becomes completed.
  if old.status = 'completed' then
    return new;
  end if;

  select english_level
  into current_level
  from public.profiles
  where id = new.user_id
  for update;

  current_level := coalesce(
    upper(trim(current_level)),
    'A1'
  );

  expected_next_level :=
    case current_level
      when 'A1' then 'A2'
      when 'A2' then 'B1'
      when 'B1' then 'B2'
      when 'B2' then 'C1'
      else null
    end;

  -- Do not downgrade, skip levels, or change C1/C2.
  if expected_next_level is null
     or upper(trim(new.final_level)) <> expected_next_level then
    return new;
  end if;

  update public.profiles
  set english_level = expected_next_level
  where id = new.user_id
    and coalesce(
      upper(trim(english_level)),
      'A1'
    ) = current_level;

  return new;
end;
$$;

drop trigger if exists sync_profile_level_from_assessment_trigger
on public.assessment_attempts;

create trigger sync_profile_level_from_assessment_trigger
after update of status, passed, final_level
on public.assessment_attempts
for each row
execute function public.sync_profile_level_from_assessment();