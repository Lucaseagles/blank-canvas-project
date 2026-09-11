DROP POLICY IF EXISTS "Public can read marketplace listing" ON public.marketplaces;

REVOKE ALL PRIVILEGES ON TABLE public.marketplaces FROM anon, authenticated;
GRANT SELECT (id, name, slug, status, api_status, created_at, affiliate_link_structure, updated_at, icon) ON TABLE public.marketplaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.marketplaces TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.marketplaces TO service_role;

CREATE POLICY "Public can read marketplace listing"
ON public.marketplaces
FOR SELECT
TO anon, authenticated
USING (true);

REVOKE EXECUTE ON FUNCTION public.approve_collection_candidate(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_collection_candidates(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_collection_candidate_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_opportunity_alerts(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_opportunity_alerts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_collection_candidate(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.simulate_collection_candidates(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_opportunity_alert_status(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.approve_collection_candidate(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_collection_candidates(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_collection_candidate_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_opportunity_alerts(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_opportunity_alerts() TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_collection_candidate(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.simulate_collection_candidates(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_opportunity_alert_status(uuid, text) TO service_role;