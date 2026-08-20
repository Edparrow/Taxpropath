-- PayPal payment support.
-- Safe to run more than once.

alter table orders add column if not exists paypal_order_id   text;
alter table orders add column if not exists paypal_capture_id text;
alter table orders add column if not exists paid_at           timestamptz;
alter table orders add column if not exists currency          text not null default 'USD';

create unique index if not exists orders_paypal_order_id_idx
  on orders (paypal_order_id) where paypal_order_id is not null;

-- Recreate place_order so it can record the PayPal order id at creation time.
drop function if exists public.place_order(uuid, text, jsonb, jsonb);

create or replace function public.place_order(
  p_user_id         uuid,
  p_email           text,
  p_billing         jsonb,
  p_items           jsonb,
  p_paypal_order_id text default null
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

  insert into orders (
    id, user_id, guest_email, status, subtotal_cents, billing, paypal_order_id
  )
  values (
    v_order_id,
    p_user_id,
    case when p_user_id is null then p_email else null end,
    'pending',
    v_subtotal,
    coalesce(p_billing, '{}'::jsonb),
    p_paypal_order_id
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

/*
 * Flips an order to paid, but only if the amount PayPal actually captured
 * matches what we recorded when the order was created. A mismatch means the
 * amount was tampered with somewhere in the round trip, so it must not settle.
 */
create or replace function public.mark_order_paid(
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
begin
  select * into v_order from orders where paypal_order_id = p_paypal_order_id;

  if not found then
    raise exception 'no order for paypal order %', p_paypal_order_id;
  end if;

  if v_order.status = 'paid' then
    return v_order.id;              -- already captured; keep this idempotent
  end if;

  if v_order.subtotal_cents <> p_captured_cents then
    raise exception 'captured amount % does not match order total %',
      p_captured_cents, v_order.subtotal_cents;
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

  return v_order.id;
end;
$$;

-- Server-only, same as place_order: the anon key is public.
revoke all on function public.place_order(uuid, text, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, jsonb, jsonb, text) to service_role;

revoke all on function public.mark_order_paid(text, text, int, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text, int, text) to service_role;

notify pgrst, 'reload schema';
