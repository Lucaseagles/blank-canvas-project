-- Price-history extension only.
-- user_interests and personalization_weights, including their RLS policies,
-- are already created by the preceding 20260820230103_sprint1_schema migration.
create table if not exists public.price_history (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references public.products(id) on delete cascade not null,
    price numeric not null,
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

grant select on public.price_history to authenticated;
grant select on public.price_history to anon;
grant all on public.price_history to service_role;
alter table public.price_history enable row level security;

create policy "Allow read of price history" on public.price_history for select to authenticated using (true);
create policy "Allow anon read of price history" on public.price_history for select to anon using (true);
