-- Phase 11.3 — Delight & Accessibility Blitz Migration

-- === Proof comments: pins & reasons ===
alter table proof_comments
  add column if not exists x numeric,
  add column if not exists y numeric,
  add column if not exists zoom numeric,
  add column if not exists reason text check (reason in ('logo','color','text','other')) default 'other';

-- === Proof versions & lineage ===
alter table proofs
  add column if not exists version int default 1,
  add column if not exists prev_proof_id varchar references proofs(id);

-- === Share link expiry & view receipts ===
alter table approvals
  add column if not exists share_expires_at timestamptz,
  add column if not exists views_count int default 0,
  add column if not exists last_viewed_at timestamptz;

-- === Assets: derivatives for thumbnails + alt text ===
alter table assets
  add column if not exists derivatives jsonb default '{}'::jsonb,
  add column if not exists alt text;

-- === Soft delete for assets ===
alter table assets
  add column if not exists deleted_at timestamptz;

-- === Add empress_role to users (for council admin) ===
alter table users
  add column if not exists empress_role text check (empress_role in ('admin', 'user')) default 'user';

-- === Tenant watermark settings ===
create table if not exists tenant_settings (
  tenant_id varchar primary key,
  watermark_enabled boolean default true,
  watermark_text text default 'Proof — Rainbow CRM',
  created_at timestamptz default now()
);

-- === Council alerts ===
create table if not exists council_alerts (
  id varchar primary key default gen_random_uuid(),
  key text unique,
  threshold numeric not null,
  direction text check (direction in ('above','below')) not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- === VIEWS FOR COUNCIL METRICS ===

-- 1) Users summary
create or replace view council_users as
select
  u.id,
  u.email,
  coalesce(u.full_name, split_part(u.email,'@',1)) as name,
  u.empress_role,
  w.balance as coins_balance,
  u.created_at
from users u
left join mirror_wallets w on w.user_id = u.id;

-- 2) Security signals (last 7 days)
create or replace view council_security_last7 as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where (meta->>'status')::text in ('401','403')) as auth_failures,
  count(*) filter (where source = 'rate_limit') as rate_limited,
  count(*) filter (where source = 'health' and message='ping_ok') as health_pings
from system_logs
where created_at >= now() - interval '7 days'
group by day
order by day;

-- 3) Analytics events daily (last 30)
create or replace view council_analytics_last30 as
select
  date_trunc('day', created_at) as day,
  count(*) as total_events,
  count(*) filter (where event_type = 'proof_approved') as approvals,
  count(*) filter (where event_type = 'asset_uploaded') as uploads,
  count(*) filter (where event_type = 'mockup_enqueued') as mockups
from analytics_events
where created_at >= now() - interval '30 days'
group by day
order by day;

-- 4) Wallet spending (last 30)
create or replace view council_spend_last30 as
select
  date_trunc('day', created_at) as day,
  sum(case when delta < 0 then -delta else 0 end) as coins_spent,
  sum(case when delta > 0 then delta else 0 end) as coins_granted
from mirror_tx
where created_at >= now() - interval '30 days'
group by day
order by day;

-- 5) UX KPIs view (last 30 days)
create or replace view council_kpis_last30 as
with first_value as (
  select owner_id, min(created_at) as first_approval_at
  from analytics_events
  where event_type = 'proof_approved'
  group by owner_id
),
signup as (
  select id as user_id, created_at as signup_at from users
)
select
  date_trunc('day', e.created_at) as day,
  avg(extract(epoch from (fv.first_approval_at - s.signup_at))/3600)
    filter (where fv.first_approval_at is not null) as ttfv_hours,
  percentile_cont(0.5) within group (order by (e.meta->>'turnaround_hours')::numeric)
    filter (where e.event_type='proof_approved') as approval_median_hours,
  (count(*) filter (where e.event_type='proof_changes_requested')::numeric) /
  nullif(count(*) filter (where e.event_type in ('proof_approved','proof_changes_requested'))::numeric,0) as rework_rate
from analytics_events e
left join first_value fv on fv.owner_id = e.owner_id
left join signup s on s.user_id = e.owner_id
where e.created_at >= now() - interval '30 days'
group by 1
order by 1;

-- Add index for performance
create index if not exists idx_analytics_events_created_at on analytics_events(created_at);
create index if not exists idx_analytics_events_owner_id on analytics_events(owner_id);
create index if not exists idx_analytics_events_event_type on analytics_events(event_type);
create index if not exists idx_system_logs_created_at on system_logs(created_at);
create index if not exists idx_mirror_tx_created_at on mirror_tx(created_at);