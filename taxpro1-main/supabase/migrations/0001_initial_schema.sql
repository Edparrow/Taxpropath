-- TaxProPath database schema: self-study courses, cart/orders (PayPal),
-- coupons, user profiles/admin roles, and the admin-editable site content
-- (banners, categories, industries, brands, testimonials, about, blog,
-- gallery, newsletter, contact form).
--
-- Run once on an empty database (or after supabase/reset_taxpropath.sql).
-- Future schema changes go in new numbered files: 0002_..., 0003_...
--
-- The database may be shared with other sites (e.g. webtiq, whose tables are
-- all prefixed webtiq_), so nothing here touches objects it didn't create.

create extension if not exists "pgcrypto";

create type order_status as enum ('pending', 'paid', 'cancelled', 'refunded');

-- =====================================================================
-- Profiles and admin role
-- =====================================================================

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
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

/*
 * Role lookup used by every admin policy. SECURITY DEFINER so the check itself
 * isn't subject to the profiles RLS it helps enforce — without that, policies
 * referencing profiles would recurse.
 */
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- New sign-ups get a profile row automatically.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Course catalog
-- =====================================================================

create table presenters (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  title       text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table subcategories (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references categories(id) on delete cascade,
  name         text not null,
  slug         text not null unique,
  description  text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create index subcategories_category_idx on subcategories (category_id);

create table courses (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null,
  presenter_id        uuid references presenters(id) on delete set null,
  category_id         uuid references categories(id) on delete set null,
  subcategory_id      uuid references subcategories(id) on delete set null,
  image_url           text,
  -- Paragraphs are blank-line separated; the lists render as bullets.
  description         text,
  learning_objectives text[] not null default '{}',
  topics_covered      text[] not null default '{}',
  who_should_attend   text[] not null default '{}',
  -- Credits block.
  cpe_credit          numeric(3,1),
  field_of_study      text,
  prerequisites       text default 'None',
  learning_level      text,
  -- Link to the course engine (join.us-cpe.com), which plays the recording.
  engine_delivery_id  text,
  engine_program_id   text,
  is_published        boolean not null default true,
  is_featured         boolean not null default false,
  seo_title           text,
  seo_description     text,
  meta_keyword        text,
  -- Array of {question, answer} objects, rendered on the detail page.
  faq                 jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now()
);

create unique index courses_engine_delivery_id_idx
  on courses (engine_delivery_id) where engine_delivery_id is not null;

-- Exactly one row per code per course: the course itself plus up to two add-ons.
create table pricing_options (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  code        text not null check (code in ('SELF_STUDY', 'ETRANSCRIPT', 'SLIDES')),
  label       text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  sort_order  int not null default 0,
  unique (course_id, code)
);

-- =====================================================================
-- Coupons, orders
-- =====================================================================

create table coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  description     text,
  discount_type   text not null default 'fixed' check (discount_type in ('fixed', 'percent')),
  -- 'fixed' -> amount off, in cents. 'percent' -> 1-100.
  discount_value  int not null check (discount_value > 0),
  min_order_cents int not null default 0,
  max_redemptions int,                  -- null = unlimited
  times_redeemed  int not null default 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  guest_email       text,
  status            order_status not null default 'pending',
  subtotal_cents    int not null default 0,
  discount_cents    int not null default 0,
  coupon_code       text,
  currency          text not null default 'USD',
  billing           jsonb not null default '{}'::jsonb,
  paypal_order_id   text,
  paypal_capture_id text,
  paid_at           timestamptz,
  refunded_at       timestamptz,
  created_at        timestamptz not null default now(),
  -- Every order is attributable to either an account or a guest email.
  constraint orders_has_purchaser check (user_id is not null or guest_email is not null)
);

create unique index orders_paypal_order_id_idx
  on orders (paypal_order_id) where paypal_order_id is not null;

-- One row per product bought (course or add-on). Title and price are copied in
-- so an order still reads correctly after the course is edited or deleted.
create table order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  course_slug       text not null,
  pricing_option_id text not null,
  option_code       text,
  quantity          int not null default 1 check (quantity > 0),
  unit_price_cents  int not null,
  title_snapshot    text not null,
  option_snapshot   text not null
);

create index order_items_order_idx on order_items (order_id);

/*
 * Checkout is written by the server after it has re-priced every line against
 * the catalog, never by the browser. Order + items are inserted atomically.
 */
