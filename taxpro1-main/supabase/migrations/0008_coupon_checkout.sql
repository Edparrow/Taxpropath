-- Wires coupons into the checkout RPCs: place_order records the applied code
-- and discount, mark_order_paid settles against the discounted amount and
-- bumps the coupon's redemption count. Safe to run more than once.

drop function if exists public.place_order(uuid, text, jsonb, jsonb, text);

create or replace function public.place_order(
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
 * matches subtotal minus the discount recorded at creation time. On success,
 * counts the redemption against the coupon so max_redemptions is enforced.
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

revoke all on function public.place_order(uuid, text, jsonb, jsonb, text, text, int) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, jsonb, jsonb, text, text, int) to service_role;

revoke all on function public.mark_order_paid(text, text, int, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text, int, text) to service_role;

notify pgrst, 'reload schema';
