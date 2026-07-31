-- =========================================================
-- Placement test system
-- =========================================================

-- ---------------------------------------------------------
-- 1. Extend profiles
-- ---------------------------------------------------------

alter table public.profiles
add column if not exists english_level text;

alter table public.profiles
add column if not exists english_level_score integer;

alter table public.profiles
add column if not exists english_level_confidence numeric(5, 4);

alter table public.profiles
add column if not exists placement_completed_at timestamptz;

alter table public.profiles
add column if not exists placement_test_attempts integer
not null default 0;

-- Add CEFR validation only if it does not already exist.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_english_level_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_english_level_check
    check (
      english_level is null
      or english_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_english_level_score_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_english_level_score_check
    check (
      english_level_score is null
      or english_level_score between 0 and 100
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_english_level_confidence_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_english_level_confidence_check
    check (
      english_level_confidence is null
      or english_level_confidence between 0 and 1
    );
  end if;
end
$$;

-- ---------------------------------------------------------
-- 2. Placement test sessions
-- ---------------------------------------------------------

create table if not exists public.placement_test_sessions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  status text not null default 'in_progress'
    check (
      status in (
        'in_progress',
        'completed',
        'abandoned'
      )
    ),

  current_question_index integer not null default 0
    check (current_question_index >= 0),

  total_questions integer not null default 12
    check (total_questions between 1 and 30),

  final_level text
    check (
      final_level is null
      or final_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    ),

  final_score integer
    check (
      final_score is null
      or final_score between 0 and 100
    ),

  confidence numeric(5, 4)
    check (
      confidence is null
      or confidence between 0 and 1
    ),

  grammar_score integer
    check (
      grammar_score is null
      or grammar_score between 0 and 100
    ),

  vocabulary_score integer
    check (
      vocabulary_score is null
      or vocabulary_score between 0 and 100
    ),

  comprehension_score integer
    check (
      comprehension_score is null
      or comprehension_score between 0 and 100
    ),

  complexity_score integer
    check (
      complexity_score is null
      or complexity_score between 0 and 100
    ),

  task_completion_score integer
    check (
      task_completion_score is null
      or task_completion_score between 0 and 100
    ),

  result_summary jsonb,

  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  updated_at timestamptz not null default now()
);

-- A user may have only one active placement test.
create unique index if not exists
placement_test_sessions_one_active_per_user_idx
on public.placement_test_sessions(user_id)
where status = 'in_progress';

create index if not exists
placement_test_sessions_user_started_idx
on public.placement_test_sessions(user_id, started_at desc);

-- ---------------------------------------------------------
-- 3. Generated questions and student answers
-- ---------------------------------------------------------

create table if not exists public.placement_test_questions (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.placement_test_sessions(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  question_index integer not null
    check (question_index >= 0),

  question text not null
    check (char_length(trim(question)) > 0),

  normalized_question text not null
    check (char_length(trim(normalized_question)) > 0),

  question_key text not null
    check (char_length(trim(question_key)) > 0),

  target_level text not null
    check (
      target_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    ),

  skill text not null
    check (char_length(trim(skill)) > 0),

  expected_answer_length text not null
    check (
      expected_answer_length in ('short', 'medium', 'long')
    ),

  generation_metadata jsonb not null default '{}'::jsonb,

  answer text,

  grammar_score integer
    check (
      grammar_score is null
      or grammar_score between 0 and 100
    ),

  vocabulary_score integer
    check (
      vocabulary_score is null
      or vocabulary_score between 0 and 100
    ),

  comprehension_score integer
    check (
      comprehension_score is null
      or comprehension_score between 0 and 100
    ),

  complexity_score integer
    check (
      complexity_score is null
      or complexity_score between 0 and 100
    ),

  task_completion_score integer
    check (
      task_completion_score is null
      or task_completion_score between 0 and 100
    ),

  estimated_level text
    check (
      estimated_level is null
      or estimated_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    ),

  evaluation jsonb,

  created_at timestamptz not null default now(),
  answered_at timestamptz,

  constraint placement_test_questions_session_index_unique
    unique (session_id, question_index)
);

create index if not exists
placement_test_questions_session_idx
on public.placement_test_questions(session_id, question_index);

create index if not exists
placement_test_questions_user_created_idx
on public.placement_test_questions(user_id, created_at desc);

create index if not exists
placement_test_questions_user_key_idx
on public.placement_test_questions(user_id, question_key);

-- Prevent the exact same normalized question from ever being saved
-- twice for the same user.
create unique index if not exists
placement_test_questions_user_normalized_unique_idx
on public.placement_test_questions(user_id, normalized_question);

-- ---------------------------------------------------------
-- 4. updated_at trigger
-- ---------------------------------------------------------

create or replace function public.set_placement_test_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
set_placement_test_sessions_updated_at
on public.placement_test_sessions;

create trigger set_placement_test_sessions_updated_at
before update on public.placement_test_sessions
for each row
execute function public.set_placement_test_updated_at();

-- ---------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------

alter table public.placement_test_sessions enable row level security;
alter table public.placement_test_questions enable row level security;

drop policy if exists
"Users can view their placement test sessions"
on public.placement_test_sessions;

create policy
"Users can view their placement test sessions"
on public.placement_test_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists
"Users can create their placement test sessions"
on public.placement_test_sessions;

create policy
"Users can create their placement test sessions"
on public.placement_test_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists
"Users can update their placement test sessions"
on public.placement_test_sessions;

create policy
"Users can update their placement test sessions"
on public.placement_test_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists
"Users can view their placement test questions"
on public.placement_test_questions;

create policy
"Users can view their placement test questions"
on public.placement_test_questions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists
"Users can create their placement test questions"
on public.placement_test_questions;

create policy
"Users can create their placement test questions"
on public.placement_test_questions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists
"Users can update their placement test questions"
on public.placement_test_questions;

create policy
"Users can update their placement test questions"
on public.placement_test_questions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
