-- Private editorial assets, publishable only after explicit owner approval.
create table if not exists public.rubi_product_stories (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.hub_products(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 3 and 160),
 description text not null default '' check (char_length(description)<=1200),
 video_url text not null check (char_length(video_url) between 14 and 2000),
 poster_url text,
 evidence_notes text not null default '' check (char_length(evidence_notes)<=1200),
 rights_confirmed boolean not null default false,
 status text not null default 'draft' check (status in ('draft','approved')),
 position integer not null default 0 check(position between 0 and 1000),
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists rubi_product_stories_product_idx on public.rubi_product_stories(product_id,position,id);
alter table public.rubi_product_stories enable row level security;
revoke all on public.rubi_product_stories from public,anon,authenticated;
comment on table public.rubi_product_stories is 'Owner controlled videos for authorized brand stories; no checkout changes and no videos approved by default.';
