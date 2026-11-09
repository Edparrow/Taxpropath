-- SkillSync mentors (testimonial table) -> TaxProPath speakers ("Our Mentors").
-- Needs 0004_speakers.sql first. Safe to re-run: a speaker who already exists
-- keeps their photo, and any title/bio already typed in Admin is not overwritten.
begin;

insert into presenters (slug, name, title, bio, sort_order, is_published) values
  ($t$steven-g-meilleur$t$, $t$Steven G. Meilleur$t$, $t$Ph.D., SPHR - President, CEO$t$, $t$Dr. Steven G. Meilleur is a human resources and organizational management expert with over 40 years of leadership experience, serving as President & CEO of PRAXIS Management Solutions and a lecturer at the University of New Mexico.$t$, 1, true),
  ($t$melveen-stevenson$t$, $t$Melveen Stevenson$t$, $t$CEO and Founder$t$, $t$Melveen Stevenson is the CEO and founder of M.S.Elemental, LLC, with 17+ years of experience helping organizations strengthen leadership, human resources, and business operations through strategic advisory and coaching.$t$, 2, true),
  ($t$rich-mclaughlin$t$, $t$Rich McLaughlin$t$, $t$CPA, JD, LLM$t$, null, 3, true),
  ($t$susan-strauss$t$, $t$Dr. Susan Strauss$t$, $t$National and International Speaker, Trainer and Consultant$t$, $t$Dr. Susan Strauss is an internationally recognized expert on workplace harassment and bullying, with decades of experience as a speaker, trainer, investigator, consultant, and author.$t$, 4, true),
  ($t$mark-gorkin$t$, $t$Mark Gorkin$t$, $t$Nationally Acclaimed Speaker$t$, $t$Mark Gorkin is a licensed clinical social worker, psychotherapist, and keynote speaker - widely known as "The Stress Doc" - specializing in stress management, burnout prevention, resilience, and workplace wellness.$t$, 5, true),
  ($t$peter-walmsley$t$, $t$Peter Walmsley$t$, $t$CPA, CITP$t$, null, 6, true),
  ($t$nick-preusch$t$, $t$Nick Preusch$t$, $t$CPA, JD, LLM$t$, $t$CPA, JD, and LLM professional specializing in complex tax compliance, international taxation, and tax ethics. Tax Manager at PBMares, LLP with prior experience as an IRS Revenue Agent and Attorney. Recognized industry expert, published author, and national speaker on tax practices and regulatory matters.$t$, 7, true),
  ($t$patrick-mccormick$t$, $t$Patrick McCormick$t$, $t$International Tax Attorney$t$, $t$Experienced attorney with 12+ years specializing in U.S. international taxation for businesses and individuals worldwide. Advises clients across 90+ countries on complex income, estate, and multinational tax matters. Renowned speaker, author, and contributor to leading tax publications, recognized as a Super Lawyers Rising Star.$t$, 8, true),
  ($t$margie-faulk$t$, $t$Margie Faulk$t$, $t$Senior Human Resources & Compliance Professional$t$, $t$Senior Human Resources & Compliance Professional (PHR, SHRM-CP) with 14+ years of experience across corporate, government, and non-profit sectors. Certified by HRCI & SHRM, and an active member of corporate compliance and ethics initiatives.$t$, 9, true),
  ($t$paul-flogstad$t$, $t$Paul Flogstad$t$, $t$Real Estate Consultant$t$, $t$Real estate expert with 38+ years of experience in sales, construction, appraisal, and property management. Award-winning educator and author of "Fair Housing: What Everyone Should Know", with extensive experience in multi-state housing projects and regulations.$t$, 10, true),
  ($t$warren-m-bergstein$t$, $t$Warren M Bergstein$t$, $t$Tax & Financial Advisor$t$, $t$Veteran expert with 45+ years in tax, estate, trust, and financial planning, offering deep industry insight. President of Warren M. Bergstein CPA, PC and Principal at AKM Advisors, with prior experience at Ernst & Young. Respected educator, speaker, and author, actively contributing to leading financial and accounting organizations.$t$, 11, true),
  ($t$david-h-ringstrom$t$, $t$David H. Ringstrom$t$, $t$CPA, Excel Training Expert$t$, $t$Microsoft Excel expert and CPA with decades of experience in accounting consulting and professional training. Founder of Accounting Advisors, Inc., delivering 2,300+ webinars on Excel and accounting software. Known for practical, easy-to-understand training that helps professionals improve efficiency and master Excel.$t$, 12, true)
on conflict (slug) do update set
  title        = coalesce(presenters.title, excluded.title),
  bio          = coalesce(presenters.bio, excluded.bio),
  sort_order   = excluded.sort_order,
  is_published = true;

commit;
