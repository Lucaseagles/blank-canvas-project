-- Identidade comercial configurável. Não altera auth, user_roles ou policies existentes.
create table if not exists public.brand_identity (
  id boolean primary key default true check (id = true),
  display_name text not null default 'Rubi e Ragles' check (char_length(trim(display_name)) between 2 and 80),
  updated_at timestamptz not null default now()
);
alter table public.brand_identity enable row level security;
revoke all on public.brand_identity from anon, authenticated;
insert into public.brand_identity(id, display_name) values (true, 'Rubi e Ragles') on conflict (id) do nothing;
