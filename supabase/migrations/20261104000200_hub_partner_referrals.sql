-- Partner-specific referral links and verified visit events.
-- No public client policies: all access is through validated server functions.
create table if not exists public.hub_partner_referral_links (
 id uuid primary key default gen_random_uuid(),
 commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
 product_id uuid not null references public.hub_products(id) on delete cascade,
 code uuid not null default gen_random_uuid() unique,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique (commercial_profile_id, product_id)
);
create table if not exists public.hub_partner_referral_visits (
 id uuid primary key default gen_random_uuid(),
 referral_link_id uuid not null references public.hub_partner_referral_links(id) on delete cascade,
 visited_at timestamptz not null default now()
);
create index if not exists hub_partner_referral_visits_link_time_idx
 on public.hub_partner_referral_visits(referral_link_id, visited_at desc);
alter table public.hub_partner_referral_links enable row level security;
alter table public.hub_partner_referral_visits enable row level security;
revoke all on public.hub_partner_referral_links, public.hub_partner_referral_visits from anon, authenticated;
-- A visit is not a confirmed order or a commission.
