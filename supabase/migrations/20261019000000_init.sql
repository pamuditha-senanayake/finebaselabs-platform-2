-- Findbase Labs customer portal: schema + seed data.
-- All access goes through Next.js API routes using the service role key, so RLS is enabled with no public policies.

create table if not exists products (
  id text primary key, name text not null, tagline text, description text,
  category text not null check (category in ('Platform','Service','Add-on')),
  price numeric(10,2) not null, billing text not null check (billing in ('one-time','monthly','yearly')),
  features text[] not null default '{}'
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null, last_name text not null, email text unique not null, phone text,
  company text, role text, country text, timezone text, created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key, customer_id uuid not null references customers on delete cascade,
  product_id text not null references products, amount numeric(10,2) not null, method text,
  status text not null default 'paid' check (status in ('paid','refund_pending','refunded','refund_denied')),
  created_at timestamptz not null default now()
);

create table if not exists refund_requests (
  id text primary key default ('RF-' || lpad((floor(random()*900000)+100000)::int::text, 6, '0')),
  order_id text not null references orders, customer_id uuid not null references customers,
  reason text not null, source text not null check (source in ('Purchase history','Chat','Agent')),
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  decision_note text, decided_by text, decided_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers on delete cascade,
  status text not null default 'open' check (status in ('open','closed')),
  agent_typing boolean not null default false, created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade,
  seq bigint generated always as identity,
  sender text not null check (sender in ('customer','agent','system')), sender_name text,
  body text not null, actions jsonb, delivered_to_hub boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_seq on messages (conversation_id, seq);
create index if not exists orders_customer on orders (customer_id, created_at desc);

alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table refund_requests enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Seed data
insert into products (id, name, tagline, description, category, price, billing, features) values
 ('p-core','Findbase Core','Unified customer data layer','A single source of truth for every customer interaction, synced across all of your tools in real time.','Platform',49,'monthly',array['Unlimited contacts','Real-time sync','REST & webhook API','99.9% uptime SLA']),
 ('p-insight','Insight Analytics','Dashboards without the noise','Cohort, funnel and retention analytics with a query builder that actually respects your time.','Platform',89,'monthly',array['Cohort & funnel reports','Custom metrics','Scheduled exports','Role-based access']),
 ('p-agent','Agent Gateway','Connect external support agents','Bridge outside AI and human agents into the customer chat with scoped, auditable permissions.','Platform',129,'monthly',array['Agent handoff protocol','Scoped tokens','Audit trail','Live transcript stream']),
 ('p-vault','Vault Storage','Encrypted document storage','End-to-end encrypted file storage with versioning and customer-managed keys.','Add-on',19,'monthly',array['500 GB included','Version history','Customer-managed keys','Granular sharing']),
 ('p-onboard','Onboarding Sprint','Two weeks, fully set up','A dedicated engineer migrates your data, configures workflows and trains your team.','Service',2400,'one-time',array['Data migration','Workflow setup','2 training sessions','14-day hypercare']),
 ('p-audit','Security Audit','Independent review & report','A full review of your integration surface with prioritized remediation guidance.','Service',3900,'one-time',array['Threat model','Pen-test of integrations','Executive summary','Remediation plan']),
 ('p-support','Priority Support','Humans in under 15 minutes','Named support engineer, private channel and guaranteed response times.','Add-on',299,'yearly',array['15-min first response','Named engineer','Private channel','Quarterly reviews']),
 ('p-sso','SSO & SCIM','Enterprise identity','SAML single sign-on and automated user provisioning for your whole organization.','Add-on',39,'monthly',array['SAML 2.0','SCIM provisioning','Directory sync','Session policies'])
on conflict (id) do nothing;

insert into customers (id, first_name, last_name, email, phone, company, role, country, timezone) values
 ('11111111-1111-4111-8111-111111111111','Amara','Fernando','amara.fernando@northwind.io','+94 77 123 4567','Northwind Logistics','Head of Operations','Sri Lanka','Asia/Colombo (UTC+5:30)')
on conflict (email) do nothing;

insert into orders (id, customer_id, product_id, amount, method, status, created_at) values
 ('ORD-10482','11111111-1111-4111-8111-111111111111','p-agent',129,'Visa •••• 4242','paid',now() - interval '4 days'),
 ('ORD-10455','11111111-1111-4111-8111-111111111111','p-vault',19,'Visa •••• 4242','paid',now() - interval '12 days'),
 ('ORD-10391','11111111-1111-4111-8111-111111111111','p-onboard',2400,'Wire transfer','paid',now() - interval '26 days'),
 ('ORD-10277','11111111-1111-4111-8111-111111111111','p-insight',89,'Visa •••• 4242','paid',now() - interval '41 days'),
 ('ORD-10102','11111111-1111-4111-8111-111111111111','p-core',49,'Visa •••• 4242','paid',now() - interval '74 days'),
 ('ORD-09876','11111111-1111-4111-8111-111111111111','p-support',299,'Mastercard •••• 8810','refunded',now() - interval '130 days'),
 ('ORD-09511','11111111-1111-4111-8111-111111111111','p-sso',39,'Mastercard •••• 8810','paid',now() - interval '210 days')
on conflict (id) do nothing;

insert into refund_requests (id, order_id, customer_id, reason, source, status, decision_note, decided_by, decided_at, created_at) values
 ('RF-204','ORD-09876','11111111-1111-4111-8111-111111111111','Duplicate purchase','Chat','approved','Duplicate charge confirmed','agent:refund-agent',now() - interval '117 days',now() - interval '118 days')
on conflict (id) do nothing;
