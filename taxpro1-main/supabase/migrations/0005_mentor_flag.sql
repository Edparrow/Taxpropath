-- =====================================================================
-- 0005: tells mentors apart from course-only speakers.
-- Mentors (is_mentor = true) are managed in Admin > Speakers and shown in
-- "Our Mentors" on the homepage. Speakers created by typing a name on a
-- course, or by an import, stay course-only (is_mentor = false).
-- Run after 0004, in the SQL editor of each database (dev, prod).
-- Safe to re-run. Adds one column and marks the existing mentors.
-- =====================================================================

alter table presenters add column if not exists is_mentor boolean not null default false;

-- Existing mentors: the 12 imported from SkillSync, plus any published speaker
-- that no course uses (only Admin > Speakers creates those).
update presenters p
set is_mentor = true
where not p.is_mentor
  and (
    p.slug in (
      'steven-g-meilleur', 'melveen-stevenson', 'rich-mclaughlin', 'susan-strauss',
      'mark-gorkin', 'peter-walmsley', 'nick-preusch', 'patrick-mccormick',
      'margie-faulk', 'paul-flogstad', 'warren-m-bergstein', 'david-h-ringstrom'
    )
    or (p.is_published and not exists (select 1 from courses c where c.presenter_id = p.id))
  );
