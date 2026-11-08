-- ONE-OFF: wipes every TaxProPath table, function and type so that the files
-- in migrations/ (0001, 0002, ...) can be run on a clean slate.
--
-- ⚠ DELETES ALL TAXPROPATH DATA (courses, orders, coupons, blog, users'
-- profiles, ...). Only for databases holding test data.
--
-- Safe for a database shared with another site (e.g. webtiq):
--   * only objects listed here by name are dropped — nothing with CASCADE,
--     so if anything outside TaxProPath depends on them, the drop fails
--     instead of silently changing the other site
--   * the whole script runs as one block: it either all happens or none of it
--   * auth.users (logins) is left untouched — shared with the other site
--
-- Works whether the database is on the old webinar schema, partly migrated,
-- or already empty.

do $$
declare
  t text;
begin
  -- Signup trigger, only if it is ours (calls public.handle_new_user).
  if exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created'
      and tgfoid = to_regprocedure('public.handle_new_user()')
  ) then
    drop trigger on_auth_user_created on auth.users;
  end if;

  -- Storage policy from the retired webinar video bucket (depends on is_admin).
  drop policy if exists "admins manage webinar videos" on storage.objects;

  -- Tables, children before parents.
  foreach t in array array[
    'error_events', 'user_carts', 'activity_logs', 'admin_users',
    'email_events', 'email_sends', 'email_campaigns',
    'order_items', 'orders', 'coupons',
    'pricing_options', 'courses', 'webinars', 'presenters',
    'subcategories', 'categories',
    'banners', 'industries', 'brands', 'testimonials', 'about_sections',
    'blog_posts', 'gallery_images', 'newsletter_subscribers', 'contact_messages',
    'profiles'
  ]
  loop
    execute format('drop table if exists public.%I', t);
  end loop;

  -- Functions (every signature the old migrations ever created).
  drop function if exists public.place_order(uuid, text, jsonb, jsonb);
  drop function if exists public.place_order(uuid, text, jsonb, jsonb, text);
  drop function if exists public.place_order(uuid, text, jsonb, jsonb, text, text, int);
  drop function if exists public.mark_order_paid(text, text, int, text);
  drop function if exists public.handle_new_user();
  drop function if exists public.is_super_admin();
  drop function if exists public.is_admin();

  drop type if exists public.webinar_kind;
  drop type if exists public.order_status;
end $$;

-- The old webinar video bucket. Supabase only allows removing an empty bucket;
-- if this prints a notice, empty "webinar-videos" in Studio → Storage first.
do $$
begin
  delete from storage.buckets where id = 'webinar-videos';
exception when others then
  raise notice 'webinar-videos bucket not removed (%). Empty it in Studio → Storage, then delete it there.', sqlerrm;
end $$;

notify pgrst, 'reload schema';
