-- =========================================================
-- TalkHero Quest Engine v1
-- Campaign → Episode → Quest → Scene → Run
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- Campaigns
-- =========================================================

create table if not exists public.quest_campaigns (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  title text not null,
  description text,

  cover_image_url text,

  cefr_level text
    check (
      cefr_level is null
      or cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    ),

  status text not null default 'draft'
    check (
      status in ('draft', 'published', 'archived')
    ),

  order_index integer not null default 0
    check (order_index >= 0),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Episodes
-- =========================================================

create table if not exists public.quest_episodes (
  id uuid primary key default gen_random_uuid(),

  campaign_id uuid not null
    references public.quest_campaigns(id)
    on delete cascade,

  slug text not null,
  title text not null,
  description text,

  order_index integer not null default 0
    check (order_index >= 0),

  status text not null default 'draft'
    check (
      status in ('draft', 'published', 'archived')
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (campaign_id, slug),
  unique (campaign_id, order_index)
);

-- =========================================================
-- Quests
-- =========================================================

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),

  episode_id uuid not null
    references public.quest_episodes(id)
    on delete cascade,

  slug text not null,
  title text not null,
  description text,

  quest_type text not null default 'conversation'
    check (
      quest_type in (
        'conversation',
        'story',
        'grammar',
        'vocabulary',
        'speaking'
      )
    ),

  cefr_level text
    check (
      cefr_level is null
      or cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    ),

  order_index integer not null default 0
    check (order_index >= 0),

  estimated_minutes integer
    check (
      estimated_minutes is null
      or estimated_minutes > 0
    ),

  xp_reward integer not null default 0
    check (xp_reward >= 0),

  coin_reward integer not null default 0
    check (coin_reward >= 0),

  status text not null default 'draft'
    check (
      status in ('draft', 'published', 'archived')
    ),

  config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (episode_id, slug),
  unique (episode_id, order_index)
);

-- =========================================================
-- Quest scenes
-- =========================================================

create table if not exists public.quest_scenes (
  id uuid primary key default gen_random_uuid(),

  quest_id uuid not null
    references public.quests(id)
    on delete cascade,

  scene_code text not null,

  order_index integer not null default 0
    check (order_index >= 0),

  scene_type text not null default 'dialogue'
    check (
      scene_type in (
        'narration',
        'dialogue',
        'choice',
        'input',
        'completion'
      )
    ),

  speaker text,
  content text not null,

  prompt text,

  options jsonb not null default '[]'::jsonb,

  expected_answer jsonb,

  next_scene_code text,

  branching jsonb not null default '{}'::jsonb,

  evaluation_config jsonb not null default '{}'::jsonb,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (quest_id, scene_code),
  unique (quest_id, order_index)
);

-- =========================================================
-- Quest runs
-- One run = one user attempt
-- =========================================================

create table if not exists public.quest_runs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  quest_id uuid not null
    references public.quests(id)
    on delete cascade,

  status text not null default 'in_progress'
    check (
      status in (
        'in_progress',
        'completed',
        'abandoned',
        'failed'
      )
    ),

  current_scene_id uuid
    references public.quest_scenes(id)
    on delete set null,

  current_scene_code text,

  completed_scene_count integer not null default 0
    check (completed_scene_count >= 0),

  score numeric(8, 2) not null default 0,
  max_score numeric(8, 2) not null default 0,

  xp_earned integer not null default 0
    check (xp_earned >= 0),

  coins_earned integer not null default 0
    check (coins_earned >= 0),

  state jsonb not null default '{}'::jsonb,

  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Only one active run per user and quest.
create unique index if not exists quest_runs_one_active_run
  on public.quest_runs(user_id, quest_id)
  where status = 'in_progress';

-- =========================================================
-- Quest run events
-- Stores every scene interaction
-- =========================================================

create table if not exists public.quest_run_events (
  id uuid primary key default gen_random_uuid(),

  run_id uuid not null
    references public.quest_runs(id)
    on delete cascade,

  scene_id uuid
    references public.quest_scenes(id)
    on delete set null,

  scene_code text not null,

  event_type text not null
    check (
      event_type in (
        'scene_presented',
        'answer_submitted',
        'choice_selected',
        'scene_completed',
        'quest_completed'
      )
    ),

  user_input jsonb,

  evaluation jsonb,

  is_correct boolean,

  score_awarded numeric(8, 2),

  response_time_ms integer
    check (
      response_time_ms is null
      or response_time_ms >= 0
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- =========================================================
-- Indexes
-- =========================================================

create index if not exists quest_episodes_campaign_order_idx
  on public.quest_episodes(campaign_id, order_index);

create index if not exists quests_episode_order_idx
  on public.quests(episode_id, order_index);

create index if not exists quest_scenes_quest_order_idx
  on public.quest_scenes(quest_id, order_index);

create index if not exists quest_runs_user_status_idx
  on public.quest_runs(user_id, status);

create index if not exists quest_runs_quest_status_idx
  on public.quest_runs(quest_id, status);

create index if not exists quest_run_events_run_created_idx
  on public.quest_run_events(run_id, created_at);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.quest_campaigns enable row level security;
alter table public.quest_episodes enable row level security;
alter table public.quests enable row level security;
alter table public.quest_scenes enable row level security;
alter table public.quest_runs enable row level security;
alter table public.quest_run_events enable row level security;

-- Published quest content can be read by authenticated users.

create policy "Authenticated users can read published campaigns"
  on public.quest_campaigns
  for select
  to authenticated
  using (status = 'published');

create policy "Authenticated users can read published episodes"
  on public.quest_episodes
  for select
  to authenticated
  using (status = 'published');

create policy "Authenticated users can read published quests"
  on public.quests
  for select
  to authenticated
  using (status = 'published');

create policy "Authenticated users can read published quest scenes"
  on public.quest_scenes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quests
      where quests.id = quest_scenes.quest_id
        and quests.status = 'published'
    )
  );

-- Users can read only their own runs.

create policy "Users can read own quest runs"
  on public.quest_runs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own quest runs"
  on public.quest_runs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own quest runs"
  on public.quest_runs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Events belong to runs owned by the current user.

create policy "Users can read own quest events"
  on public.quest_run_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quest_runs
      where quest_runs.id = quest_run_events.run_id
        and quest_runs.user_id = auth.uid()
    )
  );

create policy "Users can create own quest events"
  on public.quest_run_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.quest_runs
      where quest_runs.id = quest_run_events.run_id
        and quest_runs.user_id = auth.uid()
    )
  );
