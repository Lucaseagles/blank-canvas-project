-- Master-curated home sections, no automatic publication or checkout changes.
create table if not exists public.rubi_storefront_sections (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('hero','collection')),
 title text not null check (char_length(btrim(title)) between 4 and 100),
 subtitle text not null default '' check (char_length(subtitle)<=280),
 product_ids uuid[] not null default '{}'::uuid[] check (cardinality(product_ids) between 1 and 12),
 status text not null default 'draft' check (status in ('draft','published')),
 starts_at timestamptz,
 ends_at timestamptz,
 position integer not null default 0 check (position between 0 and 1000),
 revision integer not null default 1 check (revision>0),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 constraint rubi_storefront_section_date_order check (starts_at is null or ends_at is null or starts_at < ends_at)
);
create index if not exists rubi_storefront_sections_order_idx on public.rubi_storefront_sections(status,position);
alter table public.rubi_storefront_sections enable row level security;
revoke all on public.rubi_storefront_sections from public,anon,authenticated;
comment on table public.rubi_storefront_sections is 'Private Master-curated homepage placements. Public readers access only whitelisted published product presentation via server functions.';
