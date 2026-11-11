-- Private explicit delegation list. Starts EMPTY: existing primary owner remains sole Master.
create table if not exists public.rubi_master_delegations (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_by uuid not null references auth.users(id),
 granted_at timestamptz not null default now(),
 active boolean not null default true,
 updated_at timestamptz not null default now(),
 constraint rubi_master_no_self_delegate check (user_id <> granted_by)
);
alter table public.rubi_master_delegations enable row level security;
revoke all on public.rubi_master_delegations from public,anon,authenticated;
comment on table public.rubi_master_delegations is
 'Additional Masters explicitly authorized by the original Master only; no grants by default.';
