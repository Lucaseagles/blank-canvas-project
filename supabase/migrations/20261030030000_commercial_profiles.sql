-- Hub Eagles: perfis comerciais separados de user_roles (owner/admin).
create table if not exists public.commercial_profiles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 audience text not null check (audience in ('consumer','merchant','partner')),
 partner_type text check (partner_type in ('micro_influencer','influencer','affiliate','expert')),
 display_name text not null check (char_length(trim(display_name)) between 2 and 120),
 business_name text,
 instagram_handle text,
 business_document text,
 notes text,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,audience),
 constraint partner_type_only_for_partner check ((audience = 'partner' and partner_type is not null) or (audience <> 'partner' and partner_type is null)),
 constraint merchant_business_name check (audience <> 'merchant' or nullif(trim(business_name),'') is not null)
);
alter table public.commercial_profiles enable row level security;
revoke all on public.commercial_profiles from anon, authenticated;
grant select on public.commercial_profiles to authenticated;
grant insert (user_id,audience,partner_type,display_name,business_name,instagram_handle,business_document,notes) on public.commercial_profiles to authenticated;
create policy "Commercial profiles read own" on public.commercial_profiles for select to authenticated using (user_id = auth.uid());
create policy "Commercial profiles request own" on public.commercial_profiles for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create index if not exists commercial_profiles_status_idx on public.commercial_profiles (audience,status);
-- Preço B2B nunca deve ser liberado apenas por seleção do tipo; exige aprovação.