create function public.place_order(
  p_user_id         uuid,
  p_email           text,
  p_billing         jsonb,
  p_items           jsonb,
  p_paypal_order_id text default null,
  p_coupon_code     text default null,
  p_discount_cents  int default 0
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_subtotal int;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  select sum((i->>'unit_price_cents')::int * (i->>'quantity')::int)
  into v_subtotal
  from jsonb_array_elements(p_items) as i;

  if p_discount_cents < 0 or p_discount_cents > v_subtotal then
    raise exception 'discount % is out of range for subtotal %', p_discount_cents, v_subtotal;
  end if;

  insert into orders (
    id, user_id, guest_email, status, subtotal_cents, billing, paypal_order_id,
    coupon_code, discount_cents
  )
  values (
    v_order_id,
    p_user_id,
    case when p_user_id is null then p_email else null end,
    'pending',
    v_subtotal,
    coalesce(p_billing, '{}'::jsonb),
    p_paypal_order_id,
    p_coupon_code,
    p_discount_cents
  );

  insert into order_items (
    order_id, course_slug, pricing_option_id, option_code,
    quantity, unit_price_cents, title_snapshot, option_snapshot
  )
  select
    v_order_id,
    i->>'course_slug',
    i->>'pricing_option_id',
    i->>'option_code',
    (i->>'quantity')::int,
    (i->>'unit_price_cents')::int,
    i->>'title_snapshot',
    i->>'option_snapshot'
  from jsonb_array_elements(p_items) as i;

  return v_order_id;
end;
$$;

/*
 * Flips an order to paid, but only if the amount PayPal actually captured
 * matches subtotal minus discount. A mismatch means tampering somewhere in the
 * round trip, so it must not settle. Counts the coupon redemption on success.
 */
create function public.mark_order_paid(
  p_paypal_order_id   text,
  p_paypal_capture_id text,
  p_captured_cents    int,
  p_currency          text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_expected int;
begin
  select * into v_order from orders where paypal_order_id = p_paypal_order_id;

  if not found then
    raise exception 'no order for paypal order %', p_paypal_order_id;
  end if;

  if v_order.status = 'paid' then
    return v_order.id;              -- already captured; keep this idempotent
  end if;

  v_expected := v_order.subtotal_cents - coalesce(v_order.discount_cents, 0);

  if v_expected <> p_captured_cents then
    raise exception 'captured amount % does not match order total %',
      p_captured_cents, v_expected;
  end if;

  if upper(coalesce(p_currency, 'USD')) <> upper(v_order.currency) then
    raise exception 'captured currency % does not match order currency %',
      p_currency, v_order.currency;
  end if;

  update orders
  set status = 'paid',
      paypal_capture_id = p_paypal_capture_id,
      paid_at = now()
  where id = v_order.id;

  if v_order.coupon_code is not null then
    update coupons set times_redeemed = times_redeemed + 1 where code = v_order.coupon_code;
  end if;

  return v_order.id;
end;
$$;

-- =====================================================================
-- Site content (admin-editable)
-- =====================================================================

create table banners (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  subtitle     text,
  image_url    text,
  cta_label    text,
  cta_href     text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table industries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  icon         text,                  -- lucide-react icon name, e.g. "Landmark"
  description  text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table brands (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  website_url  text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table testimonials (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  author_role  text,
  quote        text not null,
  avatar_url   text,
  rating       int check (rating is null or rating between 1 and 5),
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table about_sections (
  id           uuid primary key default gen_random_uuid(),
  heading      text not null,
  body         text,
  image_url    text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  body            text,
  cover_image_url text,
  author_name     text,
  seo_title       text,
  seo_description text,
  published_at    timestamptz not null default now(),
  sort_order      int not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now()
);

create table gallery_images (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  image_url    text not null,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  is_active       boolean not null default true,
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- The four homepage industry tiles.
insert into industries (name, icon, sort_order) values
  ('Banking & Taxation', 'Landmark', 0),
  ('Housing & Taxation', 'Hammer', 1),
  ('Sales & Leadership', 'LineChart', 2),
  ('Education', 'GraduationCap', 3);

-- =====================================================================
-- Access: grants + row level security
-- =====================================================================

-- Table privileges for the API roles; RLS below decides which rows they reach.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'presenters', 'categories', 'subcategories', 'courses',
    'pricing_options', 'coupons', 'orders', 'order_items', 'banners',
    'industries', 'brands', 'testimonials', 'about_sections', 'blog_posts',
    'gallery_images', 'newsletter_subscribers', 'contact_messages'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'grant select, insert, update, delete on %I to anon, authenticated, service_role', t
    );
  end loop;
end $$;

grant execute on function public.is_admin() to anon, authenticated;

-- Only the server (service role) may place or settle orders: the anon key is
-- public, so a browser-callable RPC would let anyone forge prices.
revoke all on function public.place_order(uuid, text, jsonb, jsonb, text, text, int) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, jsonb, jsonb, text, text, int) to service_role;
revoke all on function public.mark_order_paid(text, text, int, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text, int, text) to service_role;

-- ---------------------------------------------------------- profiles
create policy "read own profile" on profiles
  for select using (id = auth.uid() or public.is_admin());

-- Users may edit their own details but never their role; role changes happen
-- only through the SQL editor or the service role.
create policy "update own profile" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- ---------------------------------------------------------- catalog
-- Visitors see published courses only; admins see and change everything.
create policy "public reads published courses" on courses
  for select using (is_published or public.is_admin());
create policy "admins write courses" on courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads pricing" on pricing_options
  for select using (true);
create policy "admins write pricing" on pricing_options
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads presenters" on presenters
  for select using (true);
create policy "admins write presenters" on presenters
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------- orders
-- Written only by the server via place_order / mark_order_paid.
create policy "own orders" on orders
  for select using (auth.uid() = user_id);
create policy "admins read all orders" on orders
  for select using (public.is_admin());

create policy "own order items" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "admins read all order items" on order_items
  for select using (public.is_admin());

-- Deliberately no public read: a browser must never be able to list valid
-- codes. Checkout validates a code server-side with the service role.
create policy "admins manage coupons" on coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------- site content
-- Visitors read published rows; admins read and write everything.
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'subcategories', 'banners', 'industries', 'brands',
    'testimonials', 'about_sections', 'blog_posts', 'gallery_images'
  ]
  loop
    execute format(
      'create policy %I on %I for select using (is_published or public.is_admin())',
      t || '_public_read', t
    );
    execute format(
      'create policy %I on %I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_write', t
    );
  end loop;
end $$;

-- Write-only mailboxes: anyone may submit, only admins may read.
create policy "anyone can subscribe" on newsletter_subscribers
  for insert with check (true);
create policy "admins manage subscribers" on newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone can submit" on contact_messages
  for insert with check (true);
create policy "admins read contact messages" on contact_messages
  for select using (public.is_admin());
create policy "admins delete contact messages" on contact_messages
  for delete using (public.is_admin());

notify pgrst, 'reload schema';
