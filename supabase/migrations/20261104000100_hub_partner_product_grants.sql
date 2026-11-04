-- Draft migration: apply only after reviewing authorization and existing schema.
-- Server-only authorization ledger. RLS is intentionally enabled without client policies.
create table if not exists public.hub_partner_product_grants (
  id uuid primary key default gen_random_uuid(),
  commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
  product_id uuid not null references public.hub_products(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (commercial_profile_id, product_id)
);

create index if not exists hub_partner_product_grants_product_id_idx
  on public.hub_partner_product_grants(product_id);

alter table public.hub_partner_product_grants enable row level security;
-- No anon/authenticated policies. Owner-only server functions use the service-role client.
