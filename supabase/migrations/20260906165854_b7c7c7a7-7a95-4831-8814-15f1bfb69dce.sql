-- 1. Fixed search_path on helper functions
ALTER FUNCTION public.calculate_product_demand(uuid) SET search_path = public;
ALTER FUNCTION public.calculate_product_trend_velocity(uuid) SET search_path = public;
ALTER FUNCTION public.classify_user_segment(uuid) SET search_path = public;
ALTER FUNCTION public.search_products_fuzzy(text) SET search_path = public;
ALTER FUNCTION public.touch_video_watch_progress(uuid, integer) SET search_path = public;

-- 2. Revoke EXECUTE on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.calculate_content_affinity(uuid, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.get_content_affinity_summary(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.process_content_notification_queue(integer) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.enqueue_published_product_notification() FROM anon, authenticated, public;

-- 3. Restrict anon-only access on user-scoped SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.is_owner() FROM anon, public;
REVOKE ALL ON FUNCTION public.get_eligible_strategic_popup(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_referral_leaderboard_position(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_strategic_popup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard_position(uuid) TO authenticated;

-- 4. Marketplaces: column-level access, api_config never exposed to API roles
REVOKE SELECT ON public.marketplaces FROM anon, authenticated;
GRANT SELECT (id, name, slug, status, api_status, created_at) ON public.marketplaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplaces TO authenticated;
REVOKE UPDATE (api_config) ON public.marketplaces FROM authenticated;
GRANT ALL ON public.marketplaces TO service_role;
