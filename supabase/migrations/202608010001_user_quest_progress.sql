-- TalkHero: агрегований прогрес користувача в режимі «Пригода»
-- quest_runs залишається історією кожного проходження.
-- user_quest_progress зберігає найкращий результат і стан доступності місії.

create table if not exists public.user_quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,

  status text not null default 'locked'
    check (status in ('locked', 'available', 'in_progress', 'completed')),

  best_score numeric not null default 0
    check (best_score >= 0),

  best_score_percentage numeric not null default 0
    check (
      best_score_percentage >= 0
      and best_score_percentage <= 100
    ),

  stars integer not null default 0
    check (stars between 0 and 3),

  times_started integer not null default 0
    check (times_started >= 0),

  times_completed integer not null default 0
    check (times_completed >= 0),

  first_started_at timestamptz,
  last_started_at timestamptz,
  first_completed_at timestamptz,
  last_completed_at timestamptz,
  unlocked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, quest_id)
);

create index if not exists user_quest_progress_user_id_idx
  on public.user_quest_progress(user_id);

create index if not exists user_quest_progress_quest_id_idx
  on public.user_quest_progress(quest_id);

create index if not exists user_quest_progress_user_status_idx
  on public.user_quest_progress(user_id, status);

alter table public.user_quest_progress enable row level security;

drop policy if exists
  "Users can read own quest progress"
  on public.user_quest_progress;

create policy
  "Users can read own quest progress"
  on public.user_quest_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Записи створює і оновлює лише серверний тригер.
-- Прямі INSERT/UPDATE/DELETE з клієнта навмисно не дозволяються.

create or replace function public.calculate_quest_stars(
  score_value numeric,
  max_score_value numeric
)
returns integer
language sql
immutable
as $$
  select case
    when coalesce(max_score_value, 0) <= 0 then 0
    when (score_value / max_score_value) * 100 >= 85 then 3
    when (score_value / max_score_value) * 100 >= 60 then 2
    when (score_value / max_score_value) * 100 > 0 then 1
    else 0
  end;
$$;

create or replace function public.sync_user_quest_progress_from_run()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  score_percentage numeric := 0;
  calculated_stars integer := 0;
  next_quest_id uuid;
begin
  if new.max_score > 0 then
    score_percentage :=
      least(
        100,
        greatest(
          0,
          round((new.score / new.max_score) * 100, 2)
        )
      );
  end if;

  calculated_stars :=
    public.calculate_quest_stars(new.score, new.max_score);

  -- Перший запуск або повторний запуск місії.
  if tg_op = 'INSERT' then
    insert into public.user_quest_progress (
      user_id,
      quest_id,
      status,
      times_started,
      first_started_at,
      last_started_at,
      unlocked_at
    )
    values (
      new.user_id,
      new.quest_id,
      case
        when new.status = 'completed' then 'completed'
        else 'in_progress'
      end,
      1,
      new.started_at,
      new.started_at,
      new.started_at
    )
    on conflict (user_id, quest_id)
    do update set
      status = case
        when public.user_quest_progress.status = 'completed'
          then 'completed'
        when excluded.status = 'completed'
          then 'completed'
        else 'in_progress'
      end,
      times_started =
        public.user_quest_progress.times_started + 1,
      first_started_at =
        coalesce(
          public.user_quest_progress.first_started_at,
          excluded.first_started_at
        ),
      last_started_at = excluded.last_started_at,
      unlocked_at =
        coalesce(
          public.user_quest_progress.unlocked_at,
          excluded.unlocked_at
        ),
      updated_at = now();
  end if;

  -- Завершення місії.
  if new.status = 'completed'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from new.status
     )
  then
    insert into public.user_quest_progress (
      user_id,
      quest_id,
      status,
      best_score,
      best_score_percentage,
      stars,
      times_started,
      times_completed,
      first_started_at,
      last_started_at,
      first_completed_at,
      last_completed_at,
      unlocked_at
    )
    values (
      new.user_id,
      new.quest_id,
      'completed',
      new.score,
      score_percentage,
      calculated_stars,
      case when tg_op = 'INSERT' then 1 else 0 end,
      1,
      new.started_at,
      new.started_at,
      new.completed_at,
      new.completed_at,
      new.started_at
    )
    on conflict (user_id, quest_id)
    do update set
      status = 'completed',
      best_score =
        greatest(
          public.user_quest_progress.best_score,
          excluded.best_score
        ),
      best_score_percentage =
        greatest(
          public.user_quest_progress.best_score_percentage,
          excluded.best_score_percentage
        ),
      stars =
        greatest(
          public.user_quest_progress.stars,
          excluded.stars
        ),
      times_completed =
        public.user_quest_progress.times_completed + 1,
      first_completed_at =
        coalesce(
          public.user_quest_progress.first_completed_at,
          excluded.first_completed_at
        ),
      last_completed_at = excluded.last_completed_at,
      updated_at = now();

    -- Знаходимо наступну опубліковану місію в тому самому епізоді.
    select q_next.id
    into next_quest_id
    from public.quests q_current
    join public.quests q_next
      on q_next.episode_id = q_current.episode_id
     and q_next.status = 'published'
     and (
       q_next.order_index > q_current.order_index
       or (
         q_next.order_index = q_current.order_index
         and q_next.id > q_current.id
       )
     )
    where q_current.id = new.quest_id
    order by q_next.order_index, q_next.id
    limit 1;

    if next_quest_id is not null then
      insert into public.user_quest_progress (
        user_id,
        quest_id,
        status,
        unlocked_at
      )
      values (
        new.user_id,
        next_quest_id,
        'available',
        coalesce(new.completed_at, now())
      )
      on conflict (user_id, quest_id)
      do update set
        status = case
          when public.user_quest_progress.status in (
            'in_progress',
            'completed'
          )
            then public.user_quest_progress.status
          else 'available'
        end,
        unlocked_at =
          coalesce(
            public.user_quest_progress.unlocked_at,
            excluded.unlocked_at
          ),
        updated_at = now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  sync_user_quest_progress_from_run_trigger
  on public.quest_runs;

