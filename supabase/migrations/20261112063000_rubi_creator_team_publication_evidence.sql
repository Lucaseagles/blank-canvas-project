-- Master-side evidence of creator publications. A URL is self-reported evidence,
-- never proof of paid orders or of delivery of a platform impression.
create table if not exists public.rubi_creator_team_publication_evidence (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references public.rubi_creator_team_campaign_assignments(id) on delete restrict,
 membership_id uuid not null references public.rubi_creator_team_members(id) on delete restrict,
 channel text not null check (channel in ('instagram','tiktok','youtube','facebook','pinterest','whatsapp','telegram','other')),
 publication_url text not null check (char_length(publication_url) between 12 and 500 and publication_url ~ '^https://'),
 review_status text not null default 'submitted' check (review_status in ('submitted','reviewed','rejected')),
 published_at timestamptz not null,
 review_notes text not null default '' check (char_length(review_notes)<=1000),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint rubi_creator_publication_review_consistency check (
   (review_status='submitted' and reviewed_at is null) or
   (review_status<>'submitted' and reviewed_at is not null)
 ),
 unique(assignment_id,membership_id,publication_url)
);
create index if not exists rubi_creator_team_publication_assignment_idx
 on public.rubi_creator_team_publication_evidence(assignment_id,created_at desc);
alter table public.rubi_creator_team_publication_evidence enable row level security;
revoke all on public.rubi_creator_team_publication_evidence from public,anon,authenticated;
comment on table public.rubi_creator_team_publication_evidence is
 'Owner-only record of a creator publication URL and manual review. Not verified impressions, attributed sales, or a commission entitlement.';
