-- Fix cleanup_recently_shown security issues
ALTER FUNCTION public.cleanup_recently_shown() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.cleanup_recently_shown() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_recently_shown() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_recently_shown() FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_recently_shown() TO service_role;
