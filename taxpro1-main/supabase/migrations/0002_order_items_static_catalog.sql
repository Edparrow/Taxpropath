-- The webinar catalog currently lives in static TS data (src/lib/data/webinars.ts),
-- not in the `webinars` / `pricing_options` tables, so order_items can't reference
-- them by uuid. Store the slug and option id as opaque text until the catalog is
-- moved into Supabase.
--
-- Safe to run more than once.

-- 1. Drop the FKs that pin these columns to uuid. Constraint names are looked up
--    rather than assumed, so this works no matter what Postgres auto-named them.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and contype = 'f'
      and conname <> 'order_items_order_id_fkey'   -- keep the link to orders
  loop
    execute format('alter table public.order_items drop constraint %I', c.conname);
  end loop;
end $$;

-- 2. uuid -> text, and rename webinar_id to webinar_slug.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items'
      and column_name = 'webinar_id'
  ) then
    alter table public.order_items
      alter column webinar_id type text using webinar_id::text;
    alter table public.order_items rename column webinar_id to webinar_slug;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items'
      and column_name = 'pricing_option_id' and data_type = 'uuid'
  ) then
    alter table public.order_items
      alter column pricing_option_id type text using pricing_option_id::text;
  end if;
end $$;

-- 3. Tell PostgREST to pick the new shape up immediately.
notify pgrst, 'reload schema';

-- 4. Verify — this should return webinar_slug=text and pricing_option_id=text.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'order_items'
order by ordinal_position;
