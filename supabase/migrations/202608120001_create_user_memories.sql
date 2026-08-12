-- =========================================================
-- TalkHero
-- Persistent user memory for AI conversations
-- =========================================================

create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  memory_key text not null,
  memory_value text not null,

  category text not null default 'personal',

  confidence numeric(4, 3) not null default 1.000,

  source_conversation_id uuid null
    references public.conversations(id)
    on delete set null,

  last_confirmed_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_memories_memory_key_not_empty
    check (length(trim(memory_key)) > 0),

  constraint user_memories_memory_value_not_empty
    check (length(trim(memory_value)) > 0),

  constraint user_memories_category_check
    check (
      category in (
        'personal',
        'location',
        'work',
        'education',
        'interest',
        'learning_goal',
        'preference'
      )
    ),

  constraint user_memories_confidence_check
    check (
      confidence >= 0
      and confidence <= 1
    )
);

-- One current value for each logical memory key per user.
create unique index if not exists
  user_memories_user_id_memory_key_uidx
on public.user_memories (
  user_id,
  memory_key
);

-- Fast loading of a user's memories.
create index if not exists
  user_memories_user_id_updated_at_idx
on public.user_memories (
  user_id,
  updated_at desc
);

-- Useful for category-specific retrieval later.
create index if not exists
  user_memories_user_id_category_idx
on public.user_memories (
  user_id,
  category
);

alter table public.user_memories
enable row level security;

drop policy if exists
  "Users can read own memories"
on public.user_memories;

create policy
  "Users can read own memories"
on public.user_memories
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists
  "Users can insert own memories"
on public.user_memories;

create policy
  "Users can insert own memories"
on public.user_memories
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists
  "Users can update own memories"
on public.user_memories;

create policy
  "Users can update own memories"
on public.user_memories
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

drop policy if exists
  "Users can delete own memories"
on public.user_memories;

create policy
  "Users can delete own memories"
on public.user_memories
for delete
to authenticated
using (
  auth.uid() = user_id
);

-- Keep updated_at current automatically.
create or replace function public.set_user_memories_updated_at()
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
  set_user_memories_updated_at
on public.user_memories;

create trigger
  set_user_memories_updated_at
before update
on public.user_memories
for each row
execute function public.set_user_memories_updated_at();

comment on table public.user_memories is
  'Persistent facts and preferences learned about a user during AI conversations.';

comment on column public.user_memories.memory_key is
  'Stable logical identifier such as occupation, city, favorite_topic, or learning_goal.';

comment on column public.user_memories.memory_value is
  'Human-readable remembered value that may be supplied to the tutor context.';

comment on column public.user_memories.confidence is
  'Confidence from 0 to 1 that this memory accurately reflects a stable user fact.';

comment on column public.user_memories.source_conversation_id is
  'Conversation where the current value was most recently learned or confirmed.';
