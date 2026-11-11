-- Published page is independent of a network post: explicit owner approval is required.
-- Revision gates make any source movement or variant edit invalidate an older approval.
alter table public.rubi_movement_distribution
 add column if not exists page_published_at timestamptz,
 add column if not exists published_variant_revision integer,
 add column if not exists published_movement_revision integer;
alter table public.rubi_movement_distribution
 add constraint rubi_distribution_publication_revision_match
 check (
  (page_published_at is null and published_variant_revision is null and published_movement_revision is null)
  or
  (page_published_at is not null and published_variant_revision > 0 and published_movement_revision > 0)
 );
-- Prevent different variants/products from claiming the same published campaign path.
create unique index if not exists rubi_movement_public_campaign_unique
 on public.rubi_movement_distribution(channel,campaign)
 where page_published_at is not null;
comment on column public.rubi_movement_distribution.page_published_at is
 'Only explicit Shadow Master approval enables public page copy; checkout remains supplier-owned.';
