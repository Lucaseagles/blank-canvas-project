-- Internal Master campaign planning only. No ad spending, supplier publishing or financial orders.
create table if not exists public.rubi_master_campaign_plans (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.hub_products(id) on delete restrict,
 campaign_code text not null check (campaign_code ~ '^[a-z0-9][a-z0-9_-]{0,59}$'),
 mode text not null check (mode in ('ai_seller_video','direct_response','creator_team')),
 audience text not null check (audience in ('consumer','merchant','partner')),
 daily_budget numeric(12,2) not null check (daily_budget > 0 and daily_budget <= 10000),
 run_days integer not null check (run_days between 1 and 90),
 claim_evidence text not null default '' check (char_length(claim_evidence) <= 1500),
 responsible_name text not null default '' check (char_length(responsible_name) <= 120),
 status text not null default 'draft' check (status in ('draft','ready_for_review','approved','paused')),
 approval_note text not null default '' check (char_length(approval_note) <= 1000),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint rubi_master_campaign_plan_approval_consistency check (
  (status='approved' and approved_at is not null) or (status <> 'approved' and approved_at is null)
 )
);
create unique index if not exists rubi_master_campaign_plan_product_code
 on public.rubi_master_campaign_plans(product_id,campaign_code);
create index if not exists rubi_master_campaign_plan_status_idx
 on public.rubi_master_campaign_plans(status,created_at desc);
create table if not exists public.rubi_master_campaign_plan_audit (
 id bigint generated always as identity primary key,
 plan_id uuid not null references public.rubi_master_campaign_plans(id) on delete cascade,
 action text not null check (action in ('created','edited','submitted','approved','paused')),
 old_status text,
 new_status text not null,
 details text not null default '' check (char_length(details) <= 1000),
 created_at timestamptz not null default now()
);
alter table public.rubi_master_campaign_plans enable row level security;
alter table public.rubi_master_campaign_plan_audit enable row level security;
revoke all on public.rubi_master_campaign_plans from public,anon,authenticated;
revoke all on public.rubi_master_campaign_plan_audit from public,anon,authenticated;
comment on table public.rubi_master_campaign_plans is 'Private Master campaign planning; approval authorizes only internal preparation, not external advertising or financial spending.';
comment on table public.rubi_master_campaign_plan_audit is 'Private append-only campaign decision log managed by owner-only server functions.';
