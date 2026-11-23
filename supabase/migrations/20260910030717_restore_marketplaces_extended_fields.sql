-- Restore marketplace fields already consumed by the generated database contract.
-- Keep API configuration private; the following migration grants public reads only
-- to its explicit presentation/affiliate metadata column list.
ALTER TABLE public.marketplaces
  ADD COLUMN IF NOT EXISTS affiliate_link_structure text,
  ADD COLUMN IF NOT EXISTS api_config jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.marketplaces.affiliate_link_structure IS
  'Optional affiliate URL structure used by marketplace link generation.';
COMMENT ON COLUMN public.marketplaces.api_config IS
  'Private marketplace API configuration; never included in public column grants.';
