-- =====================================================================
-- 0003 — SkillSync parity: Error Monitor, saved carts, order delete/edit,
-- customer emails, admin roles.
-- Run after 0001 and 0002, in the SQL editor of each database (dev, prod).
-- Safe to re-run: every change checks whether it already exists.
-- =====================================================================

-- ------------------------------------------------------- Error Monitor
-- Everything that went wrong, from the server (crashes, database errors) and
-- from visitors' browsers (script errors, files that failed to load, failed
-- requests, 404s). Written only by the server with the service role; read by
-- the Super Admin on Admin > Error Monitor.
create table if not exists error_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        text not null,          -- server, action, route, db_error, js, js_resource, js_ajax, not_found
  seen        boolean not null default false, -- did the visitor see an error page/message?
  ref         text,                   -- reference shown to the visitor (error digest)
  message     text not null,
  url         text,
  method      text,
  user_id     uuid references auth.users(id) on delete set null,
  user_email  text,
  ip          text,
  user_agent  text,
  details     jsonb not null default '{}'::jsonb
);

create index if not exists error_events_created_at_idx on error_events (created_at desc);
create index if not exists error_events_type_idx on error_events (type, created_at desc);

alter table error_events enable row level security;
grant select, delete on error_events to authenticated;
grant all on error_events to service_role;

drop policy if exists "super admins read errors" on error_events;
create policy "super admins read errors" on error_events
  for select using (public.is_super_admin());
drop policy if exists "super admins clear errors" on error_events;
create policy "super admins clear errors" on error_events
  for delete using (public.is_super_admin());

-- ------------------------------------------------------- saved carts
-- The cart lives in the browser; a signed-in customer's copy is mirrored here
-- so Admin > Registered Users can show what each person has in their cart.
create table if not exists user_carts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_carts enable row level security;
grant select, insert, update, delete on user_carts to authenticated, service_role;

drop policy if exists "own cart" on user_carts;
create policy "own cart" on user_carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admins read carts" on user_carts;
create policy "admins read carts" on user_carts
  for select using (public.is_admin());

-- ------------------------------------------------------- orders
alter table orders add column if not exists deleted_at timestamptz;
alter table orders add column if not exists deleted_by uuid references auth.users(id) on delete set null;
alter table orders add column if not exists confirmation_sent_at timestamptz;
alter table orders add column if not exists incomplete_email_sent_at timestamptz;
alter table orders add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table orders add column if not exists updated_at timestamptz;

create index if not exists orders_live_idx on orders (status, created_at desc) where deleted_at is null;

-- A deleted order disappears from the customer's account too.
drop policy if exists "own orders" on orders;
create policy "own orders" on orders
  for select using (auth.uid() = user_id and deleted_at is null);

-- ------------------------------------------------------- profiles
-- Set once the welcome email has gone out, so it is never sent twice.
alter table profiles add column if not exists welcome_sent_at timestamptz;

-- ------------------------------------------------------- admin roles
-- A free-text job title shown in the admin top bar (e.g. "Sales", "Support").
alter table admin_users add column if not exists role text;
