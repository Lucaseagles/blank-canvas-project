-- Sprint 33: real PostgreSQL search + user recently-viewed state.
-- Idempotent: never creates a second product/search source.

create extension if not exists pg_trgm;

alter table public.products
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists idx_products_search_vector
  on public.products using gin (search_vector);
create index if not exists idx_products_title_trgm
  on public.products using gin (title gin_trgm_ops);

-- Search history is a durable user signal. The IF NOT EXISTS guard avoids duplication
-- when a previous environment already contains the table.
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.search_history enable row level security;
create index if not exists idx_search_history_user_created
  on public.search_history (user_id, created_at desc);

 drop policy if exists "Users can read own search history" on public.search_history;
create policy "Users can read own search history"
  on public.search_history for select
  using (auth.uid() = user_id);
 drop policy if exists "Users can insert own search history" on public.search_history;
create policy "Users can insert own search history"
  on public.search_history for insert
  with check (auth.uid() = user_id);

create or replace function public.search_products_fuzzy(search_query text)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  category_id uuid,
  current_price numeric,
  previous_price numeric,
  discount numeric,
  images jsonb,
  marketplace text,
  rating numeric,
  review_count integer,
  affiliate_url text,
  demand_score numeric,
  offer_score numeric,
  relevance_score real,
  final_score numeric
)
language sql
stable
as $$
  with q as (
    select
      trim(search_query) as raw,
      plainto_tsquery('portuguese', trim(search_query)) as tsq
  ),
  candidates as (
    select
      p.*,
      greatest(
        ts_rank_cd(p.search_vector, q.tsq),
        similarity(coalesce(p.title, ''), q.raw)::real * 0.65
          + similarity(coalesce(p.description, ''), q.raw)::real * 0.35
      ) as relevance
    from public.products p
    cross join q
    where p.is_active = true
      and (
        p.search_vector @@ q.tsq
        or similarity(coalesce(p.title, ''), q.raw) >= 0.22
        or similarity(coalesce(p.description, ''), q.raw) >= 0.18
      )
  )
  select
    c.id,
    c.slug,
    c.title,
    c.description,
    c.category_id,
    c.current_price,
    c.previous_price,
    c.discount,
    c.images,
    coalesce(c.marketplace, 'External')::text,
    c.rating,
    c.review_count,
    c.affiliate_url,
    coalesce(c.demand_score, 0)::numeric,
    coalesce(c.offer_score, 0)::numeric,
    c.relevance::real,
    (
      c.relevance * 0.60
      + least(greatest(coalesce(c.demand_score, 0), 0), 100) / 100.0 * 0.20
      + least(greatest(coalesce(c.offer_score, 0), 0), 100) / 100.0 * 0.20
    )::numeric as final_score
  from candidates c
  order by final_score desc, c.relevance desc, c.review_count desc nulls last
  limit 100;
$$;

-- Part 2: per-user video resume and hiding state. These are preference/state tables,
-- not analytics replacements. Analytics events remain immutable.
create table if not exists public.video_watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null,
  last_watched_seconds integer not null default 0 check (last_watched_seconds >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create table if not exists public.hidden_from_recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.video_watch_progress enable row level security;
alter table public.hidden_from_recently_viewed enable row level security;

create index if not exists idx_video_watch_progress_user_updated
  on public.video_watch_progress (user_id, updated_at desc);
create index if not exists idx_hidden_recent_user_hidden
  on public.hidden_from_recently_viewed (user_id, hidden_at desc);

 drop policy if exists "Users manage own video progress" on public.video_watch_progress;
create policy "Users manage own video progress"
  on public.video_watch_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

 drop policy if exists "Users manage own hidden recent products" on public.hidden_from_recently_viewed;
create policy "Users manage own hidden recent products"
  on public.hidden_from_recently_viewed for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_video_watch_progress(
  p_video_id uuid,
  p_seconds integer
)
returns void
language plpgsql
security invoker
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.video_watch_progress(user_id, video_id, last_watched_seconds, updated_at)
  values (auth.uid(), p_video_id, greatest(coalesce(p_seconds, 0), 0), now())
  on conflict (user_id, video_id)
  do update set last_watched_seconds = excluded.last_watched_seconds, updated_at = now();
end;
$$;