create trigger sync_user_quest_progress_from_run_trigger
after insert or update of status, score, max_score, completed_at
on public.quest_runs
for each row
execute function public.sync_user_quest_progress_from_run();

-- Відновлюємо агрегований прогрес із уже наявних завершених проходжень.
insert into public.user_quest_progress (
  user_id,
  quest_id,
  status,
  best_score,
  best_score_percentage,
  stars,
  times_started,
  times_completed,
  first_started_at,
  last_started_at,
  first_completed_at,
  last_completed_at,
  unlocked_at
)
select
  runs.user_id,
  runs.quest_id,
  case
    when bool_or(runs.status = 'completed') then 'completed'
    else 'in_progress'
  end,
  max(runs.score),
  max(
    case
      when runs.max_score > 0
        then least(
          100,
          greatest(
            0,
            round((runs.score / runs.max_score) * 100, 2)
          )
        )
      else 0
    end
  ),
  max(
    public.calculate_quest_stars(
      runs.score,
      runs.max_score
    )
  ),
  count(*)::integer,
  count(*) filter (
    where runs.status = 'completed'
  )::integer,
  min(runs.started_at),
  max(runs.started_at),
  min(runs.completed_at) filter (
    where runs.status = 'completed'
  ),
  max(runs.completed_at) filter (
    where runs.status = 'completed'
  ),
  min(runs.started_at)
from public.quest_runs runs
group by runs.user_id, runs.quest_id
on conflict (user_id, quest_id)
do update set
  status = excluded.status,
  best_score =
    greatest(
      public.user_quest_progress.best_score,
      excluded.best_score
    ),
  best_score_percentage =
    greatest(
      public.user_quest_progress.best_score_percentage,
      excluded.best_score_percentage
    ),
  stars =
    greatest(
      public.user_quest_progress.stars,
      excluded.stars
    ),
  times_started =
    greatest(
      public.user_quest_progress.times_started,
      excluded.times_started
    ),
  times_completed =
    greatest(
      public.user_quest_progress.times_completed,
      excluded.times_completed
    ),
  first_started_at =
    coalesce(
      public.user_quest_progress.first_started_at,
      excluded.first_started_at
    ),
  last_started_at =
    greatest(
      public.user_quest_progress.last_started_at,
      excluded.last_started_at
    ),
  first_completed_at =
    coalesce(
      public.user_quest_progress.first_completed_at,
      excluded.first_completed_at
    ),
  last_completed_at =
    greatest(
      public.user_quest_progress.last_completed_at,
      excluded.last_completed_at
    ),
  unlocked_at =
    coalesce(
      public.user_quest_progress.unlocked_at,
      excluded.unlocked_at
    ),
  updated_at = now();

-- Для кожного користувача з історією квестів відкриваємо першу
-- опубліковану місію кожного епізоду, якщо прогресу ще немає.
insert into public.user_quest_progress (
  user_id,
  quest_id,
  status,
  unlocked_at
)
select distinct
  users.user_id,
  first_quests.id,
  'available',
  now()
from (
  select distinct user_id
  from public.quest_runs
) users
cross join lateral (
  select q.id
  from public.quests q
  where q.status = 'published'
    and not exists (
      select 1
      from public.quests previous_q
      where previous_q.episode_id = q.episode_id
        and previous_q.status = 'published'
        and (
          previous_q.order_index < q.order_index
          or (
            previous_q.order_index = q.order_index
            and previous_q.id < q.id
          )
        )
    )
) first_quests
on conflict (user_id, quest_id) do nothing;
