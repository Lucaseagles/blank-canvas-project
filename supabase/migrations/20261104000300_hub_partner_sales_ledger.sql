-- Partner commercial agreements and confirmed-order ledger.
-- No payment confirmation is inferred from visits or UTM parameters.
create table if not exists public.hub_partner_agreements (
 id uuid primary key default gen_random_uuid(),
 commercial_profile_id uuid not null unique references public.commercial_profiles(id) on delete cascade,
 commission_percent numeric(5,2) not null check (commission_percent between 0 and 100),
 active boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.hub_partner_confirmed_sales (
 id uuid primary key default gen_random_uuid(),
 referral_link_id uuid not null references public.hub_partner_referral_links(id),
 external_order_id text not null,
 source text not null check (source in ('verified_webhook','admin_reconciliation')),
 gross_amount numeric(12,2) not null check (gross_amount >= 0),
 commission_percent numeric(5,2) not null check (commission_percent between 0 and 100),
 commission_amount numeric(12,2) generated always as (round(gross_amount * commission_percent / 100, 2)) stored,
 confirmed_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(source, external_order_id)
);
create index if not exists hub_partner_sales_link_idx on public.hub_partner_confirmed_sales(referral_link_id, confirmed_at desc);
alter table public.hub_partner_agreements enable row level security;
alter table public.hub_partner_confirmed_sales enable row level security;
revoke all on public.hub_partner_agreements, public.hub_partner_confirmed_sales from anon, authenticated;
-- Only trusted server-side webhook verification or authorized admin reconciliation
-- may write confirmed sales. No public write policies.
