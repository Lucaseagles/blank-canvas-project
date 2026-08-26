create table if not exists public.user_interests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    category_id uuid references public.categories(id) on delete cascade not null,
    score numeric default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, category_id)
);

grant select, insert, update, delete on public.user_interests to authenticated;
grant all on public.user_interests to service_role;
alter table public.user_interests enable row level security;

create policy "Users can view own interests" on public.user_interests for select to authenticated using (auth.uid() = user_id);
create policy "Users can update own interests" on public.user_interests for update to authenticated using (auth.uid() = user_id);
create policy "Users can insert own interests" on public.user_interests for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.personalization_weights (
    id uuid primary key default gen_random_uuid(),
    signal_key text not null unique,
    weight numeric default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.personalization_weights (signal_key, weight) values
('view', 1),
('tempo alto', 2),
('click', 3),
('favorite', 5),
('share', 6),
('skip rápido', -1)
on conflict (signal_key) do update set weight = excluded.weight;

grant select on public.personalization_weights to authenticated;
grant select on public.personalization_weights to anon;
grant all on public.personalization_weights to service_role;
alter table public.personalization_weights enable row level security;

create policy "Allow read of weights" on public.personalization_weights for select to authenticated using (true);
create policy "Allow anon read of weights" on public.personalization_weights for select to anon using (true);

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
