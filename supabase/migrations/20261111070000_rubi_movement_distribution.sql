-- Private per-creative distribution plans. No scheduling service, messaging or payment events.
create table if not exists public.rubi_movement_distribution (
 id uuid primary key default gen_random_uuid(),
 variant_id uuid not null references public.rubi_movement_variants(id) on delete cascade,
 channel text not null check (channel in ('instagram','tiktok','youtube','facebook','pinterest','whatsapp','telegram')),
 campaign text not null check (campaign ~ '^[a-z0-9][a-z0-9_-]{0,59}$'),
 status text not null default 'planned' check (status in ('planned','manually_published')),
 notes text not null default '' check (char_length(notes) <= 1500),
 published_reference text not null default '' check (char_length(published_reference) <= 500),
 updated_at timestamptz not null default now(),
 unique(variant_id,channel),
 constraint rubi_distribution_publication_check check (status='planned' or char_length(btrim(published_reference))>=8)
);
create index if not exists rubi_distribution_variant_idx on public.rubi_movement_distribution(variant_id);
alter table public.rubi_movement_distribution enable row level security;
revoke all on public.rubi_movement_distribution from public,anon,authenticated;
comment on table public.rubi_movement_distribution is 'Owner-only plans; manually_published records a user claim with reference, not independently verified publishing.';
