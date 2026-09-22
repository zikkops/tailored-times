-- Tailored Times: initial schema (21 Sep 2026).
-- Public visitors never touch tables directly: orders and contact messages
-- are inserted by server actions with the service role, which recalculate
-- the price first. Only users listed in `admins` can read or change data.

-- ---------------------------------------------------------------- admins

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ------------------------------------------------------------- templates

create table public.templates (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  legacy_slug  text unique,
  name         text not null,
  category     text not null,
  blurb        text not null default '',
  sort_order   int  not null default 0,
  active       boolean not null default true,
  preview_images text[] not null default '{}',
  -- Customisation fields for step 2 of the order (stories, names, photos…).
  -- Array of { key, label, type, required, help, options }.
  form_schema  jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- pricing

-- One row holding the whole PricingConfig (src/lib/pricing.ts) as JSON, so
-- admins can edit prices without a deploy.
create table public.pricing (
  id         int primary key default 1 check (id = 1),
  config     jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

-- ---------------------------------------------------------------- orders

create type public.order_status as enum
  ('ordered', 'created', 'printing', 'delivering', 'delivered', 'cancelled');

create sequence public.order_number_seq start 1;

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique
                   default 'TT-' || lpad(nextval('public.order_number_seq')::text, 6, '0'),
  template_id    uuid references public.templates (id) on delete set null,
  template_name  text not null,           -- kept even if the template is renamed or removed
  format         text not null check (format in ('Hard copy', 'Digital copy', 'Cover page')),
  size           text not null check (size in ('Tabloid', 'Broadsheet')),
  pages          int  not null check (pages > 0),
  copies         int  not null check (copies > 0),
  frames         boolean not null default false,
  designer       boolean not null default false,
  price          numeric(10, 2) not null,  -- calculated on the server
  currency       text not null default 'USD',
  status         public.order_status not null default 'ordered',
  payment_method text not null default 'cod',  -- cash on delivery only, for now
  customer_name  text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index orders_status_idx  on public.orders (status);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_answers (
  id        bigint generated always as identity primary key,
  order_id  uuid not null references public.orders (id) on delete cascade,
  field_key text not null,
  label     text not null,
  value     text not null default ''
);

create table public.order_files (
  id            bigint generated always as identity primary key,
  order_id      uuid not null references public.orders (id) on delete cascade,
  field_key     text,
  storage_path  text not null,
  original_name text,
  created_at    timestamptz not null default now()
);

create table public.order_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status  public.order_status,
  note       text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------ contact messages

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------- updated_at trigger

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger templates_touch before update on public.templates
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger pricing_touch before update on public.pricing
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------- RLS

alter table public.admins           enable row level security;
alter table public.templates        enable row level security;
alter table public.pricing          enable row level security;
alter table public.orders           enable row level security;
alter table public.order_answers    enable row level security;
alter table public.order_files      enable row level security;
alter table public.order_events     enable row level security;
alter table public.contact_messages enable row level security;

-- Anyone may read active templates and the price list (the calculator needs them).
create policy "public reads active templates" on public.templates
  for select using (active or public.is_admin());
create policy "public reads pricing" on public.pricing
  for select using (true);

-- Admins manage everything. No insert policy for anon: public writes go
-- through the service role in server actions.
create policy "admins manage templates" on public.templates
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage pricing" on public.pricing
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order answers" on public.order_answers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order files" on public.order_files
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order events" on public.order_events
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage contact messages" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read admins" on public.admins
  for select using (public.is_admin());

-- --------------------------------------------------------------- storage

-- Private bucket for customer photos; admins view them through signed URLs.
insert into storage.buckets (id, name, public)
values ('order-uploads', 'order-uploads', false)
on conflict (id) do nothing;

create policy "admins read order uploads" on storage.objects
  for select using (bucket_id = 'order-uploads' and public.is_admin());
