-- ============================================================
-- TalkHero: harden quest_runs privileges
--
-- Quest state is mutated only by trusted server-side code using
-- the service role. Authenticated users may only read their own
-- runs through RLS.
-- ============================================================

revoke all privileges
on table public.quest_runs
from anon;

revoke all privileges
on table public.quest_runs
from authenticated;

grant select
on table public.quest_runs
to authenticated;