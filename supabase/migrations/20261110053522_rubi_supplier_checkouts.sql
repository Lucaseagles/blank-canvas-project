-- RUBI 11× — official supplier checkout links configured by the Shadow Master.
-- Existing rows stay unverified and require review before retail publication.
-- All data remains covered by the existing owner-only server access and RLS.
alter table public.hub_suppliers
  add column if not exists checkout_host text;
alter table public.hub_products
  add column if not exists checkout_url text;
alter table public.hub_products
  add column if not exists checkout_verified boolean not null default false;

comment on column public.hub_suppliers.checkout_host is
  'Exact HTTPS checkout hostname manually confirmed by the owner with the supplier; never inferred from the pasted link.';
comment on column public.hub_products.checkout_url is
  'Official external checkout URL; private to owner-only server functions.';
comment on column public.hub_products.checkout_verified is
  'Owner reviewed SKU, offer, price and supplier destination; not proof of paid checkout or webhook integration.';

-- A checkout can only be approved when the URL exists; domain and HTTPS
-- are also validated by server-side functions on save and on every request.
do $
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'hub_products_verified_checkout_has_url'
      and conrelid = 'public.hub_products'::regclass
  ) then
    alter table public.hub_products
      add constraint hub_products_verified_checkout_has_url
      check (not checkout_verified or (checkout_url is not null and length(btrim(checkout_url)) > 0));
  end if;
end;
$;

-- Explicitly retain the original protections even on projects whose default
-- privileges changed after these catalog tables were first created.
alter table public.hub_products enable row level security;
alter table public.hub_suppliers enable row level security;
revoke all on public.hub_products, public.hub_suppliers from anon, authenticated;
