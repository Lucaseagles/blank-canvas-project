REVOKE ALL ON FUNCTION public.run_retention_engine(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_retention_engine(integer) TO service_role;