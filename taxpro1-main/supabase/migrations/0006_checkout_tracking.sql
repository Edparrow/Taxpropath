-- =====================================================================
-- 0006: checkout tracking. Records every step of a checkout (opened, which
-- payment button was clicked, form incomplete, order created, PayPal window
-- closed, PayPal errors, declined payments, paid) so Admin > Failed Orders
-- can show WHY a payment didn't go through, plus each order's timeline.
-- Run after 0005, in the SQL editor of each database (dev, prod), BEFORE
-- deploying the code that uses it.
-- Safe to re-run. Adds one table and three columns; changes no data.
-- =====================================================================

create table if not exists checkout_events (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  user_id          uuid references auth.users(id) on delete set null,
  session_id       text,         -- one visit to the checkout page; groups its events
  order_id         uuid references orders(id) on delete cascade,
  paypal_order_id  text,
  event            text not null, -- viewed, clicked, form_incomplete, order_created,
                                  -- order_failed, cancelled, paypal_error, sdk_failed,
                                  -- card_failed, left_page, capture_failed, paid
  method           text,         -- paypal, card, ...
  reason           text,         -- plain-English reason, shown in the admin
  code             text,         -- PayPal's own code, e.g. INSTRUMENT_DECLINED
  amount_cents     integer,
  details          jsonb not null default '{}'::jsonb
);

create index if not exists checkout_events_order_idx on checkout_events (order_id, created_at);
create index if not exists checkout_events_session_idx on checkout_events (session_id, created_at);
create index if not exists checkout_events_created_idx on checkout_events (created_at desc);
create index if not exists checkout_events_paypal_idx on checkout_events (paypal_order_id);

-- Written only by the server (service role). Admins can read it.
alter table checkout_events enable row level security;
grant select on checkout_events to authenticated;
grant all on checkout_events to service_role;

drop policy if exists "admins read checkout events" on checkout_events;
create policy "admins read checkout events" on checkout_events
  for select using (public.is_admin());

-- The latest reason an unpaid order failed, for the Failed Orders list.
alter table orders add column if not exists failure_reason text;
alter table orders add column if not exists failure_code text;
alter table orders add column if not exists failed_at timestamptz;
