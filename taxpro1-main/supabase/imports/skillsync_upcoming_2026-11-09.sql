-- SkillSync upcoming webinars -> TaxProPath self-study courses
-- Source: u658588341_TSkillDb_9-11-2026.sql (webinars dated 2026-11-09 or later)
-- 9 presenters, 10 courses. Safe to re-run: existing
-- presenters are kept (photo/bio untouched), courses are updated by slug.
begin;

-- 1. Presenters (photo and bio are added later from Admin -> Presenters)
insert into presenters (slug, name) values
  ($t$bob-oberstein$t$, $t$Bob Oberstein$t$),
  ($t$charles-k-montecino$t$, $t$Charles K Montecino$t$),
  ($t$doug-chasick$t$, $t$Doug Chasick$t$),
  ($t$jean$t$, $t$Jean$t$),
  ($t$justin-muscolino$t$, $t$Justin Muscolino$t$),
  ($t$matthew-burr$t$, $t$Matthew Burr$t$),
  ($t$michael-deblis$t$, $t$Michael DeBlis$t$),
  ($t$rhanda-mckown$t$, $t$Rhanda McKown$t$),
  ($t$warren-m-bergstein$t$, $t$Warren M Bergstein$t$)
on conflict (slug) do nothing;

-- 2. Courses
-- SkillSync #141 | 2026/11/09 | Bob Oberstein
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$writing-the-investigation-report-discrimination-harassment-and-bullying$t$, $t$Writing the Investigation Report: Discrimination, Harassment and Bullying$t$, (select id from presenters where slug = $t$bob-oberstein$t$),
  $t$Conducting a workplace investigation is only part of the process - the quality of the written investigation report often determines whether an investigation can withstand legal scrutiny, internal review, or external challenges. A professionally prepared report demonstrates that the investigation was objective, thorough, timely, and based on credible evidence, helping organizations reduce legal exposure while supporting fair and consistent employment decisions.

This course is designed to provide HR professionals, managers, investigators, employee relations specialists, and compliance personnel with practical guidance on preparing effective investigation reports involving allegations of discrimination, harassment, bullying, workplace violence, and employee misconduct.

Participants will learn how to organize investigation findings, document evidence objectively, apply appropriate standards of proof, and present clear conclusions and recommendations that accurately reflect the investigative process while maintaining fairness, neutrality, and legal defensibility.

The course will also explore investigative documentation techniques, report structure, legal risk management, due process considerations, and best practices for avoiding common reporting errors that may weaken an investigation or expose an organization to litigation.

Through practical examples, real-world workplace scenarios, and compliance-focused instruction, participants will strengthen their investigative writing skills and develop reports that support sound employment decisions and organizational compliance.$t$,
  array[]::text[],
  array[$t$Overview of workplace investigation reporting best practices$t$, $t$The role of investigation reports in employment law compliance$t$, $t$Establishing investigator authority and defining the scope of an investigation$t$, $t$Structuring a professional investigation report from complaint through conclusion$t$, $t$Writing clear, concise, objective, and credible investigative findings$t$, $t$Documenting facts, evidence, witness statements, and investigative procedures$t$, $t$Applying appropriate standards and models of proof during investigations$t$, $t$Using investigative findings to support conclusions and recommendations$t$, $t$Preparing reports involving: Workplace discrimination, Harassment complaints, Bullying allegations, Workplace violence, Threat assessments$t$, $t$Presenting investigation findings to management and organizational leadership$t$, $t$Proper documentation techniques for maintaining legal defensibility$t$, $t$Avoiding common investigation reporting mistakes$t$, $t$Managing legal risks associated with workplace investigations$t$, $t$Understanding: Negligent investigation claims, Loudermill rights, Weingarten rights, Public policy considerations, Defamation and false light claims, False imprisonment risks, Intentional and negligent infliction of emotional distress$t$, $t$Documentation requirements for workplace searches, monitoring, and surveillance$t$, $t$Best practices for maintaining investigator neutrality and credibility$t$, $t$Strengthening organizational compliance through professional investigative reporting$t$, $t$Practical case studies involving workplace investigations$t$],
  array[$t$Human Resources Professionals$t$, $t$HR Managers and HR Directors$t$, $t$Employee Relations Professionals$t$, $t$Labor Relations Specialists$t$, $t$Managers and Supervisors$t$, $t$Business Owners and Organizational Leaders$t$, $t$Compliance and Workplace Investigators$t$, $t$Attorneys and Employment Law Professionals$t$, $t$Union Officers, Representatives, and Stewards$t$, $t$Security Managers and Corporate Security Personnel$t$, $t$Law Enforcement Professionals involved in workplace investigations$t$, $t$Anyone responsible for conducting or documenting workplace investigations$t$],
  1.5, $t$HRCI / SHRM$t$, 'None', true, $t$Writing Workplace Investigation Reports | Discrimination, Harassment & Bullying Course 2026$t$, $t$Learn how to write legally defensible workplace investigation reports involving discrimination, harassment, bullying, and employee misconduct. This practical course covers investigation report structure, standards of proof, documentation techniques, legal risks, employment law considerations, and best practices for conducting professional workplace investigations.$t$, $t$workplace investigation course, investigation report writing, HR investigation training, discrimination investigation, harassment investigation, bullying investigation, employee relations course, workplace compliance training, HR legal compliance, workplace misconduct investigations, Bob Oberstein, HRCI SHRM course$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$writing-the-investigation-report-discrimination-harassment-and-bullying$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #194 | 2026/11/10 | Charles K Montecino
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$mastering-form-1099-due-diligence-avoiding-pitfalls-penalties-irs-pushback$t$, $t$Mastering Form 1099 Due Diligence: Avoiding Pitfalls, Penalties & IRS Pushback$t$, (select id from presenters where slug = $t$charles-k-montecino$t$),
  $t$Whether you're preparing Forms 1099 for the first time or you're a seasoned pro, the reporting landscape continues to shift - and the IRS is paying close attention. Penalties for even small mistakes are on the rise, and compliance deadlines are tighter than ever.

