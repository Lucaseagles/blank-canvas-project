-- Offer Engine: manual, private mapping of complementary products.
-- Does not create checkout add-ons, orders, payments, upsell charges or price overrides.
create table if not exists public.rubi_complementary_offers (
  id uuid primary key default gen_random_uuid(),
  primary_product_id uuid not null references public.hub_products(id) on delete cascade,
  suggested_product_id uuid not null references public.hub_products(id) on delete cascade,
  kind text not null check (kind in ('order_bump','upsell','cross_sell','downsell')),
  headline text not null check (char_length(headline) between 8 and 180),
  explanation text not null default '' check (char_length(explanation)<=700),
  position integer not null default 0 check (position between 0 and 10000),
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(primary_product_id,suggested_product_id,kind),
  check(primary_product_id <> suggested_product_id)
);
create index if not exists rubi_complementary_offers_primary_idx
 on public.rubi_complementary_offers(primary_product_id,position)
 where active;
alter table public.rubi_complementary_offers enable row level security;
revoke all on public.rubi_complementary_offers from public,anon,authenticated;
comment on table public.rubi_complementary_offers is 'Curated editorial add-on candidates. Checkout mutations must be configured and independently validated with supplier.';
