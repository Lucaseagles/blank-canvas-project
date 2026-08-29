CREATE TABLE IF NOT EXISTS public.offer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offer_groups TO anon;
GRANT SELECT ON public.offer_groups TO authenticated;
GRANT ALL ON public.offer_groups TO service_role;

ALTER TABLE public.offer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read offer groups"
  ON public.offer_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins manage offer groups"
  ON public.offer_groups FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_offer_groups_updated_at
  BEFORE UPDATE ON public.offer_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_offer_group_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_offer_group_id_fkey
      FOREIGN KEY (offer_group_id) REFERENCES public.offer_groups(id) ON DELETE SET NULL;
  END IF;
END $$;