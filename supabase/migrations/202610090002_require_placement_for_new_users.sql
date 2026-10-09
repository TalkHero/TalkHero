-- =========================================================
-- Require placement test for new users
-- =========================================================

alter table public.profiles
add column if not exists placement_required boolean
not null default true;

-- Existing users are grandfathered in.
-- They must not be forced through placement testing
-- after this feature is deployed.
update public.profiles
set placement_required = false;

comment on column public.profiles.placement_required is
'Whether the user must complete the initial placement test before accessing the main learning experience.';
