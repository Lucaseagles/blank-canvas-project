-- Restore the products-side relationship required by offer_groups.
-- The production schema and application queries already use this nullable UUID;
-- the clean migration chain must establish it before the FK is added later.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS offer_group_id uuid;

COMMENT ON COLUMN public.products.offer_group_id IS
  'Optional canonical offer group used to cluster related product offers.';
