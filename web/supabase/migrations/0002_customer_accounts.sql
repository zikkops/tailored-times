-- Customer accounts (2 Oct 2026).
--
-- Ordering stays open to everyone: an order placed while signed out has
-- user_id null. When someone signs up or signs in with the same email, their
-- past orders are claimed (see claim_orders below), so "my orders" shows them.
--
-- Customers can read their own orders and edit their own profile; they can
-- never change an order. Admins keep full access through is_admin().

-- -------------------------------------------------------------- profiles

create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  phone      text not null default '',
  email      text not null default '',
  address    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

create policy "people read their own profile" on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());
create policy "people create their own profile" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "people update their own profile" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- A profile row appears as soon as someone signs up, filled from the sign-up
-- form's metadata when it is there.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------- orders belong to people

alter table public.orders add column user_id uuid references auth.users (id) on delete set null;
create index orders_user_idx on public.orders (user_id);

create policy "people read their own orders" on public.orders
  for select using (user_id = auth.uid());

create policy "people read their own order answers" on public.order_answers
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "people read their own order files" on public.order_files
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "people read their own order events" on public.order_events
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Orders placed before signing up: attach the ones with the same email.
create or replace function public.claim_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.orders o
     set user_id = auth.uid()
   where o.user_id is null
     and lower(o.customer_email) = lower((select email from auth.users where id = auth.uid()))
     and coalesce(o.customer_email, '') <> '';

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

grant execute on function public.claim_orders() to authenticated;
