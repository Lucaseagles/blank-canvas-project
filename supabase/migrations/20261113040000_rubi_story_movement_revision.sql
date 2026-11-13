-- A Story publication is pinned to the reviewed revision of its commercial movement.
-- Existing approved stories without a movement remain legacy content until an editor revises them.
alter table public.rubi_product_stories
 add column if not exists movement_id uuid references public.rubi_movements(id) on delete restrict,
 add column if not exists approved_movement_revision integer;
alter table public.rubi_product_stories
 drop constraint if exists rubi_story_movement_approval_consistency;
alter table public.rubi_product_stories
 add constraint rubi_story_movement_approval_consistency
 check(approved_movement_revision is null or (movement_id is not null and approved_movement_revision>0));
create index if not exists rubi_product_stories_movement_idx on public.rubi_product_stories(movement_id);
comment on column public.rubi_product_stories.approved_movement_revision is
 'Revision of reviewed commercial movement when Story was approved. Subsequent movement edits invalidate eligibility for public display.';
