-- Re-links the 10 SkillSync-imported courses to their speakers after the
-- speakers were deleted in Admin (deleting a speaker empties the course's
-- speaker; the course itself stays).
-- Speakers are re-created HIDDEN, so they show on their courses but not in
-- "Our Mentors". A speaker who already exists is left as is (Warren M
-- Bergstein comes from the mentors import and stays visible).
-- Only courses whose speaker is currently empty are changed. Safe to re-run.
begin;

insert into presenters (slug, name, is_published) values
  ($t$bob-oberstein$t$, $t$Bob Oberstein$t$, false),
  ($t$charles-k-montecino$t$, $t$Charles K Montecino$t$, false),
  ($t$doug-chasick$t$, $t$Doug Chasick$t$, false),
  ($t$jean$t$, $t$Jean$t$, false),
  ($t$justin-muscolino$t$, $t$Justin Muscolino$t$, false),
  ($t$matthew-burr$t$, $t$Matthew Burr$t$, false),
  ($t$michael-deblis$t$, $t$Michael DeBlis$t$, false),
  ($t$rhanda-mckown$t$, $t$Rhanda McKown$t$, false),
  ($t$warren-m-bergstein$t$, $t$Warren M Bergstein$t$, true)
on conflict (slug) do nothing;

update courses c
set presenter_id = p.id
from (values
  ($t$writing-the-investigation-report-discrimination-harassment-and-bullying$t$, $t$bob-oberstein$t$),
  ($t$mastering-form-1099-due-diligence-avoiding-pitfalls-penalties-irs-pushback$t$, $t$charles-k-montecino$t$),
  ($t$claude-ai-for-cpas-and-finance-professionals-boosting-accuracy-efficiency-and-smarter-accounting-workflows$t$, $t$justin-muscolino$t$),
  ($t$2026-individual-business-federal-tax-update$t$, $t$jean$t$),
  ($t$adult-children-as-live-in-aides-at-hud-funded-properties$t$, $t$rhanda-mckown$t$),
  ($t$demystifying-the-fbar-a-masterclass$t$, $t$michael-deblis$t$),
  ($t$calculating-income-and-assets-and-verification-methods-at-hud-multifamily-properties$t$, $t$rhanda-mckown$t$),
  ($t$osha-2026-inspection-readiness-enforcement-priorities-compliance-updates$t$, $t$matthew-burr$t$),
  ($t$hud-s-new-esa-enforcement-rules-what-housing-providers-must-know-now$t$, $t$doug-chasick$t$),
  ($t$2026-estate-planning-after-h-r-1-with-new-estate-and-trust-rules$t$, $t$warren-m-bergstein$t$)
) as m(course_slug, presenter_slug)
join presenters p on p.slug = m.presenter_slug
where c.slug = m.course_slug
  and c.presenter_id is null;

commit;
