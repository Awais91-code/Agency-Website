-- M02 safe local development seed data. All addresses use the reserved .test domain.

insert into public.content_records (
  id,
  content_type,
  slug,
  title,
  status,
  metadata
)
values (
  '10000000-0000-4000-8000-000000000001',
  'system',
  'm02-development-record',
  'M02 development record',
  'draft',
  '{"seed": true}'::jsonb
)
on conflict (content_type, slug) do update
set title = excluded.title,
    metadata = excluded.metadata,
    updated_at = now();

insert into public.leads (
  id,
  full_name,
  email,
  company_name,
  source,
  status,
  metadata
)
values (
  '20000000-0000-4000-8000-000000000001',
  'Demo Lead',
  'demo.lead@example.test',
  'Demo Company',
  'seed',
  'new',
  '{"seed": true}'::jsonb
)
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    company_name = excluded.company_name,
    source = excluded.source,
    status = excluded.status,
    metadata = excluded.metadata;

insert into public.projects (
  id,
  lead_id,
  name,
  status,
  metadata
)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Demo Agency Project',
  'planned',
  '{"seed": true}'::jsonb
)
on conflict (id) do update
set lead_id = excluded.lead_id,
    name = excluded.name,
    status = excluded.status,
    metadata = excluded.metadata;

insert into public.activity_events (
  event_id,
  entity_type,
  entity_id,
  event_type,
  source,
  metadata
)
values (
  '40000000-0000-4000-8000-000000000001',
  'lead',
  '20000000-0000-4000-8000-000000000001',
  'lead.seeded',
  'seed',
  '{"seed": true}'::jsonb
)
on conflict (event_id) do nothing;

