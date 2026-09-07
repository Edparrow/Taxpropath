-- Email verification + campaign sending + open/bounce tracking.
-- Adds verification status to newsletter_subscribers, plus three new
-- tables: email_campaigns, email_sends, email_events.

-- ---------------------------------------------- newsletter_subscribers: verification
alter table newsletter_subscribers
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'valid', 'invalid', 'catch_all', 'disposable', 'unknown')),
  add column if not exists verified_at timestamptz;

-- ------------------------------------------------------------- email_campaigns
create table if not exists email_campaigns (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  html_content text not null,
  status       text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

-- ------------------------------------------------------------------ email_sends
-- One row per recipient per campaign. tracking_token drives both the open
-- pixel URL and the VERP bounce address (bounce+<token>@mail.taxpropath.com).
create table if not exists email_sends (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references email_campaigns(id) on delete cascade,
  subscriber_id  uuid not null references newsletter_subscribers(id) on delete cascade,
  tracking_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status         text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'bounced_hard', 'bounced_soft', 'failed')),
  sent_at        timestamptz,
  updated_at     timestamptz not null default now()
);

create index if not exists email_sends_campaign_idx on email_sends(campaign_id);
create index if not exists email_sends_token_idx on email_sends(tracking_token);

-- ----------------------------------------------------------------- email_events
-- is_likely_mpp: set true when the open pixel was hit from Apple's proxy
-- ASN (17.0.0.0/8) -- lets reporting show "Total Opens" vs "Confirmed Opens".
create table if not exists email_events (
  id            uuid primary key default gen_random_uuid(),
  send_id       uuid not null references email_sends(id) on delete cascade,
  event_type    text not null check (event_type in ('open', 'bounce_hard', 'bounce_soft', 'complaint')),
  occurred_at   timestamptz not null default now(),
  ip            inet,
  user_agent    text,
  is_likely_mpp boolean not null default false
);

create index if not exists email_events_send_idx on email_events(send_id);

-- -------------------------------------------------------------------- RLS
-- Same "admins manage, public has no direct access" shape as the rest of the
-- admin-panel tables (see 0007). The mailer worker and tracking endpoint both
-- use the service-role key, which bypasses RLS, so no public policy is needed.
alter table email_campaigns enable row level security;
alter table email_sends     enable row level security;
alter table email_events    enable row level security;

drop policy if exists "admins manage campaigns" on email_campaigns;
create policy "admins manage campaigns" on email_campaigns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage sends" on email_sends;
create policy "admins manage sends" on email_sends
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage events" on email_events;
create policy "admins manage events" on email_events
  for all using (public.is_admin()) with check (public.is_admin());
