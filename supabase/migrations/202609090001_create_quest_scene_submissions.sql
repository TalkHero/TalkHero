create table if not exists public.quest_scene_submissions (
  id uuid primary key default gen_random_uuid(),

  run_id uuid not null
    references public.quest_runs(id)
    on delete cascade,

  scene_id uuid not null
    references public.quest_scenes(id)
    on delete cascade,

  submission_id uuid not null,

  attempt_number integer not null
    check (attempt_number > 0),

  status text not null
    check (
      status in (
        'processing',
        'completed',
        'failed'
      )
    ),

  result jsonb null,

  created_at timestamptz not null default now(),

  completed_at timestamptz null,

  constraint quest_scene_submissions_run_submission_unique
    unique (run_id, submission_id),

  constraint quest_scene_submissions_run_scene_attempt_unique
    unique (
      run_id,
      scene_id,
      attempt_number
    )
);

create index if not exists quest_scene_submissions_run_created_idx
  on public.quest_scene_submissions (
    run_id,
    created_at desc
  );

create index if not exists quest_scene_submissions_scene_idx
  on public.quest_scene_submissions (
    scene_id
  );

alter table public.quest_scene_submissions
  enable row level security;

comment on table public.quest_scene_submissions is
  'Tracks quest scene submissions for server-side idempotency and concurrent submission protection.';

comment on column public.quest_scene_submissions.submission_id is
  'Client-generated UUID identifying one logical scene submission.';

comment on column public.quest_scene_submissions.attempt_number is
  'Attempt number for the submitted scene within the quest run.';
