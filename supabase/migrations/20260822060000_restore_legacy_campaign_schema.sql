-- Restore the legacy campaign contract required by video publishing, social strategy,
-- campaign analytics and the audited Master campaign lifecycle.
-- This migration intentionally precedes every FK/reference to public.campaigns.

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 200),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'active', 'paused', 'ended')),
  audience_segment text,
  min_interest_score numeric,
  priority integer not null default 0,
  frequency_cap_per_day integer not null default 3
    check (frequency_cap_per_day > 0),
  conditions jsonb not null default '{}'::jsonb
    check (jsonb_typeof(conditions) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_valid_window check (ends_at > starts_at)
);

create table if not exists public.campaign_channels (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.campaigns(id) on delete cascade,
  channel text not null,
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(config) = 'object'),
  constraint campaign_channels_unique_channel unique (campaign_id, channel)
);

create table if not exists public.campaign_products (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.campaigns(id) on delete cascade,
  product_id uuid not null
    references public.products(id) on delete cascade,
  constraint campaign_products_unique_product unique (campaign_id, product_id)
);

create index if not exists idx_campaigns_status_window
  on public.campaigns(status, starts_at, ends_at);
create index if not exists idx_campaigns_priority
  on public.campaigns(priority desc, name);
create index if not exists idx_campaign_channels_campaign_enabled
  on public.campaign_channels(campaign_id, is_enabled);
create index if not exists idx_campaign_products_campaign
  on public.campaign_products(campaign_id);
create index if not exists idx_campaign_products_product
  on public.campaign_products(product_id);

alter table public.campaigns enable row level security;
alter table public.campaign_channels enable row level security;
alter table public.campaign_products enable row level security;

drop policy if exists campaigns_owner_select on public.campaigns;
create policy campaigns_owner_select
  on public.campaigns for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists campaign_channels_owner_select on public.campaign_channels;
create policy campaign_channels_owner_select
  on public.campaign_channels for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

drop policy if exists campaign_products_owner_select on public.campaign_products;
create policy campaign_products_owner_select
  on public.campaign_products for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'::public.app_role));

revoke all on public.campaigns, public.campaign_channels, public.campaign_products
  from public, anon, authenticated;
grant select on public.campaigns, public.campaign_products to authenticated;
-- Preserve the existing column-level secrecy contract for channel config.
grant select (id, campaign_id, channel, is_enabled)
  on public.campaign_channels to authenticated;
grant all on public.campaigns, public.campaign_channels, public.campaign_products
  to service_role;

comment on table public.campaigns is
  'Legacy campaign entity used by video publishing, social strategy and audited Master campaign operations.';
comment on table public.campaign_channels is
  'Channel configuration belonging to a legacy campaign; config is protected by column-level grants.';
comment on table public.campaign_products is
  'Product membership for a legacy campaign; product references are enforced by foreign keys.';