You'll get up to speed on the latest IRS changes, including the safe harbor for de minimis errors, new filing and furnishing deadlines, and the expanded use of TIN solicitation and verification tools. We'll demystify "B" Notices, backup withholding, and reasonable cause standards, and explore the practical steps to correct errors before they lead to costly penalties. We will also ensure that you understand the effects of legislations such as the Big Beautiful Bill on 1099s so that you can plan for upcoming changes.$t$,
  array[]::text[],
  array[$t$Learn what's new for Form 1099-MISC and related filings for the current tax year$t$, $t$Understand the difference between reportable and non-reportable payments$t$, $t$Identify when and how to issue "B" Notices and handle TIN mismatches$t$, $t$Master the art of backup withholding: when it applies and how to manage it$t$, $t$Implement best practices for W-9 collection and TIN solicitation$t$, $t$Discover how to correct 1099 errors the right way - and avoid IRS scrutiny$t$, $t$Learn what constitutes "reasonable cause" to defend against penalties$t$, $t$Access IRS resources and tools to streamline compliance$t$, $t$Plan for upcoming 1099 changes based on passed legislation.$t$],
  array[$t$This course is designed for accountants, CPAs, enrolled agents, bookkeepers, tax preparers, AP professionals, and attorneys responsible for vendor compliance, tax filings, and information return reporting.$t$],
  2.0, $t$Taxes$t$, 'None', true, $t$Mastering Form 1099 Due Diligence: Avoiding Pitfalls, Penalties & IRS Pushback$t$, $t$Whether you're preparing Forms 1099 for the first time or you're a seasoned pro, the reporting landscape continues to shift - and the IRS is paying close attention. Penalties for even small mistakes are on the rise, and compliance deadlines are tighter than ever. You'll get up to speed on the latest IRS changes, including the safe harbor for de minimis errors, new filing and furnishing deadlines, and the expanded use of TIN solicitation and verification tools. We'll demystify "B" Notices, backup withholding, and reasonable cause standards, and explore the practical steps to correct errors before they lead to costly penalties. We will also ensure that you understand the effects of legislations such as the Big Beautiful Bill on 1099s so that you can plan for upcoming changes.$t$, $t$Mastering Form 1099 Due Diligence: Avoiding Pitfalls, Penalties & IRS Pushback$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$mastering-form-1099-due-diligence-avoiding-pitfalls-penalties-irs-pushback$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #144 | 2026/11/11 | Justin Muscolino
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$claude-ai-for-cpas-and-finance-professionals-boosting-accuracy-efficiency-and-smarter-accounting-workflows$t$, $t$Claude AI for CPAs and Finance Professionals: Boosting Accuracy, Efficiency, and Smarter Accounting Workflows$t$, (select id from presenters where slug = $t$justin-muscolino$t$),
  $t$Artificial intelligence is transforming the accounting profession by enabling finance professionals to process information more efficiently, improve documentation quality, and enhance decision-making while maintaining professional standards. Claude AI has become a valuable tool for CPAs, accountants, controllers, and finance teams by supporting financial research, document analysis, reporting, reconciliations, and technical communication without replacing professional judgment.

This course is designed to provide accounting and finance professionals with a practical understanding of how Claude AI can be integrated into everyday accounting workflows to improve productivity, reporting accuracy, and operational efficiency.

Participants will learn how to use Claude AI to summarize accounting standards, draft accounting memoranda, prepare reconciliation explanations, organize research, perform variance analysis, support month-end close activities, and improve financial reporting documentation while maintaining confidentiality and compliance with professional responsibilities.

The course will also explore prompt engineering techniques, AI governance, quality control procedures, data privacy considerations, and practical methods for validating AI-generated content before it becomes part of financial reporting or organizational decision-making.

Through practical demonstrations, real-world accounting scenarios, and compliance-focused instruction, participants will gain actionable strategies for incorporating AI responsibly into accounting workflows while preserving accuracy, consistency, and professional judgment.$t$,
  array[]::text[],
  array[$t$Introduction to Claude AI for accounting and finance professionals$t$, $t$Understanding the role of AI in modern accounting workflows$t$, $t$Practical AI use cases across accounting and finance operations$t$, $t$Summarizing accounting standards, technical guidance, and financial documents$t$, $t$Drafting: Accounting memoranda, Technical accounting explanations, Internal documentation, Professional communications$t$, $t$Preparing reconciliation explanations and supporting documentation$t$, $t$Using AI for variance analysis and financial commentary$t$, $t$Supporting month-end close processes and financial reporting$t$, $t$Organizing accounting research and workflow documentation$t$, $t$Financial document review and intelligent summarization$t$, $t$Workflow optimization using AI-assisted accounting processes$t$, $t$Prompt engineering strategies for accounting professionals$t$, $t$Developing effective prompts for accurate accounting outputs$t$, $t$Improving productivity while maintaining professional judgment$t$, $t$Understanding AI limitations and quality control procedures$t$, $t$Reviewing and validating AI-generated accounting content$t$, $t$Managing confidentiality, governance, and responsible AI usage$t$, $t$Data security considerations when using AI in accounting environments$t$, $t$Best practices for integrating AI into public accounting, corporate finance, advisory, and nonprofit organizations$t$, $t$Practical accounting case studies and real-world AI workflow demonstrations$t$],
  array[$t$Certified Public Accountants (CPAs)$t$, $t$Accountants$t$, $t$Controllers$t$, $t$Chief Financial Officers (CFOs)$t$, $t$Finance Leaders and Finance Managers$t$, $t$Financial Analysts$t$, $t$Internal Auditors$t$, $t$Accounting Managers$t$, $t$FP&A Professionals$t$, $t$Advisory and Consulting Professionals$t$, $t$Risk and Compliance Professionals$t$, $t$Business Strategists$t$, $t$Professionals working in Public Accounting$t$, $t$Corporate Finance Teams$t$, $t$Nonprofit Accounting Professionals$t$, $t$Anyone seeking practical guidance on integrating AI into accounting and finance workflows$t$],
  2.0, $t$Information Technology$t$, 'None', true, $t$Claude AI for CPAs & Finance Professionals | Accounting AI Course 2026$t$, $t$Learn how to use Claude AI to improve accounting workflows, financial reporting, reconciliations, variance analysis, month-end close activities, and technical documentation. This practical course covers AI prompt engineering, accounting research, governance, confidentiality, quality control, and responsible AI practices for CPAs and finance professionals.$t$, $t$Claude AI accounting course, AI for CPAs, accounting AI training, finance AI course, Claude AI finance professionals, accounting workflow automation, AI accounting documentation, financial reporting AI, accounting research AI, month-end close automation, accounting productivity, Justin Muscolino$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$claude-ai-for-cpas-and-finance-professionals-boosting-accuracy-efficiency-and-smarter-accounting-workflows$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #190 | 2026/11/13 | Jean
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$2026-individual-business-federal-tax-update$t$, $t$2026 Individual & Business Federal Tax Update$t$, (select id from presenters where slug = $t$jean$t$),
  $t$This course provides a comprehensive federal income tax update to help practitioners prepare for the 2027 filing season, with a focus on the 2026 Form 1040, related schedules, and key individual and business provisions of the One Big Beautiful Bill Act (OBBBA).

The course covers newly enacted legislation, recent regulations, significant court decisions, IRS notices, revenue procedures, and private letter rulings affecting individuals and businesses. Participants will also review SECURE 2.0 provisions effective in 2026 and key basis-compliance issues for partnerships and S corporations, including Schedule K-1 and Form 1040 reporting.$t$,
  array[]::text[],
  array[$t$The course covers newly enacted legislation, recent regulations, significant court decisions, IRS notices, revenue procedures, and private letter rulings affecting individuals and businesses. Participants will also review SECURE 2.0 provisions effective in 2026 and key basis-compliance issues for partnerships and S corporations, including Schedule K-1 and Form 1040 reporting.$t$, $t$Business Tax Topics$t$, $t$2026 business tax developments and OBBBA provisions$t$, $t$Section 179, cost recovery, and qualified production property$t$, $t$Domestic research and experimental expenditures and accounting method considerations$t$, $t$Section 163(j) business interest limitations and revised adjusted taxable income rules$t$, $t$Qualified Business Income deduction and pass-through considerations$t$, $t$Partnership, S corporation, C corporation, LLC, and Schedule C issues, including basis and loss limitations$t$, $t$Form 1099-K, information reporting, payroll, fringe benefits, and selected employment tax updates$t$, $t$Entity selection, owner compensation, distributions, year-end planning, and compliance issues$t$, $t$Individual Tax Topics$t$, $t$2026 Form 1040 and related schedule changes for the 2027 filing season$t$, $t$Schedule 1-A deductions for tips, overtime, passenger vehicle loan interest, and eligible seniors$t$, $t$Standard and itemized deductions, including SALT and charitable giving$t$, $t$Child Tax Credit, family and education-related credits, and selected health provisions$t$, $t$Self-employment, gig economy, QBI, and Form 1099-K considerations$t$, $t$Retirement contributions and distributions, investment income, and capital gains/losses$t$, $t$IRS reporting, substantiation, due diligence, withholding, estimated tax, and compliance updates$t$, $t$Common filing-season issues and planning opportunities$t$],
  array[$t$CPAs, Enrolled Agents, tax professionals, attorneys, tax preparers, finance professionals, and financial planners.$t$],
  2.0, $t$Taxes$t$, 'None', true, $t$Federal Tax Update 2026 | 2027 Filing Season, OBBBA & Form 1040$t$, $t$Prepare for the 2027 filing season with a 2026 federal tax update covering Form 1040, OBBBA, business and individual tax changes, SECURE 2.0, IRS updates and compliance.$t$, $t$Federal Tax Update 2026, 2027 Filing Season, 2026 Form 1040, OBBBA Tax Update, One Big Beautiful Bill Act, Federal Income Tax Update, Business Tax Update 2026, Individual Tax Update 2026, SECURE 2.0, IRS Tax Updates, Tax CPE Course, Tax Professionals, CPA CPE, Enrolled Agent CPE, Tax Planning 2026$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$2026-individual-business-federal-tax-update$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #149 | 2026/11/16 | Rhanda McKown
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$adult-children-as-live-in-aides-at-hud-funded-properties$t$, $t$Adult Children as Live-In Aides at HUD Funded Properties$t$, (select id from presenters where slug = $t$rhanda-mckown$t$),
  $t$Live-in aide requests are among the most complex and frequently misunderstood areas of HUD Multifamily occupancy compliance. Housing providers must balance HUD eligibility requirements, Fair Housing obligations, occupancy standards, reasonable accommodation rules, and documentation requirements while ensuring that live-in aides - including adult children - are processed correctly and consistently.

This course is designed to provide HUD Multifamily professionals with a practical understanding of the rules governing live-in aides, including when adult children may qualify to serve as live-in aides and how these requests intersect with Fair Housing requirements. Participants will learn how to evaluate requests, verify eligibility, complete required HUD documentation, and implement compliant policies that reduce operational and legal risk.

The course will also explore screening requirements, occupancy standards, lease documentation, income treatment, household composition, remaining household member status, and best practices for protecting resident rights while maintaining HUD compliance.

Through practical examples, real-world case studies, and compliance-focused instruction, participants will strengthen their ability to process live-in aide requests accurately, reduce Fair Housing risks, and ensure consistent occupancy decisions across HUD-assisted housing communities.$t$,
  array[]::text[],
  array[$t$Overview of HUD Multifamily requirements governing live-in aides$t$, $t$Understanding the relationship between HUD occupancy rules and Fair Housing requirements$t$, $t$Defining live-in aides and caregivers$t$, $t$Legal distinctions between live-in aides and caregivers$t$, $t$Determining who qualifies for a live-in aide under HUD regulations$t$, $t$Reasonable accommodation requirements involving live-in aides$t$, $t$Program-specific eligibility requirements for: Elderly households, Near-elderly households, Disabled households$t$, $t$Understanding when adult children and relatives may serve as live-in aides$t$, $t$Special HUD rules applicable to family members serving as live-in aides$t$, $t$Occupancy standards and unit size considerations$t$, $t$Leasing requirements for live-in aides$t$, $t$HUD screening requirements, including: Criminal background screening, Sex offender screening, EIV Existing Tenant Searches$t$, $t$Completing required HUD documentation, including: HUD-50059 coding, Lease addenda, House Rules, Supporting documentation$t$, $t$Medical verification requirements while protecting confidential information$t$, $t$Fair Housing limitations regarding disability-related documentation$t$, $t$Income treatment for live-in aides$t$, $t$Exceptions to income exclusion under specific HUD programs$t$, $t$Remaining household member status and occupancy rights$t$, $t$Developing compliant policies for live-in aides and family caregivers$t$, $t$Documentation best practices and risk reduction strategies$t$, $t$Common compliance mistakes involving live-in aide requests$t$, $t$Real-world HUD Multifamily case studies and practical application$t$],
  array[$t$Property Managers$t$, $t$Assistant Property Managers$t$, $t$Occupancy Specialists$t$, $t$Compliance Specialists$t$, $t$Regional Property Managers$t$, $t$Regional Compliance Managers$t$, $t$Affordable Housing Directors$t$, $t$Owners and Management Agents of HUD Multifamily Properties$t$, $t$Resident Services Coordinators$t$, $t$Fair Housing Coordinators$t$, $t$Corporate Compliance Professionals$t$, $t$Housing Consultants$t$, $t$Internal Auditors and Quality Assurance Professionals$t$, $t$Organizations managing: HUD Project-Based Rental Assistance (PBRA), Section 202 Housing, Section 811 Housing, Section 236 Housing, Rent Supplement Programs, Rental Assistance Payment (RAP) Programs, Other HUD Multifamily-Assisted Housing Communities$t$, $t$Anyone responsible for HUD occupancy, certifications, reasonable accommodations, or Fair Housing compliance$t$],
  null, null, 'None', true, $t$Adult Children as Live-In Aides at HUD Funded Properties | HUD Compliance Course 2026$t$, $t$Learn how to properly manage adult children serving as live-in aides in HUD-funded properties. This practical course covers HUD Multifamily occupancy rules, Fair Housing requirements, reasonable accommodations, screening procedures, HUD-50059 documentation, income treatment, occupancy standards, and compliance best practices for housing professionals.$t$, $t$HUD live-in aide course, adult children as live-in aides, HUD Multifamily compliance, Fair Housing course, HUD occupancy rules, reasonable accommodation training, HUD-50059, HUD certifications, affordable housing compliance, Section 202, Section 811, HUD property management, Rhanda McKown$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$adult-children-as-live-in-aides-at-hud-funded-properties$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #140 | 2026/11/18 | Michael DeBlis
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$demystifying-the-fbar-a-masterclass$t$, $t$Demystifying the FBAR: A Masterclass$t$, (select id from presenters where slug = $t$michael-deblis$t$),
  $t$Foreign Bank Account Reporting (FBAR) remains one of the most complex and misunderstood international tax compliance requirements facing U.S. taxpayers and the professionals who advise them. Failure to properly disclose foreign financial accounts can result in severe civil and criminal penalties, making a clear understanding of FBAR filing obligations essential for individuals with international financial interests.

This course is designed to provide tax professionals with a practical understanding of FBAR compliance, reporting requirements, and the legal framework governing foreign financial account disclosures. Participants will learn who is required to file an FBAR, how reportable foreign financial accounts are identified, and how to avoid common compliance mistakes that frequently lead to IRS enforcement actions.

The course will also explore the differences between willful and non-willful violations, IRS penalty structures, Streamlined Filing Compliance Procedures, Delinquent FBAR Submission Procedures, FATCA-related reporting considerations, and practical strategies for correcting prior non-compliance.

Through practical examples, real-world case studies, and compliance-focused instruction, participants will strengthen their understanding of international information reporting obligations while improving their ability to advise clients on cross-border tax compliance and foreign asset reporting.$t$,
  array[]::text[],
  array[$t$Overview of Foreign Bank Account Reporting (FBAR) requirements$t$, $t$Understanding the legal purpose and scope of FBAR compliance$t$, $t$Determining who qualifies as a U.S. Person for FBAR filing purposes$t$, $t$Understanding the $10,000 aggregate account balance reporting threshold$t$, $t$Calculating aggregate maximum account balances correctly$t$, $t$Identifying reportable foreign financial accounts$t$, $t$Understanding reporting requirements for: Foreign bank accounts, Foreign investment accounts, Mutual funds, Pension accounts, Cash-value life insurance policies, Signature authority accounts$t$, $t$Foreign financial assets that commonly create reporting confusion$t$, $t$Distinguishing reportable versus non-reportable foreign assets$t$, $t$Understanding the relationship between FBAR and FATCA reporting$t$, $t$Common FBAR filing mistakes and compliance risks$t$, $t$Willful versus non-willful FBAR violations$t$, $t$IRS penalty structures for FBAR non-compliance$t$, $t$Civil and criminal consequences of reporting failures$t$, $t$How the IRS detects undisclosed foreign accounts through international information sharing$t$, $t$Overview of: Streamlined Filing Compliance Procedures, Delinquent FBAR Submission Procedures, Other voluntary compliance options$t$, $t$Correcting prior-year FBAR filing errors$t$, $t$Documentation and recordkeeping best practices$t$, $t$Managing international tax compliance risks$t$, $t$Practical case studies involving foreign account reporting$t$, $t$Strategies for reducing exposure to FBAR penalties and IRS enforcement actions$t$],
  array[$t$Certified Public Accountants (CPAs)$t$, $t$Enrolled Agents (EAs)$t$, $t$Tax Attorneys$t$, $t$International Tax Professionals$t$, $t$Tax Preparers and Tax Advisors$t$, $t$Bookkeepers and Accounting Professionals$t$, $t$Business Owners with Foreign Financial Interests$t$, $t$Tax Managers and Compliance Professionals$t$, $t$Financial Advisors serving international clients$t$, $t$Professionals advising expatriates, dual citizens, and resident aliens$t$, $t$Anyone seeking practical guidance on FBAR reporting and international tax compliance$t$],
  2.0, $t$Taxes$t$, 'None', true, $t$Demystifying the FBAR: A Masterclass | Foreign Bank Account Reporting Course 2026$t$, $t$Master FBAR compliance with this practical course covering foreign bank account reporting requirements, FATCA considerations, reportable foreign assets, willful versus non-willful violations, IRS penalty rules, Streamlined Filing Compliance Procedures, and practical strategies for correcting prior-year FBAR filing obligations.$t$, $t$FBAR course, foreign bank account reporting, FBAR compliance, FATCA reporting, international tax course, foreign financial accounts, Streamlined Filing Compliance Procedures, Delinquent FBAR Submission Procedures, FBAR penalties, international tax compliance, foreign asset reporting, Michael DeBlis$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$demystifying-the-fbar-a-masterclass$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #143 | 2026/11/20 | Rhanda McKown
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$calculating-income-and-assets-and-verification-methods-at-hud-multifamily-properties$t$, $t$Calculating Income and Assets and Verification Methods at HUD Multifamily Properties$t$, (select id from presenters where slug = $t$rhanda-mckown$t$),
  $t$Accurately calculating household income and assets is one of the most critical responsibilities for professionals managing HUD Multifamily properties. As HUD guidance continues to evolve through HOTMA implementation and updated verification requirements, housing professionals must understand not only how to calculate income correctly but also how to document, verify, and support eligibility decisions that withstand Management and Occupancy Reviews (MORs) and compliance audits.

This course is designed to provide property management and compliance professionals with a practical understanding of HUD income determination, asset calculations, verification standards, and documentation requirements. Participants will learn how to apply current HUD guidance when processing move-ins, annual recertifications, and interim recertifications while confidently handling both common and complex household financial situations.

The course will also explore verification hierarchies, countable and excluded income, self-employment income, gig economy earnings, retirement accounts, jointly owned assets, imputed income, and practical documentation techniques that reduce compliance findings and improve certification accuracy.

Through real-world examples, practical case studies, and compliance-focused instruction, participants will strengthen their ability to make accurate eligibility determinations, improve documentation quality, and maintain HUD compliance across all stages of the certification process.$t$,
  array[]::text[],
  array[$t$Overview of HUD income and asset determination requirements$t$, $t$Current HUD Multifamily income verification standards$t$, $t$Understanding HOTMA income and asset changes$t$, $t$Applying HUD verification hierarchy, including: Enterprise Income Verification (EIV), Third-party verification, Oral verification, Self-certification$t$, $t$Documentation standards for HUD compliance$t$, $t$Identifying countable and excluded income under current HUD regulations$t$, $t$Calculating: Earned income, Unearned income, Self-employment income, Seasonal income, Irregular income$t$, $t$Handling emerging income sources, including: Gig economy income, Payment applications, Debit card transactions, Electronic payment platforms$t$, $t$Determining which household members' income must be included$t$, $t$Applying special household income rules$t$, $t$Calculating assets and income generated from assets$t$, $t$Understanding imputed income requirements$t$, $t$Managing jointly owned assets$t$, $t$Applying HUD rules to: Retirement accounts, Annuities, Disposed assets, Complex financial assets$t$, $t$Common calculation errors that result in MOR findings$t$, $t$Audit preparation and compliance documentation techniques$t$, $t$Best practices for processing: Move-in certifications, Annual recertifications, Interim recertifications$t$, $t$Practical methods for improving eligibility determinations$t$, $t$Real-world case studies involving HUD Multifamily compliance decisions$t$],
  array[$t$Property Managers$t$, $t$Assistant Property Managers$t$, $t$Occupancy Specialists$t$, $t$Compliance Specialists$t$, $t$Regional Property Managers$t$, $t$Regional Compliance Managers$t$, $t$Corporate Compliance Professionals$t$, $t$Certification Specialists$t$, $t$Leasing Professionals$t$, $t$Operations Managers$t$, $t$Asset Managers$t$, $t$Directors of Housing$t$, $t$Owners and Management Agents$t$, $t$Training Coordinators$t$, $t$Anyone responsible for HUD Multifamily eligibility, occupancy, certification, or compliance decisions$t$],
  null, null, 'None', true, $t$Calculating Income and Assets at HUD Multifamily Properties | HOTMA Compliance Course 2026$t$, $t$Learn how to accurately calculate income and assets for HUD Multifamily properties using current HUD and HOTMA requirements. This practical course covers verification methods, income determination, asset calculations, EIV, documentation standards, recertifications, compliance best practices, and strategies for reducing MOR findings and audit risks.$t$, $t$HUD Multifamily course, HOTMA income calculations, HUD asset verification, HUD compliance training, income verification course, HUD certifications, occupancy specialist training, HUD eligibility requirements, property management compliance, HUD recertification course, Rhanda McKown, HUD asset calculation$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$calculating-income-and-assets-and-verification-methods-at-hud-multifamily-properties$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #146 | 2026/11/23 | Matthew Burr
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$osha-2026-inspection-readiness-enforcement-priorities-compliance-updates$t$, $t$OSHA 2026: Inspection Readiness, Enforcement Priorities & Compliance Updates$t$, (select id from presenters where slug = $t$matthew-burr$t$),
  $t$OSHA inspections continue to evolve as the agency adopts more targeted, data-driven enforcement strategies focused on high-risk industries, injury and illness reporting, workplace violence prevention, heat-related hazards, and employer accountability. Organizations that fail to prepare for OSHA inspections face increased risks of citations, significant financial penalties, operational disruptions, and long-term compliance challenges.

This course is designed to provide employers, HR professionals, safety managers, and operational leaders with a practical understanding of OSHA's 2026 enforcement priorities and inspection procedures. Participants will learn how OSHA selects employers for inspection, what compliance officers evaluate during inspections, and how organizations can proactively prepare before an inspection occurs.

The course will also examine OSHA recordkeeping requirements, inspection protocols, employer rights and responsibilities, hazard communication updates, workplace safety documentation, citation management, and practical compliance strategies that reduce enforcement risks while strengthening workplace safety programs.

Through real-world examples, practical guidance, and compliance-focused instruction, participants will gain actionable strategies for improving inspection readiness, maintaining regulatory compliance, and confidently managing OSHA inspections from opening conference through final resolution.$t$,
  array[]::text[],
  array[$t$Overview of OSHA's 2026 enforcement priorities and inspection trends$t$, $t$Understanding OSHA's data-driven inspection targeting process$t$, $t$Types of OSHA inspections, including: Programmed inspections, Complaint-driven inspections, Referral inspections, Fatality investigations, Catastrophe inspections$t$, $t$Preparing the organization before an OSHA inspection$t$, $t$Employer rights and responsibilities during OSHA inspections$t$, $t$Managing: Opening conferences, Facility walk-arounds, Employee interviews, Closing conferences$t$, $t$Preparing OSHA recordkeeping documentation, including: OSHA Form 300, OSHA Form 300A, OSHA Form 301$t$, $t$Maintaining written safety programs and documentation$t$, $t$Training records and hazard assessment requirements$t$, $t$OSHA's focus on injury and illness reporting accuracy$t$, $t$Current compliance updates involving: Hazard Communication (HazCom), Heat illness prevention, Workplace violence prevention, Fall protection, Lockout/Tagout (LOTO), Machine guarding$t$, $t$Understanding OSHA citations and penalty classifications$t$, $t$Abatement requirements and corrective action planning$t$, $t$OSHA appeals procedures$t$, $t$Common employer mistakes leading to: Serious violations, Repeat violations, Willful violations$t$, $t$Developing an OSHA inspection readiness strategy$t$, $t$Building proactive workplace safety and compliance programs$t$, $t$Real-world OSHA inspection scenarios and best practices$t$],
  array[$t$Safety Managers and Safety Coordinators$t$, $t$Human Resources Professionals$t$, $t$HR Managers and Compliance Professionals$t$, $t$Operations Managers$t$, $t$Plant Managers and Facility Managers$t$, $t$Environmental Health and Safety (EHS) Professionals$t$, $t$Risk Management Professionals$t$, $t$Business Owners and Employers$t$, $t$Supervisors and Team Leaders$t$, $t$Manufacturing and Industrial Managers$t$, $t$Construction and Field Operations Managers$t$, $t$Anyone responsible for OSHA compliance, workplace safety, or regulatory inspections$t$],
  1.0, $t$HRCI / SHRM$t$, 'None', true, $t$OSHA 2026 Inspection Readiness Course | Compliance, Inspections & Enforcement Updates$t$, $t$Prepare your organization for OSHA inspections with this practical compliance course. Learn OSHA's 2026 enforcement priorities, inspection procedures, employer responsibilities, recordkeeping requirements, HazCom updates, workplace safety documentation, citation management, and proactive strategies for reducing compliance risks and improving inspection readiness.$t$, $t$OSHA course 2026, OSHA inspection readiness, OSHA compliance training, workplace safety course, OSHA enforcement updates, OSHA inspections, OSHA recordkeeping, OSHA Form 300, HazCom training, workplace violence prevention, OSHA citations, Matthew Burr$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$osha-2026-inspection-readiness-enforcement-priorities-compliance-updates$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #142 | 2026/11/25 | Doug Chasick
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$hud-s-new-esa-enforcement-rules-what-housing-providers-must-know-now$t$, $t$HUD's New ESA Enforcement Rules - What Housing Providers Must Know Now$t$, (select id from presenters where slug = $t$doug-chasick$t$),
  $t$Recent changes to HUD's enforcement guidance have significantly altered how housing providers must evaluate assistance animal and emotional support animal (ESA) accommodation requests under the Fair Housing Act. Organizations relying on outdated policies or prior HUD guidance may now face increased compliance risks, inconsistent decision-making, and potential fair housing complaints.

This course is designed to provide housing professionals with a practical understanding of HUD's 2026 ESA enforcement updates and the operational impact of the revised guidance. Participants will learn how to distinguish between service animals, assistance animals, and emotional support animals while applying current legal standards when evaluating accommodation requests.

The course will also explore documentation requirements, the "readily apparent" standard, internet-generated ESA letters, multiple animal requests, denial criteria, and effective communication strategies that reduce legal exposure while maintaining fair and consistent housing practices.

Through practical examples, real-world scenarios, and compliance-focused instruction, participants will gain actionable strategies for updating policies, improving accommodation procedures, and ensuring compliance with current HUD and Fair Housing Act requirements.$t$,
  array[]::text[],
  array[$t$Overview of HUD's 2026 ESA enforcement memorandum$t$, $t$Understanding the withdrawal of previous HUD assistance animal guidance$t$, $t$Applying the ADA Service Animal Standard under current HUD guidance$t$, $t$Differences between: Service Animals, Assistance Animals, Emotional Support Animals (ESAs)$t$, $t$Determining when accommodation requests qualify under the Fair Housing Act$t$, $t$Applying the "readily apparent" standard correctly$t$, $t$Evaluating internet-generated ESA letters and third-party documentation$t$, $t$Understanding what documentation housing providers may legally request$t$, $t$Information that housing providers may not request during accommodation reviews$t$, $t$Handling requests involving multiple assistance animals$t$, $t$When accommodation requests may legally be denied$t$, $t$Managing situations where assistance animals create operational concerns$t$, $t$Communicating accommodation decisions professionally and consistently$t$, $t$Common compliance mistakes involving assistance animal requests$t$, $t$Best practices for updating housing policies and procedures$t$, $t$Reducing Fair Housing Act compliance risks$t$, $t$Practical guidance for maintaining consistent accommodation practices$t$, $t$Real-world examples involving ESA and assistance animal requests$t$, $t$The ten most common assistance animal compliance mistakes and how to avoid them$t$],
  array[$t$Community Managers and Property Managers$t$, $t$Regional and Multi-Site Managers$t$, $t$Leasing Managers and Leasing Professionals$t$, $t$Housing Compliance Professionals$t$, $t$Affordable Housing Administrators$t$, $t$Fair Housing Compliance Officers$t$, $t$Training and Development Professionals$t$, $t$HR Professionals working within housing organizations$t$, $t$Property Owners and Housing Operators$t$, $t$Asset Managers and Multifamily Housing Professionals$t$, $t$Anyone responsible for evaluating accommodation requests under the Fair Housing Act$t$],
  null, null, 'None', true, $t$HUD ESA Enforcement Rules Course 2026 | Fair Housing & Assistance Animal Compliance$t$, $t$Learn how HUD's 2026 ESA enforcement guidance impacts housing providers. This practical course covers Fair Housing Act compliance, assistance animal requests, emotional support animal documentation, ADA service animal standards, accommodation procedures, denial criteria, and best practices for reducing fair housing compliance risks.$t$, $t$HUD ESA course, emotional support animal compliance, Fair Housing Act course, assistance animal rules, HUD 2026 guidance, ESA documentation, housing compliance training, property management course, service animal compliance, fair housing accommodations, Doug Chasick, multifamily housing compliance$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$hud-s-new-esa-enforcement-rules-what-housing-providers-must-know-now$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

-- SkillSync #147 | 2026/11/25 | Warren M Bergstein
insert into courses (slug, title, presenter_id, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, is_published, seo_title, seo_description, meta_keyword)
values ($t$2026-estate-planning-after-h-r-1-with-new-estate-and-trust-rules$t$, $t$2026 Estate Planning After H.R. 1 with New Estate and Trust Rules$t$, (select id from presenters where slug = $t$warren-m-bergstein$t$),
  $t$Recent legislative changes under House Resolution 1 (H.R. 1), commonly referred to as the Opportunity for a Better Budget Balance Act (OBBBA), have significantly reshaped estate and trust planning strategies for individuals, families, business owners, and high-net-worth clients. Tax professionals must now balance evolving estate tax rules, income tax considerations, portability elections, gifting strategies, and trust planning techniques while helping clients preserve wealth and maintain long-term tax efficiency.

This course is designed to provide tax professionals, financial advisors, and estate planning practitioners with a practical understanding of the estate and trust planning opportunities created by H.R. 1 and the latest federal tax law changes affecting the 2026 planning environment.

Participants will learn how updated estate, gift, and trust provisions influence planning decisions for married couples, business owners, and clients across varying wealth levels. The course will also examine portability, income tax basis planning, gifting strategies, life insurance applications, and post-mortem planning opportunities designed to improve long-term tax outcomes.

Through practical examples, planning scenarios, real-world case studies, and compliance-focused instruction, participants will strengthen their ability to advise clients confidently while integrating current estate and trust planning strategies into their professional practice.$t$,
  array[]::text[],
  array[$t$Overview of H.R. 1 (Opportunity for a Better Budget Balance Act) and its impact on estate planning$t$, $t$Current estate, gift, and trust provisions under federal tax law$t$, $t$Understanding estate planning changes affecting 2026$t$, $t$Strategic planning approaches for different wealth levels$t$, $t$Estate planning considerations for: Moderate wealth clients, High-net-worth individuals, Ultra-high-net-worth families$t$, $t$Income tax basis planning strategies$t$, $t$Lifetime gifting techniques and tax-efficient wealth transfers$t$, $t$Portability election rules and planning opportunities$t$, $t$Planning strategies for married couples$t$, $t$Estate and succession planning considerations for business owners$t$, $t$Trust planning under the latest federal tax law changes$t$, $t$Advanced life insurance applications in estate planning$t$, $t$Balancing estate tax planning with income tax planning$t$, $t$Post-mortem estate planning opportunities$t$, $t$Recent court rulings affecting estate and trust planning$t$, $t$Common estate planning mistakes and compliance considerations$t$, $t$Best practices for developing comprehensive estate plans$t$, $t$Practical case studies involving estate and trust planning$t$, $t$Strategies for preserving wealth while minimizing tax exposure$t$],
  array[$t$Certified Public Accountants (CPAs)$t$, $t$Enrolled Agents (EAs)$t$, $t$Tax Attorneys and Estate Planning Attorneys$t$, $t$Financial Advisors and Wealth Management Professionals$t$, $t$Compliance Officers$t$, $t$Business Owners and Corporate Executives$t$, $t$Trust Officers and Fiduciary Professionals$t$, $t$Tax Preparers and Tax Advisors$t$, $t$Accounting Professionals serving estate planning clients$t$, $t$Professionals involved in estate, gift, and trust taxation$t$, $t$Anyone seeking practical guidance on estate planning after H.R. 1 and the latest estate tax law changes$t$],
  2.0, $t$Taxes$t$, 'None', true, $t$2026 Estate Planning After H.R. 1 | Estate & Trust Planning Course$t$, $t$Learn how H.R. 1 and the Opportunity for a Better Budget Balance Act impact estate and trust planning in 2026. This course covers estate tax changes, portability elections, gifting strategies, income tax basis planning, trust planning, business succession, life insurance applications, and practical wealth preservation techniques for tax and financial professionals.$t$, $t$estate planning course 2026, H.R. 1 estate planning, OBBBA estate tax updates, estate and trust planning, portability election, gifting strategies, estate tax course, trust taxation, income tax basis planning, wealth transfer planning, Warren M Bergstein, IRS CPE estate planning$t$)
on conflict (slug) do update set title = excluded.title, presenter_id = excluded.presenter_id,
  description = excluded.description, topics_covered = excluded.topics_covered,
  who_should_attend = excluded.who_should_attend, cpe_credit = excluded.cpe_credit,
  field_of_study = excluded.field_of_study, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, meta_keyword = excluded.meta_keyword;
insert into pricing_options (course_id, code, label, description, price_cents, sort_order)
select c.id, v.code, v.label, v.description, v.price_cents, v.sort_order from courses c,
  (values ($t$SELF_STUDY$t$, $t$Self-Study$t$, $t$Watch the full course on demand in your portal.$t$, 24900, 0),
          ($t$ETRANSCRIPT$t$, $t$e-Transcript$t$, $t$A complete written transcript of the course.$t$, 11000, 1))
  as v(code, label, description, price_cents, sort_order)
where c.slug = $t$2026-estate-planning-after-h-r-1-with-new-estate-and-trust-rules$t$
on conflict (course_id, code) do update set label = excluded.label,
  description = excluded.description, price_cents = excluded.price_cents;

commit;

-- Check: select c.title, p.name, c.cpe_credit from courses c left join presenters p on p.id = c.presenter_id order by c.created_at desc;
