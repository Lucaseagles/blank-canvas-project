
-- Revoke execute from public and authenticated for the security definer functions
REVOKE EXECUTE ON FUNCTION public.record_price_history() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_price_history() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_price_history() FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM anon;

-- Grant execute specifically to roles that need it
GRANT EXECUTE ON FUNCTION public.record_price_history() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO service_role;

-- Set search_path to public for these functions
ALTER FUNCTION public.record_price_history() SET search_path = public;
ALTER FUNCTION public.get_personalized_recommendations(UUID, INT, INT) SET search_path = public;

-- Also fix existing has_role if it was flagged in previous runs
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
