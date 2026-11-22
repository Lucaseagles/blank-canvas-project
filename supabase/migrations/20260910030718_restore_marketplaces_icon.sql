-- Restore the public marketplace presentation field before the following
-- column-level grants reference it. The canonical generated type is text | null.
ALTER TABLE public.marketplaces
  ADD COLUMN IF NOT EXISTS icon text;

COMMENT ON COLUMN public.marketplaces.icon IS
  'Optional public icon/emoji used to identify the marketplace in storefront UI.';
