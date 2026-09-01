-- Sprint 33: real search + authenticated browsing history.
-- No duplicate product/catalog tables are introduced.

create extension if not exists pg_trgm;

create table if not exists public.browsing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  device_type text,
  unique (user_id, product_id)
);

create index if not exists browsing_history_user_viewed_idx
  on public.browsing_history (user_id, viewed_at desc);
create index if not exists browsing_history_product_idx
  on public.browsing_history (product_id);

create index if not exists products_title_trgm_idx
  on public.products using gin (title gin_trgm_ops);
create index if not exists products_description_trgm_idx
  on public.products using gin (description gin_trgm_ops);

alter table public.browsing_history enable row level security;
drop policy if exists "Users can read own browsing history" on public.browsing_history;
drop policy if exists "Users can insert own browsing history" on public.browsing_history;
drop policy if exists "Users can update own browsing history" on public.browsing_history;
drop policy if exists "Users can delete own browsing history" on public.browsing_history;

create policy "Users can read own browsing history"
  on public.browsing_history for select to authenticated
  using (user_id = auth.uid());
create policy "Users can insert own browsing history"
  on public.browsing_history for insert to authenticated
  with check (user_id = auth.uid());
create policy "Users can update own browsing history"
  on public.browsing_history for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "Users can delete own browsing history"
  on public.browsing_history for delete to authenticated
  using (user_id = auth.uid());

create or replace function public.search_products_fuzzy(search_query text)
returns table (
  id uuid,
  title text,
  current_price numeric,
  previous_price numeric,
  discount numeric,
  images jsonb,
  slug text,
  rating numeric,
  review_count integer,
  similarity_score real
)
language sql
stable
as $$
  with normalized as (
    select trim(regexp_replace(lower(coalesce(search_query, '')), '\s+', ' ', 'g')) as q
  )
  select
    p.id,
    p.title,
    p.current_price,
    p.previous_price,
    p.discount,
    p.images,
    p.slug,
    p.rating,
    p.review_count,
    greatest(
      similarity(lower(coalesce(p.title, '')), n.q),
      similarity(lower(coalesce(p.description, '')), n.q)
    )::real as similarity_score
  from public.products p
  cross join normalized n
  where p.is_active = true
    and n.q <> ''
    and (
      lower(coalesce(p.title, '')) % n.q
      or lower(coalesce(p.description, '')) % n.q
      or lower(coalesce(p.title, '')) like '%' || n.q || '%'
      or lower(coalesce(p.description, '')) like '%' || n.q || '%'
    )
  order by similarity_score desc, coalesce(p.rating, 0) desc
  limit 50;
$$;

grant execute on function public.search_products_fuzzy(text) to anon, authenticated;
