-- Hub Eagles supplier-owned catalog. Never expose supplier costs to clients.
create table if not exists public.hub_suppliers (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 fulfillment_mode text not null default 'supplier', active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.hub_products (
 id uuid primary key default gen_random_uuid(),
 supplier_id uuid not null references public.hub_suppliers(id),
 title text not null, description text, image_url text,
 category text, sku text unique, active boolean not null default false,
 retail_price numeric(12,2) not null check(retail_price >= 0),
 supplier_cost numeric(12,2) not null check(supplier_cost >= 0),
 b2b_base_price numeric(12,2) check(b2b_base_price >= 0),
 min_b2b_quantity integer not null default 1 check(min_b2b_quantity > 0),
 created_at timestamptz not null default now()
);
create table if not exists public.hub_b2b_tiers (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.hub_products(id) on delete cascade,
 min_quantity integer not null check(min_quantity > 0),
 unit_price numeric(12,2) not null check(unit_price >= 0),
 unique(product_id,min_quantity)
);
insert into public.hub_suppliers(name,fulfillment_mode) values ('Kairos','supplier') on conflict(name) do nothing;
alter table public.hub_suppliers enable row level security;
alter table public.hub_products enable row level security;
alter table public.hub_b2b_tiers enable row level security;
revoke all on public.hub_suppliers, public.hub_products, public.hub_b2b_tiers from anon, authenticated;
-- Service-role server functions expose only role-appropriate projections.
