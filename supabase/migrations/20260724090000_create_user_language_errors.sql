create table if not exists public.user_language_errors (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  error_type text not null
    check (
      error_type in (
        'grammar',
        'vocabulary',
        'spelling',
        'word_choice',
        'pronunciation',
        'naturalness'
      )
    ),

  error_key text not null,

  original_text text not null,
  corrected_text text not null,
  explanation text,

  occurrence_count integer not null default 1
    check (occurrence_count >= 1),

  successful_uses integer not null default 0
    check (successful_uses >= 0),

  is_mastered boolean not null default false,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_success_at timestamptz,
  mastered_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_language_errors_user_error_key_unique
    unique (user_id, error_key)
);

create index if not exists
  user_language_errors_user_id_idx
on public.user_language_errors(user_id);

create index if not exists
  user_language_errors_active_idx
on public.user_language_errors(
  user_id,
  is_mastered,
  occurrence_count desc,
  last_seen_at desc
);

alter table public.user_language_errors
enable row level security;

drop policy if exists
  "Users can read own language errors"
on public.user_language_errors;

create policy
  "Users can read own language errors"
on public.user_language_errors
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists
  "Users can insert own language errors"
on public.user_language_errors;

create policy
  "Users can insert own language errors"
on public.user_language_errors
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists
  "Users can update own language errors"
on public.user_language_errors;

create policy
  "Users can update own language errors"
on public.user_language_errors
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists
  "Users can delete own language errors"
on public.user_language_errors;

create policy
  "Users can delete own language errors"
on public.user_language_errors
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_language_error_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  set_user_language_errors_updated_at
on public.user_language_errors;

create trigger
  set_user_language_errors_updated_at
before update on public.user_language_errors
for each row
execute function public.set_language_error_updated_at();

create or replace function public.record_language_error_success(
  p_error_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.user_language_errors
  set
    successful_uses = successful_uses + 1,
    last_success_at = now(),
    is_mastered = successful_uses + 1 >= 3,
    mastered_at = case
      when successful_uses + 1 >= 3 then now()
      else null
    end
  where id = p_error_id
    and user_id = auth.uid()
    and is_mastered = false;
end;
$$;

grant execute
on function public.record_language_error_success(uuid)
to authenticated;
