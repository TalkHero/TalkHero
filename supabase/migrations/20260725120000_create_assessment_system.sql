-- Universal assessment system for:
-- 1. Placement Test
-- 2. CEFR Level Tests
-- 3. Practice Tests
--
-- The existing placement_test_sessions and placement_test_questions
-- tables are intentionally left untouched during migration.

create extension if not exists pgcrypto;

-- =========================================================
-- Tests
-- =========================================================

create table if not exists public.assessment_tests (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  name_uk text not null,
  description_uk text,

  test_type text not null
    check (
      test_type in (
        'placement',
        'level',
        'practice'
      )
    ),

  cefr_level text
    check (
      cefr_level is null
      or cefr_level in (
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
        'C2'
      )
    ),

  question_count integer not null default 20
    check (question_count > 0),

  passing_score numeric(5, 2)
    check (
      passing_score is null
      or passing_score between 0 and 100
    ),

  is_active boolean not null default true,

  -- Flexible configuration for adaptive testing,
  -- category distribution, time limits and similar settings.
  config jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assessment_tests_level_requirement_check
    check (
      (
        test_type = 'level'
        and cefr_level is not null
      )
      or (
        test_type <> 'level'
      )
    )
);

comment on table public.assessment_tests is
  'Definitions of placement, CEFR level and practice tests.';

comment on column public.assessment_tests.config is
  'Test configuration such as adaptive rules, category distribution and early stopping.';

-- =========================================================
-- Question bank
-- =========================================================

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),

  cefr_level text not null
    check (
      cefr_level in (
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
        'C2'
      )
    ),

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

  question_type text not null
    check (
      question_type in (
        'multiple_choice',
        'fill_gap',
        'reading_choice',
        'true_false',
        'matching',
        'open_response'
      )
    ),

  -- Main English instruction or question.
  prompt text not null,

  -- Optional reading passage or other context.
  passage text,

  -- Example:
  -- [
  --   {"id": "a", "text": "go"},
  --   {"id": "b", "text": "goes"},
  --   {"id": "c", "text": "going"},
  --   {"id": "d", "text": "gone"}
  -- ]
  options jsonb,

  -- Server-only answer data.
  --
  -- Multiple choice example:
  -- {"optionId": "b"}
  --
  -- Fill gap example:
  -- {"acceptedAnswers": ["has gone", "has already gone"]}
  --
  -- True/false example:
  -- {"value": true}
  correct_answer jsonb,

  explanation_uk text,

  -- Difficulty inside the selected CEFR level.
  -- 1 = easiest, 5 = hardest.
  difficulty smallint not null default 3
    check (difficulty between 1 and 5),

  topic text,
  tags text[] not null default array[]::text[],

  -- manual: created and reviewed manually
  -- ai_assisted: generated with AI but manually reviewed
  source text not null default 'manual'
    check (
      source in (
        'manual',
        'ai_assisted',
        'imported'
      )
    ),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'review',
        'published',
        'archived'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assessment_questions_options_check
    check (
      (
        question_type in (
          'multiple_choice',
          'fill_gap',
          'reading_choice',
          'matching'
        )
        and options is not null
      )
      or question_type not in (
        'multiple_choice',
        'fill_gap',
        'reading_choice',
        'matching'
      )
    ),

  constraint assessment_questions_correct_answer_check
    check (
      (
        question_type = 'open_response'
      )
      or correct_answer is not null
    )
);

comment on table public.assessment_questions is
  'Reusable and reviewed question bank for all assessment types.';

comment on column public.assessment_questions.correct_answer is
  'Server-only correct answer. It must never be sent to the browser before submission.';

-- =========================================================
-- Fixed test composition
-- =========================================================

create table if not exists public.assessment_test_questions (
  id uuid primary key default gen_random_uuid(),

  test_id uuid not null
    references public.assessment_tests(id)
    on delete cascade,

  question_id uuid not null
    references public.assessment_questions(id)
    on delete cascade,

  order_index integer,
  weight numeric(6, 2) not null default 1
    check (weight > 0),

  is_required boolean not null default true,

  created_at timestamptz not null default now(),

  unique (test_id, question_id),

  constraint assessment_test_questions_order_check
    check (
      order_index is null
      or order_index >= 0
    )
);

