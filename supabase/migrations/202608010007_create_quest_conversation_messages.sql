-- =========================================================
-- TalkHero: історія AI-діалогів для проходжень місій
-- =========================================================

create table if not exists public.quest_conversation_messages (
  id uuid primary key default gen_random_uuid(),

  run_id uuid not null
    references public.quest_runs(id)
    on delete cascade,

  scene_id uuid null
    references public.quest_scenes(id)
    on delete set null,

  message_key text null,

  role text not null
    check (role in ('user', 'npc', 'system')),

  speaker text null,

  content text not null
    check (
      char_length(trim(content)) > 0
      and char_length(content) <= 4000
    ),

  metadata jsonb not null
    default '{}'::jsonb,

  created_at timestamptz not null
    default now(),

  constraint quest_conversation_messages_run_message_key_unique
    unique (run_id, message_key)
);

create index if not exists
  quest_conversation_messages_run_created_idx
on public.quest_conversation_messages (
  run_id,
  created_at desc
);

create index if not exists
  quest_conversation_messages_scene_idx
on public.quest_conversation_messages (
  scene_id
);

alter table public.quest_conversation_messages
enable row level security;

drop policy if exists
  "Users can read own quest conversation messages"
on public.quest_conversation_messages;

create policy
  "Users can read own quest conversation messages"
on public.quest_conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.quest_runs run
    where run.id = run_id
      and run.user_id = auth.uid()
  )
);

comment on table public.quest_conversation_messages is
  'Stores user and NPC messages for AI-powered quest conversations.';

comment on column public.quest_conversation_messages.message_key is
  'Optional idempotency key used to prevent duplicate messages.';
