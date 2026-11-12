-- Private scale targets per creator team. Planning targets are not member counts.
create table if not exists public.rubi_creator_team_growth_targets (
 team_id uuid primary key references public.rubi_creator_teams(id) on delete cascade,
 nano_target integer not null default 10 check (nano_target between 0 and 100000),
 micro_target integer not null default 5 check (micro_target between 0 and 100000),
 mid_target integer not null default 0 check (mid_target between 0 and 100000),
 macro_target integer not null default 0 check (macro_target between 0 and 100000),
 mega_target integer not null default 0 check (mega_target between 0 and 100000),
 expansion_evidence text not null default '' check (char_length(expansion_evidence)<=1500),
 approved_budget numeric(12,2) check (approved_budget>=0),
 updated_at timestamptz not null default now()
);
alter table public.rubi_creator_team_growth_targets enable row level security;
revoke all on public.rubi_creator_team_growth_targets from public,anon,authenticated;
comment on table public.rubi_creator_team_growth_targets is 'Master-only team growth targets; prospect counts and plans do not establish active creators, ROI or payout permission.';
