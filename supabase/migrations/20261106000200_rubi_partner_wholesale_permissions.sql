-- RUBI #40: explicit, per-partner wholesale offer authorization.
-- REVIEW BEFORE APPLYING. No automatic deployment from this PR.
-- Existing hub_partner_product_grants continues to authorize retail products.
-- Wholesale is opt-in per partner AND per product, independent of partner_type.
create table if not exists public.hub_partner_wholesale_permissions (
  id uuid primary key default gen_random_uuid(),
  commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
  product_id uuid not null references public.hub_products(id) on delete cascade,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (commercial_profile_id, product_id)
);
create index if not exists hub_partner_wholesale_permissions_product_idx
  on public.hub_partner_wholesale_permissions (product_id);
alter table public.hub_partner_wholesale_permissions enable row level security;
revoke all on public.hub_partner_wholesale_permissions from anon, authenticated;
-- No client policies: only authorized server functions may manage/read permissions.
-- Server must additionally verify approved partner, active product, positive B2B price,
-- and an active hub_partner_product_grants row before exposing wholesale prices.
-- Revoking product authorization must invalidate wholesale eligibility at read time.
