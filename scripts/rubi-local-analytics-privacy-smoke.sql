DO $$
DECLARE
  own_read_policy text;
  authenticated_insert_policy text;
  anonymous_insert_policy text;
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.analytics_events'::regclass) THEN
    RAISE EXCEPTION 'analytics_events RLS must remain enabled';
  END IF;

  SELECT qual INTO own_read_policy
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'analytics_events'
    AND policyname = 'Users can view their own events' AND cmd = 'SELECT';
  IF own_read_policy IS NULL OR own_read_policy NOT ILIKE '%auth.uid()%user_id%' THEN
    RAISE EXCEPTION 'Missing user-scoped analytics SELECT policy: %', own_read_policy;
  END IF;

  SELECT with_check INTO authenticated_insert_policy
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'analytics_events'
    AND policyname = 'Users can insert their own events' AND cmd = 'INSERT';
  IF authenticated_insert_policy IS NULL OR authenticated_insert_policy NOT ILIKE '%auth.uid()%user_id%' THEN
    RAISE EXCEPTION 'Authenticated analytics INSERT is not user-scoped: %', authenticated_insert_policy;
  END IF;

  SELECT with_check INTO anonymous_insert_policy
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'analytics_events'
    AND policyname = 'Anonymous events must be unattributed' AND cmd = 'INSERT';
  IF anonymous_insert_policy IS NULL OR anonymous_insert_policy NOT ILIKE '%user_id IS NULL%' THEN
    RAISE EXCEPTION 'Anonymous analytics INSERT must require user_id IS NULL: %', anonymous_insert_policy;
  END IF;

  IF NOT has_table_privilege('anon', 'public.analytics_events', 'INSERT')
     OR has_table_privilege('anon', 'public.analytics_events', 'SELECT')
     OR has_table_privilege('anon', 'public.analytics_events', 'UPDATE')
     OR has_table_privilege('anon', 'public.analytics_events', 'DELETE') THEN
    RAISE EXCEPTION 'anon analytics_events privileges are not least-privilege';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.analytics_events', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.analytics_events', 'INSERT')
     OR has_table_privilege('authenticated', 'public.analytics_events', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.analytics_events', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated analytics_events privileges are not least-privilege';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.analytics_events', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.analytics_events', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.analytics_events', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.analytics_events', 'DELETE') THEN
    RAISE EXCEPTION 'service_role analytics_events privileges unexpectedly changed';
  END IF;
END
$$;

SELECT 'analytics_events privacy grants and RLS smoke: PASS' AS result;
