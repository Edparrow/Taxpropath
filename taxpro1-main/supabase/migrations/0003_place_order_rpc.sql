-- Checkout is written by the server (after it has re-priced every line against
-- the catalog), not by the browser. This function does the order + items insert
-- atomically so a failed item insert can't leave an orphaned order behind.
--
-- Safe to run more than once.

create or replace function public.place_order(
  p_user_id  uuid,
  p_email    text,
  p_billing  jsonb,
  p_items    jsonb
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

  insert into orders (id, user_id, guest_email, status, subtotal_cents, billing)
  values (
    v_order_id,
    p_user_id,
    case when p_user_id is null then p_email else null end,
    'pending',
    v_subtotal,
    coalesce(p_billing, '{}'::jsonb)
  );

  insert into order_items (
    order_id, webinar_slug, pricing_option_id,
    quantity, unit_price_cents, title_snapshot, option_snapshot
  )
  select
    v_order_id,
    i->>'webinar_slug',
    i->>'pricing_option_id',
    (i->>'quantity')::int,
    (i->>'unit_price_cents')::int,
    i->>'title_snapshot',
    i->>'option_snapshot'
  from jsonb_array_elements(p_items) as i;

  return v_order_id;
end;
$$;

-- Only the server may place orders. The anon key is public, so leaving this
-- callable from the browser would let anyone forge prices or write junk rows.
revoke all on function public.place_order(uuid, text, jsonb, jsonb) from public;
revoke all on function public.place_order(uuid, text, jsonb, jsonb) from anon;
revoke all on function public.place_order(uuid, text, jsonb, jsonb) from authenticated;
grant execute on function public.place_order(uuid, text, jsonb, jsonb) to service_role;

-- For the same reason, drop the browser-facing insert policies on the commerce
-- tables. The service role bypasses RLS, so the server is unaffected.
drop policy if exists "create own orders" on orders;
drop policy if exists "create own order items" on order_items;

notify pgrst, 'reload schema';
