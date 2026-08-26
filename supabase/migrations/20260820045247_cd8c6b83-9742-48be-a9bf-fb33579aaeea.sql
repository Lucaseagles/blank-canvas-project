-- Create app_role enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    display_name text,
    role public.app_role not null default 'user',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

-- Create user_preferences table
create table public.user_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    preferred_categories uuid[],
    price_range_min numeric,
    price_range_max numeric,
    preferred_marketplaces uuid[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

-- Create categories table
create table public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    parent_id uuid references public.categories(id) on delete cascade,
    icon text,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create marketplaces table
create table public.marketplaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    status text default 'pending' not null, -- connected | pending | error | disabled
    api_status text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    images text[],
    category_id uuid references public.categories(id) on delete set null,
    marketplace_id uuid references public.marketplaces(id) on delete cascade,
    external_product_id text,
    affiliate_url text,
    current_price numeric not null,
    previous_price numeric,
    discount numeric,
    rating numeric,
    review_count integer,
    status text default 'active' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create videos table
create table public.videos (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    video_url text not null,
    thumbnail_url text,
    product_id uuid references public.products(id) on delete set null,
    status text default 'active' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create analytics_events table
create table public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    event_type text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_roles table for role management
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    unique (user_id, role)
);

-- GRANTS
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select, insert, update on public.user_preferences to authenticated;
grant all on public.user_preferences to service_role;

grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;

grant select on public.marketplaces to anon, authenticated;
grant all on public.marketplaces to service_role;

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;

grant select on public.videos to anon, authenticated;
grant all on public.videos to service_role;

grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.marketplaces enable row level security;
alter table public.products enable row level security;
alter table public.videos enable row level security;
alter table public.analytics_events enable row level security;
alter table public.user_roles enable row level security;

-- Security Definer Function for role checking
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Policies
create policy "Users can view their own profile" on public.profiles
    for select to authenticated using (auth.uid() = user_id);

create policy "Users can update their own profile" on public.profiles
    for update to authenticated using (auth.uid() = user_id);

create policy "Owners can view all profiles" on public.profiles
    for select to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Users can manage their own preferences" on public.user_preferences
    for all to authenticated using (auth.uid() = user_id);

create policy "Public categories view" on public.categories
    for select to anon, authenticated using (is_active = true);

create policy "Admin categories manage" on public.categories
    for all to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Public marketplaces view" on public.marketplaces
    for select to anon, authenticated using (true);

create policy "Admin marketplaces manage" on public.marketplaces
    for all to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Public products view" on public.products
    for select to anon, authenticated using (status = 'active');

create policy "Admin products manage" on public.products
    for all to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Public videos view" on public.videos
    for select to anon, authenticated using (status = 'active');

create policy "Admin videos manage" on public.videos
    for all to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Anyone can insert analytics" on public.analytics_events
    for insert to anon, authenticated with check (true);

create policy "Admin view analytics" on public.analytics_events
    for select to authenticated using (public.has_role(auth.uid(), 'owner'));
