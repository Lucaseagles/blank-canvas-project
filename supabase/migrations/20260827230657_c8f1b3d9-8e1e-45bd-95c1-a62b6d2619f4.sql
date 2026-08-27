CREATE TABLE public.category_highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  offer_score numeric NOT NULL DEFAULT 0,
  is_manual_override boolean NOT NULL DEFAULT false,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, rank)
);

GRANT SELECT ON public.category_highlights TO anon;
GRANT SELECT ON public.category_highlights TO authenticated;
GRANT ALL ON public.category_highlights TO service_role;

ALTER TABLE public.category_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read category highlights"
  ON public.category_highlights FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage category highlights"
  ON public.category_highlights FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_category_highlights_updated_at
  BEFORE UPDATE ON public.category_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_category_highlights_category ON public.category_highlights(category_id, rank);

ALTER TYPE public.automation_action_type ADD VALUE IF NOT EXISTS 'RECALCULATE_CATEGORY_HIGHLIGHTS';