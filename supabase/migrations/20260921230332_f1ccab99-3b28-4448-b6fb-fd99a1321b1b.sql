-- Harden marketplaces public read: column-level grants only, never api_config

DROP POLICY IF EXISTS "Public can read marketplace listing" ON public.marketplaces;

REVOKE ALL ON public.marketplaces FROM anon, authenticated;

GRANT SELECT (id, name, slug, status, api_status, created_at, updated_at, affiliate_link_structure, icon) ON public.marketplaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplaces TO authenticated;
GRANT ALL ON public.marketplaces TO service_role;

CREATE POLICY "Public can read marketplace public columns"
ON public.marketplaces
FOR SELECT
TO anon, authenticated
USING (true);
