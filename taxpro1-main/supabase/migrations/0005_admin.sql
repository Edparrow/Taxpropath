-- Admin roles, webinar video hosting, and the RLS that goes with them.
-- Safe to run more than once.

-- ------------------------------------------------------------------ roles
alter table profiles
  add column if not exists role text not null default 'user';

do $$
begin
  alter table profiles add constraint profiles_role_check
    check (role in ('user', 'admin'));
exception when duplicate_object then null;
end $$;

/*
 * Role lookup used by every admin policy below. SECURITY DEFINER so the check
 * itself isn't subject to the profiles RLS it helps enforce — without that,
 * policies referencing profiles would recurse.
 */
create or replace function public.is_admin()
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

grant execute on function public.is_admin() to authenticated, anon;

-- ------------------------------------------------------- webinar video/publish
/*
 * Two ways to attach a recording:
 *   video_path — object key in the private bucket (uploaded through the admin)
 *   video_url  — externally hosted (Vimeo/YouTube/CDN)
 * video_path wins when both are set.
 */
alter table webinars
  add column if not exists video_path   text,
  add column if not exists video_url    text,
  add column if not exists video_status text not null default 'none',
  add column if not exists is_published boolean not null default true;

do $$
begin
  alter table webinars add constraint webinars_video_status_check
    check (video_status in ('none', 'ready'));
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------ catalog RLS
alter table webinars        enable row level security;
alter table pricing_options enable row level security;
alter table presenters      enable row level security;

-- Public may read published catalog rows; admins see and change everything.
drop policy if exists "public reads published webinars" on webinars;
create policy "public reads published webinars" on webinars
  for select using (is_published or public.is_admin());

drop policy if exists "admins write webinars" on webinars;
create policy "admins write webinars" on webinars
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads pricing" on pricing_options;
create policy "public reads pricing" on pricing_options
  for select using (true);

drop policy if exists "admins write pricing" on pricing_options;
create policy "admins write pricing" on pricing_options
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads presenters" on presenters;
create policy "public reads presenters" on presenters
  for select using (true);

drop policy if exists "admins write presenters" on presenters;
create policy "admins write presenters" on presenters
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ admin visibility
drop policy if exists "admins read all orders" on orders;
create policy "admins read all orders" on orders
  for select using (public.is_admin());

drop policy if exists "admins read all order items" on order_items;
create policy "admins read all order items" on order_items
  for select using (public.is_admin());

drop policy if exists "admins read profiles" on profiles;
create policy "admins read profiles" on profiles
  for select using (id = auth.uid() or public.is_admin());

-- A user must never be able to promote themselves; role changes are done with
-- the service role (or straight from the SQL editor) only.
drop policy if exists "users update own profile" on profiles;
create policy "users update own profile" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- --------------------------------------------------------------- video storage
/*
 * Private bucket: webinar recordings are paid content, so objects are never
 * publicly readable. Playback goes through short-lived signed URLs minted
 * server-side only after an entitlement check.
 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'webinar-videos', 'webinar-videos', false,
  5368709120,                                    -- 5 GB
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins manage webinar videos" on storage.objects;
create policy "admins manage webinar videos" on storage.objects
  for all
  using (bucket_id = 'webinar-videos' and public.is_admin())
  with check (bucket_id = 'webinar-videos' and public.is_admin());

notify pgrst, 'reload schema';
