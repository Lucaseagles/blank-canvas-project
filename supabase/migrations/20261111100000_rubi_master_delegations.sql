-- Solo-master invariant: primary owner remains the ONLY authorized Master.
-- These entries are future candidates, NOT grants and NOT members of public.user_roles.
create table if not exists public.rubi_master_delegations (
 email text primary key check (
   email=lower(btrim(email))
   and char_length(email) between 6 and 254
   and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+
 ),
 requested_by uuid not null references auth.users(id),
 status text not null default 'pending' check (status in ('pending','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.rubi_master_delegations enable row level security;
revoke all on public.rubi_master_delegations from public,anon,authenticated;
comment on table public.rubi_master_delegations is
 'Primary-owner-only list of proposed future Masters. Never grants privileges, roles or access.';

 ),
 requested_by uuid not null references auth.users(id),
 status text not null default 'pending' check (status in ('pending','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.rubi_master_delegations enable row level security;
revoke all on public.rubi_master_delegations from public,anon,authenticated;
comment on table public.rubi_master_delegations is
 'Primary-owner-only list of proposed future Masters. Never grants privileges, roles or access.';
