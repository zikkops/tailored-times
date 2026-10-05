-- Tailored Times: locks on the doors (6 Oct 2026)
--
-- Two things:
--   1. A counter the site uses to slow down anyone hammering the forms or
--      guessing passwords. It lives in the database so the count is shared by
--      every server and survives a restart, unlike counting in memory.
--   2. Past orders are only claimed by an account whose email has been
--      confirmed, so nobody can sign up as someone else and read their order.

-- ------------------------------------------------------------ rate limits

create table public.rate_limits (
  bucket       text not null,        -- which form: 'order', 'contact', 'signin', ...
  subject      text not null,        -- hashed visitor address, or hashed email
  window_start timestamptz not null, -- start of the window this count belongs to
  hits         integer not null default 0,
  primary key (bucket, subject, window_start)
);

create index rate_limits_window_idx on public.rate_limits (window_start);

-- Nobody reaches this table directly: no policies, so RLS denies every role.
-- The site counts through hit_rate_limit() below, called with the secret key.
alter table public.rate_limits enable row level security;

-- Counts one attempt and says whether it is still allowed. Windows are fixed
-- blocks of p_window_seconds, which is rough but cheap and good enough to stop
-- a script: the first p_max attempts in a window pass, the rest do not.
create or replace function public.hit_rate_limit(
  p_bucket text,
  p_subject text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits   integer;
begin
  if p_bucket is null or p_subject is null or p_max is null or p_window_seconds is null then
    return true;
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (bucket, subject, window_start, hits)
  values (p_bucket, p_subject, v_window, 1)
  on conflict (bucket, subject, window_start)
    do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  -- Now and then, clear out windows nobody will look at again.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

-- Only the secret key may count. Visitors never call this themselves.
revoke all on function public.hit_rate_limit(text, text, integer, integer) from public, anon, authenticated;

-- --------------------------------------------------- claiming past orders

-- Same as before, but an account only picks up guest orders once its email has
-- actually been confirmed. Without that, signing up with someone else's email
-- would hand over their order, address and photos.
create or replace function public.claim_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed integer;
  v_email text;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select u.email into v_email
    from auth.users u
   where u.id = auth.uid()
     and u.email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    return 0;
  end if;

  update public.orders o
     set user_id = auth.uid()
   where o.user_id is null
     and lower(o.customer_email) = lower(v_email)
     and coalesce(o.customer_email, '') <> '';

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;
