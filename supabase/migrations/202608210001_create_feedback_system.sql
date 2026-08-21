create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,

  name text,
  email text not null,

  category text not null
    check (
      category in (
        'bug',
        'idea',
        'question',
        'other'
      )
    ),

  message text not null,

  attachment_paths text[] not null default '{}',

  status text not null default 'new'
    check (
      status in (
        'new',
        'reviewing',
        'resolved',
        'closed'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_submissions_created_at_idx
  on public.feedback_submissions (created_at desc);

create index if not exists feedback_submissions_status_idx
  on public.feedback_submissions (status);

create index if not exists feedback_submissions_user_id_idx
  on public.feedback_submissions (user_id);

alter table public.feedback_submissions
  enable row level security;

-- No anon/authenticated INSERT policy intentionally.
-- Feedback is written only through the server API
-- using the Supabase service-role/admin client.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'feedback-attachments',
  'feedback-attachments',
  false,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