comment on table public.assessment_test_questions is
  'Connects fixed tests to question-bank entries. Adaptive placement tests may select questions dynamically.';

-- =========================================================
-- Attempts
-- =========================================================

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  test_id uuid not null
    references public.assessment_tests(id)
    on delete restrict,

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

  answered_question_count integer not null default 0
    check (answered_question_count >= 0),

  correct_answer_count integer not null default 0
    check (correct_answer_count >= 0),

  raw_score numeric(10, 2) not null default 0,
  max_score numeric(10, 2) not null default 0,

  percentage numeric(5, 2)
    check (
      percentage is null
      or percentage between 0 and 100
    ),

  passed boolean,

  final_level text
    check (
      final_level is null
      or final_level in (
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
        'C2'
      )
    ),

  confidence numeric(5, 4)
    check (
      confidence is null
      or confidence between 0 and 1
    ),

  -- Category-level result, for example:
  -- {
  --   "grammar": 82,
  --   "vocabulary": 75,
  --   "reading": 91,
  --   "writing": 64
  -- }
  skill_scores jsonb not null default '{}'::jsonb,

  metadata jsonb not null default '{}'::jsonb,

  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.assessment_attempts is
  'User attempts for placement, CEFR level and practice tests.';

-- =========================================================
-- Attempt question snapshots and answers
-- =========================================================

create table if not exists public.assessment_attempt_items (
  id uuid primary key default gen_random_uuid(),

  attempt_id uuid not null
    references public.assessment_attempts(id)
    on delete cascade,

  question_id uuid not null
    references public.assessment_questions(id)
    on delete restrict,

  order_index integer not null
    check (order_index >= 0),

  weight numeric(6, 2) not null default 1
    check (weight > 0),

  -- Snapshot prevents later question edits from changing
  -- historical test results.
  question_snapshot jsonb not null,

  user_answer jsonb,

  is_correct boolean,

  raw_score numeric(8, 2),
  max_score numeric(8, 2) not null default 1
    check (max_score > 0),

  -- Used primarily for writing and speaking evaluation.
  ai_evaluation jsonb,

  answered_at timestamptz,
  created_at timestamptz not null default now(),

  unique (attempt_id, order_index),
  unique (attempt_id, question_id)
);

comment on table public.assessment_attempt_items is
  'Question snapshots and user answers belonging to a specific assessment attempt.';

-- =========================================================
-- Indexes
-- =========================================================

create index if not exists assessment_tests_type_idx
  on public.assessment_tests(test_type);

create index if not exists assessment_tests_level_idx
  on public.assessment_tests(cefr_level);

create index if not exists assessment_questions_selection_idx
  on public.assessment_questions(
    status,
    cefr_level,
    category,
    question_type,
    difficulty
  );

create index if not exists assessment_questions_tags_idx
  on public.assessment_questions
  using gin(tags);

create index if not exists assessment_test_questions_test_idx
  on public.assessment_test_questions(test_id, order_index);

create index if not exists assessment_attempts_user_idx
  on public.assessment_attempts(user_id, started_at desc);

create index if not exists assessment_attempts_test_idx
  on public.assessment_attempts(test_id, status);

create index if not exists assessment_attempt_items_attempt_idx
  on public.assessment_attempt_items(attempt_id, order_index);

-- Only one active attempt per user and test.
create unique index if not exists assessment_attempts_one_active_idx
  on public.assessment_attempts(user_id, test_id)
  where status = 'in_progress';

-- =========================================================
-- updated_at trigger
-- =========================================================

create or replace function public.set_assessment_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_assessment_tests_updated_at
  on public.assessment_tests;

create trigger set_assessment_tests_updated_at
before update on public.assessment_tests
for each row
execute function public.set_assessment_updated_at();

drop trigger if exists set_assessment_questions_updated_at
  on public.assessment_questions;

create trigger set_assessment_questions_updated_at
before update on public.assessment_questions
for each row
execute function public.set_assessment_updated_at();

drop trigger if exists set_assessment_attempts_updated_at
  on public.assessment_attempts;

create trigger set_assessment_attempts_updated_at
before update on public.assessment_attempts
for each row
execute function public.set_assessment_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.assessment_tests enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_test_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_attempt_items enable row level security;

-- Users may view active test definitions.
drop policy if exists "Authenticated users can view active assessment tests"
  on public.assessment_tests;

