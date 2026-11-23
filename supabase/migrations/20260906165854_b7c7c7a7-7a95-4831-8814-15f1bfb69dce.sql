-- Harden search_path and execute grants only for helper functions that exist
-- in this database lineage. Older deployments may not have every optional RPC.
DO $$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.calculate_product_demand(uuid)',
    'public.calculate_product_trend_velocity(uuid)',
    'public.classify_user_segment(uuid)',
    'public.search_products_fuzzy(text)',
    'public.touch_video_watch_progress(uuid,integer)'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', signature);
    END IF;
  END LOOP;
END;
$$;

-- Revoke access to internal SECURITY DEFINER functions when installed.
DO $$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.calculate_content_affinity(uuid,text)',
    'public.get_content_affinity_summary(uuid)',
    'public.process_content_notification_queue(integer)',
    'public.enqueue_published_product_notification()'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated, public', signature);
    END IF;
  END LOOP;
END;
$$;

-- Restrict anon-only access on user-scoped SECURITY DEFINER functions.
DO $$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.is_owner()',
    'public.get_eligible_strategic_popup(uuid)',
    'public.get_referral_leaderboard_position(uuid)'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, public', signature);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', signature);
    END IF;
  END LOOP;
END;
$$;

-- Marketplaces: column-level access, api_config never exposed to API roles.
REVOKE SELECT ON public.marketplaces FROM anon, authenticated;
GRANT SELECT (id, name, slug, status, api_status, created_at) ON public.marketplaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplaces TO authenticated;
REVOKE UPDATE (api_config) ON public.marketplaces FROM authenticated;
GRANT ALL ON public.marketplaces TO service_role;
