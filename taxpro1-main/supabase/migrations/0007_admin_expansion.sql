-- Admin panel parity pass: blog, gallery, newsletter, coupons, plus SEO/FAQ on
-- webinars and a missing admin-read policy on contact_messages. Safe to run
-- more than once.

-- --------------------------------------------------------------- blog_posts
create table if not exists blog_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  excerpt     text,
  body        text,
  cover_image_url text,
  author_name text,
  seo_title       text,
  seo_description text,
  published_at timestamptz not null default now(),
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ gallery_images
create table if not exists gallery_images (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  image_url   text not null,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------- newsletter_subscribers
create table if not exists newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  is_active   boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ------------------------------------------------------------------- coupons
create table if not exists coupons (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  description text,
  discount_type text not null default 'fixed' check (discount_type in ('fixed', 'percent')),
  -- 'fixed' -> whole dollars off, in cents. 'percent' -> 1-100.
  discount_value int not null check (discount_value > 0),
  min_order_cents int not null default 0,
  max_redemptions int,                  -- null = unlimited
  times_redeemed  int not null default 0,
  starts_at   timestamptz,
  expires_at  timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------- orders: coupon tracking
alter table orders
  add column if not exists coupon_code    text,
  add column if not exists discount_cents int not null default 0;

-- --------------------------------------------------------- webinars: SEO/FAQ
alter table webinars
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  -- Array of {question, answer} objects, rendered on the detail page.
  add column if not exists faq jsonb not null default '[]'::jsonb;

-- -------------------------------------------------------------------- RLS
-- Same split as 0006: anonymous visitors read published rows, admins read and
-- write everything.
do $$
declare
  t text;
begin
  foreach t in array array['blog_posts', 'gallery_images']
  loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists %I on %I', t || '_public_read', t);
    execute format(
      'create policy %I on %I for select using (is_published or public.is_admin())',
      t || '_public_read', t
    );

    execute format('drop policy if exists %I on %I', t || '_admin_write', t);
    execute format(
      'create policy %I on %I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_write', t
    );
  end loop;
end $$;

-- newsletter_subscribers: anyone may sign themselves up; nobody may read the
-- list back except admins (same "write-only mailbox" shape as contact_messages).
alter table newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on newsletter_subscribers;
create policy "anyone can subscribe" on newsletter_subscribers
  for insert with check (true);

drop policy if exists "admins manage subscribers" on newsletter_subscribers;
create policy "admins manage subscribers" on newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- coupons: deliberately NO public select policy. A visitor's browser must
-- never be able to list every valid code — validating a code happens through
-- a server route using the service role, not a client-side table read.
alter table coupons enable row level security;

drop policy if exists "admins manage coupons" on coupons;
create policy "admins manage coupons" on coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- contact_messages: 0001_init.sql only granted insert. Admins need to read
-- (and clear) the enquiry inbox.
drop policy if exists "admins read contact messages" on contact_messages;
create policy "admins read contact messages" on contact_messages
  for select using (public.is_admin());

drop policy if exists "admins delete contact messages" on contact_messages;
create policy "admins delete contact messages" on contact_messages
  for delete using (public.is_admin());

notify pgrst, 'reload schema';
