-- Taxpropath schema: CPE/CE webinar catalog, cart/orders, and user profiles.

create extension if not exists "pgcrypto";

create type webinar_kind as enum ('upcoming', 'pre_recorded');
create type order_status as enum ('pending', 'paid', 'cancelled', 'refunded');

-- ---------------------------------------------------------------- presenters
create table presenters (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  title       text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- webinars
create table webinars (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  kind           webinar_kind not null default 'upcoming',
  presenter_id   uuid references presenters(id) on delete set null,
  event_at       timestamptz not null,
  duration_mins  int not null default 60,
  product_code   text,
  description    text,
  -- Bullet lists rendered on the detail page.
  learning_objectives text[] not null default '{}',
  topics_covered      text[] not null default '{}',
  who_should_attend   text[] not null default '{}',
  -- Credits block.
  cpe_credit      numeric(3,1),
  field_of_study  text,
  prerequisites   text default 'None',
  learning_level  text,
  delivery_method text default 'Group Internet Based',
  industry        text,
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now()
);

create index webinars_kind_event_at_idx on webinars (kind, event_at);

-- Each webinar sells several delivery formats at different prices.
create table pricing_options (
  id          uuid primary key default gen_random_uuid(),
  webinar_id  uuid not null references webinars(id) on delete cascade,
  label       text not null,          -- e.g. 'LIVE', 'On-Demand + e-TRANSCRIPT'
  description text,                   -- tooltip copy
  price_cents int not null check (price_cents >= 0),
  sort_order  int not null default 0
);

create index pricing_options_webinar_idx on pricing_options (webinar_id, sort_order);

-- ----------------------------------------------------------------- profiles
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  phone       text,
  company     text,
  address1    text,
  address2    text,
  city        text,
  zip         text,
  ptin        text,                   -- required for IRS credits
  country     text,
  region      text,
  created_at  timestamptz not null default now()
);

-- New auth users get a profile row automatically.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------------- orders
create table orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  guest_email   text,                 -- guest checkout
  status        order_status not null default 'pending',
  subtotal_cents int not null default 0,
  billing       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  -- Every order is attributable to either an account or a guest email.
  constraint orders_has_purchaser check (user_id is not null or guest_email is not null)
);

create table order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  webinar_id        uuid not null references webinars(id),
  pricing_option_id uuid not null references pricing_options(id),
  quantity          int not null default 1 check (quantity > 0),
  unit_price_cents  int not null,
  -- Denormalised so historical orders survive catalog edits.
  title_snapshot    text not null,
  option_snapshot   text not null
);

create index order_items_order_idx on order_items (order_id);

-- ------------------------------------------------------------ contact form
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------- RLS
alter table presenters       enable row level security;
alter table webinars         enable row level security;
alter table pricing_options  enable row level security;
alter table profiles         enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table contact_messages enable row level security;

-- Catalog is public read-only; writes go through the service role.
create policy "catalog is public" on presenters      for select using (true);
create policy "catalog is public" on webinars        for select using (true);
create policy "catalog is public" on pricing_options for select using (true);

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own orders" on orders
  for select using (auth.uid() = user_id);
create policy "create own orders" on orders
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "own order items" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "create own order items" on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id
            and (o.user_id = auth.uid() or o.user_id is null))
  );

-- Anyone may submit the contact form; nobody may read it back via the anon key.
create policy "anyone can submit" on contact_messages for insert with check (true);
