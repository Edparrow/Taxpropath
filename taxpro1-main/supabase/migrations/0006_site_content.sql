-- Editable site content behind the admin panel: banners, taxonomy, industries,
-- brands, testimonials and about sections. Safe to run more than once.
--
-- Every table follows the same shape so one generic admin CRUD can drive them:
--   sort_order   -- manual ordering in listings (ascending)
--   is_published -- hidden from the public site when false
--   created_at   -- tiebreaker for ordering

-- ---------------------------------------------------------------- banners
create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  image_url   text,
  cta_label   text,
  cta_href    text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- categories
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists subcategories_category_idx on subcategories (category_id);

-- ------------------------------------------------------------- industries
create table if not exists industries (
  id          uuid primary key default gen_random_uuid(),
  -- Unique so the seed at the bottom stays idempotent across re-runs.
  name        text not null unique,
  -- lucide-react icon name, e.g. "Landmark". Rendered by the homepage tiles.
  icon        text,
  description text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- brands
create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  website_url text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------- testimonials
create table if not exists testimonials (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  quote       text not null,
  avatar_url  text,
  rating      int check (rating is null or rating between 1 and 5),
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------- about sections
create table if not exists about_sections (
  id          uuid primary key default gen_random_uuid(),
  heading     text not null,
  body        text,
  image_url   text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------------- RLS
/*
 * Same split as the catalog in 0005: anonymous visitors read published rows,
 * admins read and write everything. is_admin() is SECURITY DEFINER so these
 * policies don't recurse through the profiles table's own RLS.
 */
do $$
declare
  t text;
begin
  foreach t in array array[
    'banners', 'categories', 'subcategories',
    'industries', 'brands', 'testimonials', 'about_sections'
  ]
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

-- ----------------------------------------------------------- seed taxonomy
-- Mirrors the categories the public site already navigates by.
insert into categories (name, slug, description, sort_order)
values ('Webinar', 'webinar', 'All CPE and CE webinar products.', 0)
on conflict (slug) do nothing;

insert into subcategories (category_id, name, slug, sort_order)
select c.id, v.name, v.slug, v.sort_order
from categories c
cross join (values
  ('Upcoming Webinar', 'upcoming-webinar', 0),
  ('Pre Recorded Webinar', 'pre-recorded-webinar', 1)
) as v(name, slug, sort_order)
where c.slug = 'webinar'
on conflict (slug) do nothing;

/*
 * Backfills the unique constraint for a table created by an earlier revision of
 * this file. Must run before the insert below, which needs it as the ON CONFLICT
 * target.
 */
do $$
begin
  alter table industries add constraint industries_name_key unique (name);
exception when duplicate_table or duplicate_object then null;
end $$;

insert into industries (name, icon, sort_order)
values
  ('Banking & Taxation', 'Landmark', 0),
  ('Housing & Taxation', 'Hammer', 1),
  ('Sales & Leadership', 'LineChart', 2),
  ('Education', 'GraduationCap', 3)
on conflict (name) do nothing;
