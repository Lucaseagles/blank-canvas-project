-- Owner-only prospective candidates; does NOT grant admin rights.
create table if not exists public.rubi_master_delegations (
 email text primary key,
 requested_by uuid not null references auth.users(id),
 status text not null default 'pending' check (status in ('pending','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint rubi_master_candidate_email_length check (
  char_length(email) between 6 and 254 and email=lower(btrim(email))
 )
);
alter table public.rubi_master_delegations enable row level security;
revoke all on public.rubi_master_delegations from public, anon, authenticated;
comment on table public.rubi_master_delegations is 'Pre-registration only. Never grants owner role, access, or login.';
