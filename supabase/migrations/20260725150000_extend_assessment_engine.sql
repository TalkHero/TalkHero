-- Extend the universal assessment system with:
-- 1. skipped answers
-- 2. adaptive ability tracking
-- 3. question discrimination and estimated time
-- 4. domain-level results

-- =========================================================
-- Question metadata for adaptive selection
-- =========================================================

alter table public.assessment_questions
add column if not exists discrimination numeric(5, 4)
  not null default 1
  check (discrimination > 0 and discrimination <= 3);

alter table public.assessment_questions
add column if not exists estimated_time_seconds integer
  check (
    estimated_time_seconds is null
    or estimated_time_seconds > 0
  );

comment on column public.assessment_questions.discrimination is
  'How strongly the question separates users of different ability. Higher values provide more information.';

comment on column public.assessment_questions.estimated_time_seconds is
  'Expected answer time in seconds.';

-- =========================================================
-- Adaptive attempt state
-- =========================================================

alter table public.assessment_attempts
add column if not exists current_ability numeric(6, 5)
  check (
    current_ability is null
    or current_ability between 0 and 1
  );

alter table public.assessment_attempts
add column if not exists skipped_question_count integer
  not null default 0
  check (skipped_question_count >= 0);

comment on column public.assessment_attempts.current_ability is
  'Current normalized placement ability estimate between 0 and 1.';

comment on column public.assessment_attempts.skipped_question_count is
  'Number of questions explicitly skipped by choosing the unknown-answer action.';

-- =========================================================
-- Answer status
-- =========================================================

alter table public.assessment_attempt_items
add column if not exists answer_status text
  not null default 'pending'
  check (
    answer_status in (
      'pending',
      'correct',
      'incorrect',
      'skipped'
    )
  );

comment on column public.assessment_attempt_items.answer_status is
  'Explicit answer state. skipped means the user chose not to answer and moved to the next question.';

-- Backfill existing attempt items.
update public.assessment_attempt_items
set answer_status = case
  when answered_at is null then 'pending'
  when is_correct = true then 'correct'
  when is_correct = false then 'incorrect'
  else 'pending'
end
where answer_status = 'pending';

-- Keep legacy is_correct consistent with the new status.
alter table public.assessment_attempt_items
drop constraint if exists assessment_attempt_items_answer_consistency_check;

alter table public.assessment_attempt_items
add constraint assessment_attempt_items_answer_consistency_check
check (
  (
    answer_status = 'pending'
    and is_correct is null
    and answered_at is null
  )
  or (
    answer_status = 'correct'
    and is_correct = true
    and answered_at is not null
  )
  or (
    answer_status in ('incorrect', 'skipped')
    and is_correct = false
    and answered_at is not null
  )
);

create index if not exists assessment_attempt_items_status_idx
  on public.assessment_attempt_items(attempt_id, answer_status);

-- =========================================================
-- Domain-level results
-- =========================================================

create table if not exists public.assessment_attempt_domain_results (
  id uuid primary key default gen_random_uuid(),

  attempt_id uuid not null
    references public.assessment_attempts(id)
    on delete cascade,

  category text not null
    check (
      category in (
        'grammar',
        'vocabulary',
        'reading',
        'listening',
        'writing',
        'speaking'
      )
    ),

  answered_count integer not null default 0
    check (answered_count >= 0),

  correct_count integer not null default 0
    check (correct_count >= 0),

  incorrect_count integer not null default 0
    check (incorrect_count >= 0),

  skipped_count integer not null default 0
    check (skipped_count >= 0),

  raw_score numeric(10, 2) not null default 0,
  max_score numeric(10, 2) not null default 0
    check (max_score >= 0),

  percentage numeric(5, 2)
    check (
      percentage is null
      or percentage between 0 and 100
    ),

  estimated_level text
    check (
      estimated_level is null
      or estimated_level in (
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
        'C2'
      )
    ),

  ability numeric(6, 5)
    check (
      ability is null
      or ability between 0 and 1
    ),

  confidence numeric(5, 4)
    check (
      confidence is null
      or confidence between 0 and 1
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (attempt_id, category)
);

comment on table public.assessment_attempt_domain_results is
  'Category-level results for a specific assessment attempt.';

create index if not exists assessment_domain_results_attempt_idx
  on public.assessment_attempt_domain_results(attempt_id);

-- =========================================================
-- updated_at trigger
-- =========================================================

drop trigger if exists set_assessment_domain_results_updated_at
  on public.assessment_attempt_domain_results;

create trigger set_assessment_domain_results_updated_at
before update on public.assessment_attempt_domain_results
for each row
execute function public.set_assessment_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.assessment_attempt_domain_results
enable row level security;

drop policy if exists "Users can view own assessment domain results"
  on public.assessment_attempt_domain_results;

create policy "Users can view own assessment domain results"
on public.assessment_attempt_domain_results
for select
to authenticated
using (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id =
      assessment_attempt_domain_results.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create own assessment domain results"
  on public.assessment_attempt_domain_results;

create policy "Users can create own assessment domain results"
on public.assessment_attempt_domain_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id =
      assessment_attempt_domain_results.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own assessment domain results"
  on public.assessment_attempt_domain_results;

create policy "Users can update own assessment domain results"
on public.assessment_attempt_domain_results
for update
to authenticated
using (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id =
      assessment_attempt_domain_results.attempt_id
      and attempts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id =
      assessment_attempt_domain_results.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);
