-- Commission payout records are separate from confirmed sales.
-- A payout can cover one or more sales; each sale may be settled only once.
create table if not exists public.hub_partner_commission_payouts (
 id uuid primary key default gen_random_uuid(),
 commercial_profile_id uuid not null references public.commercial_profiles(id),
 payment_reference text not null unique,
 paid_amount numeric(12,2) not null check (paid_amount > 0),
 paid_at timestamptz not null,
 note text,
 created_at timestamptz not null default now()
);
create table if not exists public.hub_partner_commission_payout_items (
 payout_id uuid not null references public.hub_partner_commission_payouts(id) on delete restrict,
 sale_id uuid not null unique references public.hub_partner_confirmed_sales(id) on delete restrict,
 commission_amount numeric(12,2) not null check (commission_amount > 0),
 primary key (payout_id, sale_id)
);
create index if not exists hub_partner_payout_profile_idx on public.hub_partner_commission_payouts(commercial_profile_id, paid_at desc);
alter table public.hub_partner_commission_payouts enable row level security;
alter table public.hub_partner_commission_payout_items enable row level security;
revoke all on public.hub_partner_commission_payouts, public.hub_partner_commission_payout_items from anon, authenticated;
-- No client write policies. Only owner-gated server reconciliation may insert.
