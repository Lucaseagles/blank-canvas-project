-- Sprint 33 hardening: configurable ranking + per-video hide state.

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.search_history enable row level security;
create index if not exists idx_search_history_user_created on public.search_history(user_id, created_at desc);
drop policy if exists "Users can read own search history" on public.search_history;
create policy "Users can read own search history" on public.search_history for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own search history" on public.search_history;
create policy "Users can insert own search history" on public.search_history for insert with check (auth.uid() = user_id);

-- The history UI hides a product or a video without deleting immutable analytics.
alter table public.hidden_from_recently_viewed alter column product_id drop not null;
alter table public.hidden_from_recently_viewed add column if not exists video_id uuid;
create index if not exists idx_hidden_recent_video on public.hidden_from_recently_viewed(user_id, video_id) where video_id is not null;
create unique index if not exists uq_hidden_recent_video on public.hidden_from_recently_viewed(user_id, video_id) where video_id is not null;

-- Search ranking reads optional owner-configured weights. Defaults preserve the Sprint 33 baseline.
create or replace function public.search_products_fuzzy(search_query text)
returns table (
  id uuid, slug text, title text, description text, category_id uuid,
  current_price numeric, previous_price numeric, discount integer,
  images text[], marketplace text, rating numeric, review_count integer,
  affiliate_url text, demand_score numeric, offer_score numeric,
  relevance_score real, final_score numeric
)
language sql stable
as $$
  with weights as (
    select
      coalesce((select weight from public.personalization_weights where signal_key = 'search_relevance' order by updated_at desc nulls last limit 1), 0.60)::numeric as relevance_weight,
      coalesce((select weight from public.personalization_weights where signal_key = 'demand_score' order by updated_at desc nulls last limit 1), 0.20)::numeric as demand_weight,
      coalesce((select weight from public.personalization_weights where signal_key = 'offer_score' order by updated_at desc nulls last limit 1), 0.20)::numeric as offer_weight
  ), normalized_weights as (
    select relevance_weight / nullif(relevance_weight + demand_weight + offer_weight, 0) as rw,
           demand_weight / nullif(relevance_weight + demand_weight + offer_weight, 0) as dw,
           offer_weight / nullif(relevance_weight + demand_weight + offer_weight, 0) as ow
    from weights
  ), q as (
    select trim(search_query) raw, plainto_tsquery('portuguese', trim(search_query)) tsq
  ), candidates as (
    select p.*, greatest(
      coalesce(ts_rank_cd(p.search_vector, q.tsq), 0),
      similarity(coalesce(p.title, ''), q.raw)::real * 0.75 + similarity(coalesce(p.description, ''), q.raw)::real * 0.25
    ) relevance
    from public.products p cross join q
    where coalesce(p.status, 'active') not in ('inactive', 'archived', 'deleted')
      and (p.search_vector @@ q.tsq or similarity(coalesce(p.title, ''), q.raw) >= 0.22 or similarity(coalesce(p.description, ''), q.raw) >= 0.18)
  )
  select c.id, c.slug, c.title, c.description, c.category_id, c.current_price, c.previous_price, c.discount, c.images,
    coalesce(m.name, 'External')::text, c.rating, c.review_count, c.affiliate_url,
    coalesce(c.demand_score, 0), coalesce(c.offer_score, 0), c.relevance::real,
    (c.relevance * nw.rw + least(greatest(coalesce(c.demand_score, 0), 0), 100) / 100.0 * nw.dw + least(greatest(coalesce(c.offer_score, 0), 0), 100) / 100.0 * nw.ow)::numeric
  from candidates c cross join normalized_weights nw
  left join public.marketplaces m on m.id = c.marketplace_id
  order by (c.relevance * nw.rw + least(greatest(coalesce(c.demand_score, 0), 0), 100) / 100.0 * nw.dw + least(greatest(coalesce(c.offer_score, 0), 0), 100) / 100.0 * nw.ow) desc,
           c.relevance desc, c.review_count desc nulls last
  limit 100;
$$;
