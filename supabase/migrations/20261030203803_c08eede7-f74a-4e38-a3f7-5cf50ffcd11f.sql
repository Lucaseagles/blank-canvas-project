create table if not exists public.brand_identity (
  id boolean primary key default true check (id = true),
  display_name text not null default 'Hub Eagles' check (char_length(trim(display_name)) between 2 and 80),
  updated_at timestamptz not null default now()
);
revoke all on public.brand_identity from anon, authenticated;
grant all on public.brand_identity to service_role;
alter table public.brand_identity enable row level security;
insert into public.brand_identity (id, display_name) values (true, 'Hub Eagles') on conflict (id) do nothing;