-- M06 development service content. Replace this copy from the admin CMS for real agency positioning.
insert into public.services (
  id, slug, title, eyebrow, short_description, hero_title, hero_description,
  problems, deliverables, outcomes, process_steps, technologies, pricing_note,
  cta_label, cta_href, seo_title, seo_description, status, is_featured, sort_order, published_at
)
values
(
  '61000000-0000-4000-8000-000000000001',
  'web-development', 'Web Development', 'Web platforms',
  'Fast, accessible websites and web applications built around measurable business goals.',
  'Modern web experiences that turn attention into action.',
  'From high-converting marketing sites to authenticated web applications, we design the structure and engineering around maintainability, performance and a clear user journey.',
  array['Outdated or slow website experience','Hard-to-maintain content and duplicated code','Weak conversion paths and unclear calls to action'],
  array['Responsive web interface','Reusable component system','Server-side integrations','Performance and accessibility QA'],
  array['Faster, clearer customer journeys','A maintainable platform that can grow','Better connection between marketing and operations'],
  '[{"title":"Discovery & scope","description":"Define goals, users, content, integrations and success criteria."},{"title":"UX & interface","description":"Map the page structure and create reusable visual patterns."},{"title":"Development","description":"Build responsive, tested frontend and server-side behavior."},{"title":"QA & launch","description":"Verify performance, accessibility and production readiness."}]'::jsonb,
  array['Next.js','TypeScript','Supabase','PostgreSQL','API integrations'],
  'Final scope and pricing are confirmed after requirements review.',
  'Discuss your web project', '/contact?service=web-development',
  'Web Development Services', 'Modern agency web development for marketing websites and web applications.',
  'published', true, 10, now()
),
(
  '61000000-0000-4000-8000-000000000002',
  'ui-ux-design', 'UI/UX Design', 'Product design',
  'Research-informed interfaces that make complex products easier to understand and use.',
  'Interfaces that feel clear before they feel clever.',
  'We turn product goals and user tasks into structured flows, reusable design systems and responsive interfaces that reduce friction across the experience.',
  array['Confusing navigation or product flows','Inconsistent visual patterns','Interfaces that do not adapt well across devices'],
  array['Information architecture','Wireframes and high-fidelity UI','Responsive component states','Design-system foundations'],
  array['Clearer product decisions','More consistent implementation','Lower design debt as the product grows'],
  '[{"title":"Understand","description":"Review users, workflows, constraints and product goals."},{"title":"Structure","description":"Define journeys, hierarchy and critical interaction states."},{"title":"Design","description":"Create responsive visual systems and reusable components."},{"title":"Handoff","description":"Document patterns and collaborate through implementation."}]'::jsonb,
  array['Figma','Design systems','Responsive UI','Prototyping'],
  'Engagement size depends on product scope and number of workflows.',
  'Plan a design engagement', '/contact?service=ui-ux-design',
  'UI/UX Design Services', 'Product UX, interface design and design-system services for modern digital products.',
  'published', true, 20, now()
),
(
  '61000000-0000-4000-8000-000000000003',
  'automation', 'Automation', 'Connected operations',
  'Reliable workflows that remove repetitive handoffs while keeping important decisions under human control.',
  'Automate repetitive work without losing operational visibility.',
  'We connect forms, databases, communication tools and external APIs into traceable workflows that save time and reduce manual duplication.',
  array['Manual copy-paste between systems','Slow lead and client follow-up','Operational steps that depend on memory'],
  array['Workflow mapping','n8n automation','API and webhook integrations','Retry, logging and failure handling'],
  array['Less repetitive administration','Faster response times','More consistent operational handoffs'],
  '[{"title":"Map","description":"Document the current process, ownership and failure points."},{"title":"Connect","description":"Define APIs, data contracts and secure credentials."},{"title":"Automate","description":"Build the workflow with retries, logging and approval gates."},{"title":"Observe","description":"Test failures and make important events visible to the team."}]'::jsonb,
  array['n8n','Webhooks','REST APIs','Supabase','Email integrations'],
  'Automation scope is based on systems, branches and integration complexity.',
  'Map an automation', '/contact?service=automation',
  'Business Automation Services', 'n8n, API and workflow automation for agency and business operations.',
  'published', true, 30, now()
),
(
  '61000000-0000-4000-8000-000000000004',
  'ai-solutions', 'AI Solutions', 'Practical AI',
  'Grounded AI assistants and workflow features designed around approved business knowledge and real tasks.',
  'AI features built around useful work, not demos.',
  'We design AI-assisted experiences with controlled knowledge sources, clear guardrails and human handoff so they support customers and teams without inventing business facts.',
  array['Repeated support and pre-sales questions','Knowledge spread across disconnected sources','AI experiments without governance or measurable workflow value'],
  array['AI assistant UX','Knowledge retrieval architecture','Guardrails and evaluation cases','Workflow integrations and handoff'],
  array['Faster access to approved knowledge','More consistent customer support','AI behavior that is easier to monitor and improve'],
  '[{"title":"Use case","description":"Define the task, user, allowed knowledge and expected handoff."},{"title":"Knowledge","description":"Prepare approved sources and retrieval boundaries."},{"title":"Build","description":"Create the assistant experience and restricted tool access."},{"title":"Evaluate","description":"Test factuality, guardrails and failure behavior before launch."}]'::jsonb,
  array['LLM APIs','RAG','Vector search','n8n','Supabase'],
  'AI project pricing depends on knowledge sources, model usage and integration scope.',
  'Discuss an AI use case', '/contact?service=ai-solutions',
  'AI Solutions for Business Workflows', 'Grounded AI assistants, retrieval and workflow integrations for modern business systems.',
  'published', true, 40, now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  eyebrow = excluded.eyebrow,
  short_description = excluded.short_description,
  hero_title = excluded.hero_title,
  hero_description = excluded.hero_description,
  problems = excluded.problems,
  deliverables = excluded.deliverables,
  outcomes = excluded.outcomes,
  process_steps = excluded.process_steps,
  technologies = excluded.technologies,
  pricing_note = excluded.pricing_note,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  published_at = excluded.published_at,
  archived_at = null,
  updated_at = now();

insert into public.service_faqs (id, service_id, question, answer, sort_order, visible)
values
('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001','Can you rebuild an existing website?','Yes. Existing content, SEO requirements and integrations can be reviewed before the new architecture is finalized.',10,true),
('62000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000001','Do you build custom web applications?','Yes. Authenticated dashboards, portals, internal tools and workflow-driven web applications can be scoped as custom builds.',20,true)
on conflict (id) do update set
  question = excluded.question,
  answer = excluded.answer,
  sort_order = excluded.sort_order,
  visible = excluded.visible,
  updated_at = now();

insert into public.service_relations (service_id, related_service_id, sort_order)
values
('61000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002',10),
('61000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000003',20),
('61000000-0000-4000-8000-000000000003','61000000-0000-4000-8000-000000000004',10)
on conflict (service_id, related_service_id) do update set sort_order = excluded.sort_order;


-- M07 portfolio/case-study development content.
-- These rows are explicitly labelled "Internal concept" and do not claim real client results.
insert into public.case_studies (
  id, slug, title, project_label, client_name, industry, short_description,
  hero_title, hero_description, problem, approach, solution, result_summary,
  technologies, tags, cta_label, cta_href, seo_title, seo_description,
  status, is_featured, sort_order, published_at
)
values
(
  '71000000-0000-4000-8000-000000000001',
  'service-business-growth-platform',
  'Service Business Growth Platform',
  'Internal concept',
  null,
  'Professional services',
  'A conversion-led agency concept connecting a premium marketing experience to structured enquiries and follow-up.',
  'A marketing experience connected to the sales workflow behind it.',
  'This internal concept demonstrates how a modern agency site can capture structured project context, surface relevant work and prepare the next sales action without fabricating a client engagement.',
  'Many service websites stop at a generic contact form. That creates unstructured enquiries, slower qualification and duplicated follow-up work across email, spreadsheets and calendars.',
  'The concept treats the public website and early sales workflow as one connected product. Messaging, proof, project intake and operational handoff are designed around the same lead journey.',
  'A modular Next.js marketing experience connects service pages, case studies, a future project brief, CRM records and automation-ready events while keeping pricing and contractual decisions under human control.',
  'The concept provides a reusable reference architecture for the agency platform itself. It is intentionally presented as an internal concept rather than as a completed client result.',
  array['Next.js','TypeScript','Supabase','n8n'],
  array['Lead generation','Marketing site','Automation'],
  'Plan a similar platform',
  '/contact?project=service-platform',
  'Service Business Growth Platform — Agency Concept',
  'An internal agency concept showing how a premium website can connect structured enquiries, CRM context and automation.',
  'published', true, 10, now()
),
(
  '71000000-0000-4000-8000-000000000002',
  'operations-command-center',
  'Operations Command Center',
  'Internal concept',
  null,
  'Business operations',
  'A focused dashboard concept bringing operational status, action queues and business signals into one workspace.',
  'Operational context designed around the next decision.',
  'This internal product concept explores how dense operational information can be organized into a calmer interface with clear ownership, priority and next actions.',
  'Operational teams often switch between disconnected tools and lose time rebuilding context before deciding what needs attention next.',
  'The interface is structured around action priority, concise status signals and progressive detail instead of trying to show every possible metric at once.',
  'A responsive dashboard shell combines status cards, prioritized queues, activity context and reusable interface patterns that can later connect to real data sources and permissions.',
  'The concept demonstrates the agency''s product-design and dashboard architecture approach. It does not claim production metrics or a real client deployment.',
  array['Next.js','PostgreSQL','Design systems'],
  array['Dashboard','Internal tooling','UI/UX'],
  'Discuss an internal tool',
  '/contact?project=dashboard',
  'Operations Command Center — Agency Concept',
  'An internal dashboard concept focused on operational clarity, prioritization and reusable interface architecture.',
  'published', true, 20, now()
),
(
  '71000000-0000-4000-8000-000000000003',
  'client-onboarding-system',
  'Client Onboarding System',
  'Internal concept',
  null,
  'Agency operations',
  'A connected onboarding concept coordinating forms, files, communication and internal handoffs without duplicate work.',
  'A smoother handoff from signed project to active delivery.',
  'This internal workflow concept shows how onboarding events can be coordinated while keeping the application database as the source of truth and important approvals visible to people.',
  'Client onboarding commonly involves repeated requests for the same information, scattered files and manual internal reminders that are easy to miss.',
  'The workflow is modeled as explicit business events with idempotent automation, human approval gates and a clear activity trail rather than as an opaque chain of tool-to-tool actions.',
  'Structured onboarding data triggers notifications, checklist creation and secure file/request flows while retries and failures remain observable to staff.',
  'The concept documents an automation pattern that can be adapted to real agency onboarding after the exact tools and policies are confirmed.',
  array['n8n','Supabase','Webhooks','Email APIs'],
  array['Automation','Client experience','Workflow'],
  'Map an onboarding workflow',
  '/contact?project=onboarding',
  'Client Onboarding System — Agency Concept',
  'An internal automation concept for coordinating onboarding forms, files, notifications and handoffs.',
  'published', true, 30, now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  project_label = excluded.project_label,
  client_name = excluded.client_name,
  industry = excluded.industry,
  short_description = excluded.short_description,
  hero_title = excluded.hero_title,
  hero_description = excluded.hero_description,
  problem = excluded.problem,
  approach = excluded.approach,
  solution = excluded.solution,
  result_summary = excluded.result_summary,
  technologies = excluded.technologies,
  tags = excluded.tags,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  published_at = excluded.published_at,
  archived_at = null,
  updated_at = now();

insert into public.case_study_services (case_study_id, service_id, sort_order)
values
('71000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001',10),
('71000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000003',20),
('71000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000002',10),
('71000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000001',20),
('71000000-0000-4000-8000-000000000003','61000000-0000-4000-8000-000000000003',10),
('71000000-0000-4000-8000-000000000003','61000000-0000-4000-8000-000000000004',20)
on conflict (case_study_id, service_id) do update set sort_order = excluded.sort_order;

update public.services
set related_case_study_slugs = case slug
  when 'web-development' then array['service-business-growth-platform','operations-command-center']
  when 'ui-ux-design' then array['operations-command-center']
  when 'automation' then array['service-business-growth-platform','client-onboarding-system']
  when 'ai-solutions' then array['client-onboarding-system']
  else related_case_study_slugs
end,
updated_at = now()
where slug in ('web-development','ui-ux-design','automation','ai-solutions');

-- M08 quote guidance rules. Amounts are illustrative development defaults, not binding public prices.
insert into public.estimate_rules (
  id, rule_key, label, rule_type, service_type, match_key, amount_min, amount_max, multiplier, currency, config, is_active, sort_order
)
values
('81000000-0000-4000-8000-000000000001','base.website','Marketing / company website','base','website','base',2500,5000,1,'USD','{}',true,10),
('81000000-0000-4000-8000-000000000002','base.ecommerce','Ecommerce website','base','ecommerce','base',4000,8000,1,'USD','{}',true,20),
('81000000-0000-4000-8000-000000000003','base.web-app','Custom web application','base','web-app','base',6000,12000,1,'USD','{}',true,30),
('81000000-0000-4000-8000-000000000004','base.mobile-app','Mobile application','base','mobile-app','base',8000,16000,1,'USD','{}',true,40),
('81000000-0000-4000-8000-000000000005','base.ui-ux','UI/UX engagement','base','ui-ux','base',2000,4500,1,'USD','{}',true,50),
('81000000-0000-4000-8000-000000000006','base.automation','Automation project','base','automation','base',1500,4000,1,'USD','{}',true,60),
('81000000-0000-4000-8000-000000000007','base.ai-solution','AI solution','base','ai-solution','base',3500,7500,1,'USD','{}',true,70),
('81000000-0000-4000-8000-000000000008','base.other','Other / needs discovery','base','other','base',2500,6000,1,'USD','{}',true,80),
('81000000-0000-4000-8000-000000000101','feature.auth','User accounts / authentication','feature',null,'auth',700,1400,1,'USD','{}',true,110),
('81000000-0000-4000-8000-000000000102','feature.payments','Online payments','feature',null,'payments',800,1800,1,'USD','{}',true,120),
('81000000-0000-4000-8000-000000000103','feature.admin-dashboard','Admin dashboard','feature',null,'admin-dashboard',1200,2800,1,'USD','{}',true,130),
('81000000-0000-4000-8000-000000000104','feature.booking','Booking / scheduling','feature',null,'booking',500,1200,1,'USD','{}',true,140),
('81000000-0000-4000-8000-000000000105','feature.multilingual','Multiple languages','feature',null,'multilingual',600,1600,1,'USD','{}',true,150),
('81000000-0000-4000-8000-000000000106','feature.integrations','External API integrations','feature',null,'integrations',900,2200,1,'USD','{}',true,160),
('81000000-0000-4000-8000-000000000107','feature.ai-assistant','AI assistant / RAG','feature',null,'ai-assistant',1600,4000,1,'USD','{}',true,170),
('81000000-0000-4000-8000-000000000108','feature.workflow-automation','Workflow automation','feature',null,'workflow-automation',900,2400,1,'USD','{}',true,180),
('81000000-0000-4000-8000-000000000109','feature.data-migration','Data/content migration','feature',null,'data-migration',500,1800,1,'USD','{}',true,190),
('81000000-0000-4000-8000-000000000201','complexity.standard','Standard complexity','complexity',null,'standard',0,0,1.00,'USD','{}',true,210),
('81000000-0000-4000-8000-000000000202','complexity.advanced','Advanced complexity','complexity',null,'advanced',0,0,1.25,'USD','{}',true,220),
('81000000-0000-4000-8000-000000000203','complexity.enterprise','High integration / enterprise complexity','complexity',null,'enterprise',0,0,1.50,'USD','{}',true,230),
('81000000-0000-4000-8000-000000000301','urgency.flexible','Flexible timing','urgency',null,'flexible',0,0,1.00,'USD','{}',true,310),
('81000000-0000-4000-8000-000000000302','urgency.standard','Standard timeline','urgency',null,'standard',0,0,1.05,'USD','{}',true,320),
('81000000-0000-4000-8000-000000000303','urgency.urgent','Urgent / compressed timeline','urgency',null,'urgent',0,0,1.20,'USD','{}',true,330),
('81000000-0000-4000-8000-000000000401','support.none','No ongoing support selected','support',null,'none',0,0,1,'USD','{}',true,410),
('81000000-0000-4000-8000-000000000402','support.launch','Launch support package','support',null,'launch-support',500,1000,1,'USD','{}',true,420),
('81000000-0000-4000-8000-000000000403','support.retainer','Initial monthly support / retainer','support',null,'monthly-retainer',1000,2000,1,'USD','{}',true,430)
on conflict (id) do update set
  rule_key = excluded.rule_key,
  label = excluded.label,
  rule_type = excluded.rule_type,
  service_type = excluded.service_type,
  match_key = excluded.match_key,
  amount_min = excluded.amount_min,
  amount_max = excluded.amount_max,
  multiplier = excluded.multiplier,
  currency = excluded.currency,
  config = excluded.config,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Point development seed content at the M08 structured project brief.
update public.services
set cta_href = '/start-a-project?service=' || slug,
    updated_at = now()
where slug in ('web-development','ui-ux-design','automation','ai-solutions');

update public.case_studies
set cta_href = '/start-a-project',
    updated_at = now()
where project_label = 'Internal concept';
