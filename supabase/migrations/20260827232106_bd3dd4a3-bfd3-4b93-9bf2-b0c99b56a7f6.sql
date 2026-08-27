REVOKE SELECT ON public.marketplaces FROM anon, authenticated;
GRANT SELECT (id, name, slug, status, api_status, created_at) ON public.marketplaces TO anon, authenticated;
GRANT ALL ON public.marketplaces TO service_role;

DROP POLICY IF EXISTS "Everyone can read marketplaces" ON public.marketplaces;
CREATE POLICY "Public can read marketplace listing"
ON public.marketplaces FOR SELECT
TO anon, authenticated
USING (true);