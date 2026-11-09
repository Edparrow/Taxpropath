-- =====================================================================
-- 0004 — Speakers are managed from Admin > Speakers and shown in
-- "Our Mentors" on the homepage. Testimonials were removed from the site.
-- Run after 0003, in the SQL editor of each database (dev, prod).
-- Safe to re-run. Only adds two columns; no data is changed or removed.
-- =====================================================================

-- The admin's content screens order rows by sort_order and hide rows that
-- are not published. Existing speakers start as published.
alter table presenters add column if not exists sort_order integer not null default 0;
alter table presenters add column if not exists is_published boolean not null default true;
