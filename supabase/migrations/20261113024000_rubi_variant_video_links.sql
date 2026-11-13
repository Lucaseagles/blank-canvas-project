-- Private explicit link between a published legacy video and a RUBI creative variant.
-- This is an editorial relation, not an analytics join, sale, checkout or license.
create table if not exists public.rubi_variant_video_links(
  video_id uuid primary key references public.videos(id) on delete cascade,
  variant_id uuid not null references public.rubi_movement_variants(id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index if not exists rubi_variant_video_links_variant_idx
 on public.rubi_variant_video_links(variant_id);
alter table public.rubi_variant_video_links enable row level security;
revoke all on public.rubi_variant_video_links from public,anon,authenticated;
comment on table public.rubi_variant_video_links is
 'Master-only editorial video-to-variant mapping. No paid conversion, audience retention or product authorization inferred.';
