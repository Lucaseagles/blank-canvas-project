-- Apply the analytics RPC hardening only when the historical signature
-- is present in this database lineage. Some local/clean installs do not
-- include the legacy overload; absence must not abort the entire migration chain.
DO $$
BEGIN
  IF to_regprocedure('public.track_event(text,jsonb,uuid,uuid,uuid,text,text,text)') IS NOT NULL THEN
    ALTER FUNCTION public.track_event(text,jsonb,uuid,uuid,uuid,text,text,text) SECURITY INVOKER;
  ELSE
    RAISE NOTICE 'Skipping legacy track_event hardening: expected overload is not installed';
  END IF;
END
$$;

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
