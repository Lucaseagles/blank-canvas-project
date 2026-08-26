-- Fix SECURITY DEFINER functions permissions
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_price_drop_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_price_drop_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_price_drop_notification() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_price_drop_notification() TO service_role;
-- The trigger function is called by the system (service_role context usually), not users.