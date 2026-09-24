create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  request_count integer,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_row public.api_rate_limits%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_bucket is null or btrim(p_bucket) = '' then
    raise exception 'Bucket is required';
  end if;

  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.api_rate_limits as arl (
    user_id,
    bucket,
    window_started_at,
    request_count
  )
  values (
    v_user_id,
    p_bucket,
    v_now,
    0
  )
  on conflict (user_id, bucket) do nothing;

  select arl.*
  into v_row
  from public.api_rate_limits as arl
  where arl.user_id = v_user_id
    and arl.bucket = p_bucket
  for update;

  if v_row.window_started_at
       <= v_now - make_interval(secs => p_window_seconds) then

    update public.api_rate_limits as arl
    set
      window_started_at = v_now,
      request_count = 1
    where arl.user_id = v_user_id
      and arl.bucket = p_bucket
    returning arl.*
    into v_row;

    return query
    select
      true,
      1,
      greatest(p_limit - 1, 0),
      0;

    return;
  end if;

  if v_row.request_count >= p_limit then
    return query
    select
      false,
      v_row.request_count,
      0,
      greatest(
        ceil(
          extract(
            epoch from (
              v_row.window_started_at
              + make_interval(secs => p_window_seconds)
              - v_now
            )
          )
        )::integer,
        1
      );

    return;
  end if;

  update public.api_rate_limits as arl
  set request_count = arl.request_count + 1
  where arl.user_id = v_user_id
    and arl.bucket = p_bucket
  returning arl.*
  into v_row;

  return query
  select
    true,
    v_row.request_count,
    greatest(p_limit - v_row.request_count, 0),
    0;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
from public;

grant execute on function public.consume_api_rate_limit(text, integer, integer)
to authenticated;