-- Separate admin panel (/admin-login), like the SkillSync admin:
--
--   * admin_users: admin accounts, kept apart from customers. One or more
--     Super Admins see everything and manage the other admins; every other
--     admin gets, per sidebar section, no access, 'view' or 'edit'.
--     Logins still go through Supabase Auth, which stores the passwords.
--   * is_admin() now reads admin_users, so every existing admin RLS policy
--     follows automatically. profiles.role is dropped — customers have no role.
--   * activity_logs: who did what in the admin panel. Append-only.
--   * orders: payment_method + remarks for manual orders; order_items gets the
--     Order Sheet checklist (portal access sent / certificate sent).
--   * profiles are created only for TaxProPath sign-ups (the auth users are
--     shared with webtiq), and now keep every field the register form sends.
--
-- Run once, after 0001_initial_schema.sql.

-- ================================================================ admin_users
create table admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  is_super    boolean not null default false,
  -- { "<section key>": "view" | "edit" }, e.g. {"courses":"edit","orders":"view"}.
  -- Ignored for Super Admins. Section keys live in src/lib/admin/permissions.ts.
  permissions jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid() and is_active
  );
$$;

create function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid() and is_active and is_super
  );
$$;

alter table admin_users enable row level security;
grant select, insert, update, delete on admin_users to anon, authenticated, service_role;
grant execute on function public.is_super_admin() to anon, authenticated;

-- An admin can read their own row (the panel needs their permissions); a Super
-- Admin can read everyone. All writes go through the server's service role
-- after it has checked the caller is a Super Admin.
create policy "read own admin row" on admin_users
  for select using (id = auth.uid() or public.is_super_admin());

-- ============================================================== activity_logs
create table activity_logs (
  id             uuid primary key default gen_random_uuid(),
  admin_id       uuid references auth.users(id) on delete set null,
  admin_email    text,
  action         text not null,          -- e.g. LOGIN, CREATE_COURSE, MARK_PAID
  description    text not null,
  reference_type text,                   -- e.g. 'course', 'order'
  reference_id   text,
  created_at     timestamptz not null default now()
);

create index activity_logs_created_at_idx on activity_logs (created_at desc);

alter table activity_logs enable row level security;
grant select, insert on activity_logs to authenticated, service_role;

-- Admins add entries in their own name and read the log; nobody edits or
-- deletes it from the app.
create policy "admins add own log entries" on activity_logs
  for insert with check (public.is_admin() and admin_id = auth.uid());
create policy "admins read logs" on activity_logs
  for select using (public.is_admin());

-- ===================================================================== orders
alter table orders
  add column payment_method text not null default 'paypal'
    check (payment_method in ('paypal', 'manual')),
  add column remarks    text,
  add column created_by uuid references auth.users(id) on delete set null;

-- Order Sheet checklist, per bought item.
alter table order_items
  add column portal_access_sent boolean not null default false,
  add column certificate_sent   boolean not null default false;

-- =================================================================== profiles
-- The old role column let a policy decide admin access from the customer's own
-- row. Admins now live in admin_users, so it goes.
drop policy if exists "update own profile" on profiles;
alter table profiles drop column role;

create policy "update own profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

/*
 * auth.users is shared with webtiq, so only sign-ups from this site (the
 * register page sends site = 'taxpropath') get a TaxProPath profile — that
 * keeps the other site's users out of "Register User".
 */
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if m->>'site' is distinct from 'taxpropath' then
    return new;
  end if;

  insert into public.profiles (
    id, first_name, last_name, phone, company, address1, address2,
    city, zip, ptin, country, region
  )
  values (
    new.id, m->>'first_name', m->>'last_name', m->>'phone', m->>'company',
    m->>'address1', m->>'address2', m->>'city', m->>'zip', m->>'ptin',
    m->>'country', m->>'region'
  );
  return new;
end;
$$;

notify pgrst, 'reload schema';

-- ======================================================= first Super Admin
-- After running this file, make your own account the Super Admin (it must
-- already exist under Authentication → Users):
--
--   insert into admin_users (id, name, email, is_super)
--   select id, 'Super Admin', email, true from auth.users
--   where email = 'you@example.com';
