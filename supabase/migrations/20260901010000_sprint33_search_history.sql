-- Sprint 33: real search + authenticated browsing history.
-- No duplicate product/catalog tables are introduced.
-- The canonical search RPC is defined by the immediately following
-- 20260901020000_sprint33_search_and_recently_viewed.sql migration.

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
