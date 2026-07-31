-- =========================================================
-- TalkHero Quest Engine
-- Add Quest Acts: Quest → Act → Scene
-- =========================================================

-- =========================================================
-- Quest acts
-- =========================================================

create table if not exists public.quest_acts (
  id uuid primary key default gen_random_uuid(),

  quest_id uuid not null
    references public.quests(id)
    on delete cascade,

  act_code text not null,
  title text not null,
  description text,

  order_index integer not null default 0
    check (order_index >= 0),

  status text not null default 'draft'
    check (
      status in ('draft', 'published', 'archived')
    ),

  checkpoint boolean not null default false,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (quest_id, act_code),
  unique (quest_id, order_index),

  -- Required for the composite foreign key from quest_scenes.
  unique (id, quest_id)
);

-- =========================================================
-- Add act reference to scenes
-- =========================================================

alter table public.quest_scenes
  add column if not exists act_id uuid;

-- Create one default act for every existing quest.
insert into public.quest_acts (
  quest_id,
  act_code,
  title,
  description,
  order_index,
  status,
  checkpoint,
  metadata
)
select
  quests.id,
  'main',
  'Main Act',
  'Automatically created for existing quest scenes.',
  0,
  quests.status,
  false,
  jsonb_build_object(
    'systemGenerated',
    true
  )
from public.quests
where not exists (
  select 1
  from public.quest_acts
  where quest_acts.quest_id = quests.id
    and quest_acts.act_code = 'main'
);

-- Attach existing scenes to the default act.
update public.quest_scenes
set act_id = quest_acts.id
from public.quest_acts
where quest_scenes.quest_id = quest_acts.quest_id
  and quest_acts.act_code = 'main'
  and quest_scenes.act_id is null;

-- All scenes must now belong to an act.
alter table public.quest_scenes
  alter column act_id set not null;

-- Ensure that the selected act belongs to the same quest.
alter table public.quest_scenes
  drop constraint if exists quest_scenes_act_quest_fkey;

alter table public.quest_scenes
  add constraint quest_scenes_act_quest_fkey
  foreign key (act_id, quest_id)
  references public.quest_acts(id, quest_id)
  on delete cascade;

-- Scene ordering now belongs to an act, not directly to a quest.
alter table public.quest_scenes
  drop constraint if exists quest_scenes_quest_id_order_index_key;

alter table public.quest_scenes
  add constraint quest_scenes_act_id_order_index_key
  unique (act_id, order_index);

-- Scene codes remain unique within the whole quest.
-- Existing unique (quest_id, scene_code) stays unchanged.

-- =========================================================
-- Indexes
-- =========================================================

create index if not exists quest_acts_quest_order_idx
  on public.quest_acts(quest_id, order_index);

create index if not exists quest_scenes_act_order_idx
  on public.quest_scenes(act_id, order_index);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.quest_acts enable row level security;

create policy "Authenticated users can read published quest acts"
  on public.quest_acts
  for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.quests
      where quests.id = quest_acts.quest_id
        and quests.status = 'published'
    )
  );
