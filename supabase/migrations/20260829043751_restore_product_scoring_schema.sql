-- Restore product scoring fields consumed by strategic popups, discovery,
-- smart collections and Sprint 33 search ranking.
-- These fields are part of the generated Supabase products contract.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS demand_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trend_velocity numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_score numeric,
  ADD COLUMN IF NOT EXISTS is_best_offer boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_demand_score
  ON public.products(demand_score DESC);

CREATE INDEX IF NOT EXISTS idx_products_offer_score
  ON public.products(offer_score DESC NULLS LAST);
