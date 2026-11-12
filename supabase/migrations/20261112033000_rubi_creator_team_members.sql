-- Shadow Master assigns approved partner commercial profiles to teams.
-- The membership itself creates no agreements, product grants, referrals, or payouts.
create table if not exists public.rubi_creator_team_members (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.rubi_creator_teams(id) on delete cascade,
 commercial_profile_id uuid not null references public.commercial_profiles(id) on delete restrict,
 status text not null default 'active' check (status in ('active','paused')),
 joined_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(team_id,commercial_profile_id)
);
create index if not exists rubi_creator_team_members_profile_idx
 on public.rubi_creator_team_members(commercial_profile_id);
alter table public.rubi_creator_team_members enable row level security;
revoke all on public.rubi_creator_team_members from public,anon,authenticated;
comment on table public.rubi_creator_team_members is
 'Master-only assignment of existing approved commercial partners to creator teams. Never grants products, commissions, or payment attribution.';