create policy "Authenticated users can view active assessment tests"
on public.assessment_tests
for select
to authenticated
using (is_active = true);

-- Questions and correct answers intentionally have no direct client policy.
-- They should be returned through protected server API routes.
--
-- assessment_questions:
-- no authenticated SELECT policy
--
-- assessment_test_questions:
-- no authenticated SELECT policy

drop policy if exists "Users can view own assessment attempts"
  on public.assessment_attempts;

create policy "Users can view own assessment attempts"
on public.assessment_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own assessment attempts"
  on public.assessment_attempts;

create policy "Users can create own assessment attempts"
on public.assessment_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own assessment attempts"
  on public.assessment_attempts;

create policy "Users can update own assessment attempts"
on public.assessment_attempts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own assessment attempt items"
  on public.assessment_attempt_items;

create policy "Users can view own assessment attempt items"
on public.assessment_attempt_items
for select
to authenticated
using (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id = assessment_attempt_items.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create own assessment attempt items"
  on public.assessment_attempt_items;

create policy "Users can create own assessment attempt items"
on public.assessment_attempt_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id = assessment_attempt_items.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own assessment attempt items"
  on public.assessment_attempt_items;

create policy "Users can update own assessment attempt items"
on public.assessment_attempt_items
for update
to authenticated
using (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id = assessment_attempt_items.attempt_id
      and attempts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.assessment_attempts attempts
    where attempts.id = assessment_attempt_items.attempt_id
      and attempts.user_id = (select auth.uid())
  )
);

-- =========================================================
-- Initial test definitions
-- =========================================================

insert into public.assessment_tests (
  slug,
  name_uk,
  description_uk,
  test_type,
  cefr_level,
  question_count,
  passing_score,
  config
)
values
  (
    'english-placement',
    'Комплексний тест на визначення рівня',
    'Адаптивний тест із питаннями різних рівнів від A1 до C1.',
    'placement',
    null,
    30,
    null,
    '{
      "adaptive": true,
      "minimumQuestions": 20,
      "maximumQuestions": 30,
      "earlyStopConfidence": 0.88,
      "levels": ["A1", "A2", "B1", "B2", "C1"],
      "categories": ["grammar", "vocabulary", "reading"],
      "openResponseEnabled": false
    }'::jsonb
  ),
  (
    'english-a1',
    'Тест рівня A1',
    'Перевірка граматики, словникового запасу та читання на рівні A1.',
    'level',
    'A1',
    20,
    70,
    '{
      "categories": {
        "grammar": 8,
        "vocabulary": 7,
        "reading": 5
      }
    }'::jsonb
  ),
  (
    'english-a2',
    'Тест рівня A2',
    'Перевірка граматики, словникового запасу та читання на рівні A2.',
    'level',
    'A2',
    20,
    70,
    '{
      "categories": {
        "grammar": 8,
        "vocabulary": 7,
        "reading": 5
      }
    }'::jsonb
  ),
  (
    'english-b1',
    'Тест рівня B1',
    'Перевірка граматики, словникового запасу та читання на рівні B1.',
    'level',
    'B1',
    20,
    70,
    '{
      "categories": {
        "grammar": 7,
        "vocabulary": 7,
        "reading": 6
      }
    }'::jsonb
  ),
  (
    'english-b2',
    'Тест рівня B2',
    'Перевірка граматики, словникового запасу та читання на рівні B2.',
    'level',
    'B2',
    20,
    70,
    '{
      "categories": {
        "grammar": 7,
        "vocabulary": 6,
        "reading": 7
      }
    }'::jsonb
  ),
  (
    'english-c1',
    'Тест рівня C1',
    'Поглиблена перевірка граматики, словникового запасу та читання на рівні C1.',
    'level',
    'C1',
    20,
    70,
    '{
      "categories": {
        "grammar": 6,
        "vocabulary": 6,
        "reading": 8
      },
      "writingAssessmentAvailable": true
    }'::jsonb
  )
on conflict (slug)
do update set
  name_uk = excluded.name_uk,
  description_uk = excluded.description_uk,
  test_type = excluded.test_type,
  cefr_level = excluded.cefr_level,
  question_count = excluded.question_count,
  passing_score = excluded.passing_score,
  config = excluded.config,
  updated_at = now();
