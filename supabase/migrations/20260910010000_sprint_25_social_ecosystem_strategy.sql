create table if not exists public.social_channel_strategies (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.social_channels(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.curated_collections(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  audience_segment text,
  objective text not null default 'traffic' check (objective in ('traffic','engagement','followers','conversion','awareness')),
  content_pillars text[] not null default '{}',
  preferred_formats text[] not null default '{}',
  posting_frequency_per_week integer not null default 3 check (posting_frequency_per_week between 1 and 50),
  cta text,
  priority integer not null default 0 check (priority between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_social_strategy_channel on public.social_channel_strategies(channel_id, is_active);
create index if not exists idx_social_strategy_category on public.social_channel_strategies(category_id) where category_id is not null;
create index if not exists idx_social_strategy_collection on public.social_channel_strategies(collection_id) where collection_id is not null;
create index if not exists idx_social_strategy_campaign on public.social_channel_strategies(campaign_id) where campaign_id is not null;
alter table public.social_channel_strategies enable row level security;
drop policy if exists "social_strategy_public_select_active" on public.social_channel_strategies;
create policy "social_strategy_public_select_active" on public.social_channel_strategies for select to anon, authenticated using (is_active = true);
drop policy if exists "social_strategy_owner_all" on public.social_channel_strategies;
create policy "social_strategy_owner_all" on public.social_channel_strategies for all to authenticated using (has_role((select auth.uid()), 'owner'::app_role)) with check (has_role((select auth.uid()), 'owner'::app_role));
grant select on public.social_channel_strategies to anon, authenticated;
grant insert, update, delete on public.social_channel_strategies to authenticated;
create or replace function public.get_social_strategy_options() returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb; begin
if not has_role((select auth.uid()), 'owner'::app_role) then raise exception 'owner access required'; end if;
select jsonb_build_object(
'channels',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',channel_name,'platform',platform) order by platform,channel_name) from public.social_channels),'[]'::jsonb),
'categories',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by display_order nulls last,name) from public.categories where is_active=true),'[]'::jsonb),
'collections',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title) order by title) from public.curated_collections),'[]'::jsonb),
'campaigns',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'status',status) order by priority desc nulls last,name) from public.campaigns),'[]'::jsonb),
'segments',coalesce((select jsonb_agg(jsonb_build_object('value',segment) order by segment) from (select distinct segment from public.user_segments where segment is not null and trim(segment)<>'' limit 100) s),'[]'::jsonb)) into result; return result; end; $$;
grant execute on function public.get_social_strategy_options() to authenticated;
create or replace function public.get_social_strategy_overview() returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb; begin
if not has_role((select auth.uid()), 'owner'::app_role) then raise exception 'owner access required'; end if;
select jsonb_build_object('total',count(*),'active',count(*) filter(where is_active),'channels_covered',count(distinct channel_id),'with_collection',count(*) filter(where collection_id is not null),'with_campaign',count(*) filter(where campaign_id is not null),'with_segment',count(*) filter(where audience_segment is not null and trim(audience_segment)<>'')) into result from public.social_channel_strategies; return result; end; $$;
grant execute on function public.get_social_strategy_overview() to authenticated;
