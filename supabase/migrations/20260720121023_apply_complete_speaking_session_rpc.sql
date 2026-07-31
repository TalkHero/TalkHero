create table if not exists public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  conversation_id uuid,

  overall_score integer not null default 0,
  grammar_score integer not null default 0,
  fluency_score integer not null default 0,
  vocabulary_score integer not null default 0,
  naturalness_score integer not null default 0,

  answers_count integer not null default 0,
  duration_seconds integer not null default 0,
  xp_earned integer not null default 0,

  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint speaking_sessions_overall_score_check
    check (overall_score between 0 and 100),

  constraint speaking_sessions_grammar_score_check
    check (grammar_score between 0 and 100),

  constraint speaking_sessions_fluency_score_check
    check (fluency_score between 0 and 100),

  constraint speaking_sessions_vocabulary_score_check
    check (vocabulary_score between 0 and 100),

  constraint speaking_sessions_naturalness_score_check
    check (naturalness_score between 0 and 100),

  constraint speaking_sessions_answers_count_check
    check (answers_count >= 0),

  constraint speaking_sessions_duration_seconds_check
    check (duration_seconds >= 0),

  constraint speaking_sessions_xp_earned_check
    check (xp_earned >= 0),

  constraint speaking_sessions_completed_after_started_check
    check (completed_at >= started_at)
);

create index if not exists speaking_sessions_user_created_at_idx
  on public.speaking_sessions (
    user_id,
    created_at desc
  );

create index if not exists speaking_sessions_user_overall_score_idx
  on public.speaking_sessions (
    user_id,
    overall_score desc
  );

create index if not exists speaking_sessions_conversation_id_idx
  on public.speaking_sessions (
    conversation_id
  )
  where conversation_id is not null;

alter table public.speaking_sessions
  enable row level security;

drop policy if exists
  "Users can view their speaking sessions"
  on public.speaking_sessions;

create policy
  "Users can view their speaking sessions"
  on public.speaking_sessions
  for select
  to authenticated
  using (
    auth.uid() = user_id
  );

drop policy if exists
  "Users can create their speaking sessions"
  on public.speaking_sessions;

create policy
  "Users can create their speaking sessions"
  on public.speaking_sessions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
  );

revoke update
  on public.speaking_sessions
  from authenticated;

revoke delete
  on public.speaking_sessions
  from authenticated;
