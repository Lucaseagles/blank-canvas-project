REVOKE SELECT ON public.marketplaces FROM anon, authenticated;

GRANT SELECT (id, name, slug, icon, status, api_status, affiliate_link_structure, created_at, updated_at)
  ON public.marketplaces TO anon, authenticated;

GRANT ALL ON public.marketplaces TO service_role;