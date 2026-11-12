-- Owner-only RUBI Partners recruitment CRM; no access or commission grants.
-- Prospect records are not authorized partners, and proposed sponsorship is not money owed.
create table if not exists public.rubi_creator_teams (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 3 and 100),
 niche text not null check (char_length(niche) between 2 and 100),
 objective text not null default '' check (char_length(objective)<=500),
 stage text not null default 'building' check (stage in ('building','testing','scaling','paused')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.rubi_creator_prospects (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.rubi_creator_teams(id) on delete cascade,
 creator_name text not null check (char_length(creator_name) between 2 and 120),
 platform text not null check (platform in ('instagram','tiktok','youtube','other')),
 profile_url text not null check (char_length(profile_url) between 8 and 500),
 follower_count integer not null default 0 check (follower_count>=0),
 tier text not null check (tier in ('nano','micro','mid','macro','mega')),
 stage text not null default 'identified' check (stage in ('identified','contacted','negotiating','approved','declined')),
 compensation_model text not null default 'commission' check (compensation_model in ('commission','fixed_sponsorship','hybrid')),
 proposed_commission_percent numeric(5,2) check (proposed_commission_percent between 0 and 100),
 proposed_fixed_fee numeric(12,2) check (proposed_fixed_fee>=0),
 notes text not null default '' check (char_length(notes)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint rubi_prospect_unique_profile unique (team_id,profile_url)
);
create index if not exists rubi_creator_prospects_team_stage_idx on public.rubi_creator_prospects(team_id,stage);
alter table public.rubi_creator_teams enable row level security;
alter table public.rubi_creator_prospects enable row level security;
revoke all on public.rubi_creator_teams from public,anon,authenticated;
revoke all on public.rubi_creator_prospects from public,anon,authenticated;
comment on table public.rubi_creator_teams is 'Shadow Master private recruitment plans; team creation does not grant partner access.';
comment on table public.rubi_creator_prospects is 'Manual prospecting from public creator profiles; draft commercial proposals are never confirmed agreements or payments.';
