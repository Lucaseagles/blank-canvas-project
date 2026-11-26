\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  own_read_policy text;
  owner_read_policy text;
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

  -- The new personal-read boundary must not remove the existing Owner report access.
  SELECT qual INTO owner_read_policy
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'analytics_events'
    AND policyname = 'Admin view analytics' AND cmd = 'SELECT';
  IF owner_read_policy IS NULL OR owner_read_policy NOT ILIKE '%has_role%'
     OR owner_read_policy NOT ILIKE '%owner%' THEN
    RAISE EXCEPTION 'Owner analytics SELECT policy is missing or no longer Owner-scoped: %', owner_read_policy;
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

-- Seed disposable records with the local CI database owner, then exercise
-- the actual RLS boundary under the same roles used by Supabase Data API.
INSERT INTO public.analytics_events (user_id, event_type, metadata)
VALUES
  (:'consumer_id'::uuid, 'PRIVACY_SMOKE_OWN', '{"fixture":true}'::jsonb),
  (:'merchant_id'::uuid, 'PRIVACY_SMOKE_OTHER', '{"fixture":true}'::jsonb);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'consumer_id', true);
SELECT set_config('rubi.smoke.merchant_id', :'merchant_id', true);
SELECT set_config('rubi.smoke.consumer_id', :'consumer_id', true);

DO $$
DECLARE
  own_count integer;
  other_count integer;
  cross_insert_denied boolean := false;
BEGIN
  SELECT count(*) INTO own_count
  FROM public.analytics_events
  WHERE event_type = 'PRIVACY_SMOKE_OWN';

  SELECT count(*) INTO other_count
  FROM public.analytics_events
  WHERE event_type = 'PRIVACY_SMOKE_OTHER';

  IF own_count <> 1 OR other_count <> 0 THEN
    RAISE EXCEPTION 'Personal analytics SELECT boundary failed: own %, other %', own_count, other_count;
  END IF;

  INSERT INTO public.analytics_events (user_id, event_type, metadata)
  VALUES (auth.uid(), 'PRIVACY_SMOKE_AUTH_INSERT', '{"fixture":true}'::jsonb);

  BEGIN
    INSERT INTO public.analytics_events (user_id, event_type, metadata)
    VALUES (current_setting('rubi.smoke.merchant_id')::uuid, 'PRIVACY_SMOKE_CROSS_INSERT', '{"fixture":true}'::jsonb);
  EXCEPTION WHEN insufficient_privilege THEN
    cross_insert_denied := true;
  END;

  IF NOT cross_insert_denied THEN
    RAISE EXCEPTION 'Authenticated user inserted analytics for another user';
  END IF;
END
$$;

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);

INSERT INTO public.analytics_events (user_id, event_type, metadata)
VALUES (NULL, 'PRIVACY_SMOKE_ANON_INSERT', '{"fixture":true}'::jsonb);

DO $$
DECLARE
  attributed_insert_denied boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.analytics_events (user_id, event_type, metadata)
    VALUES (current_setting('rubi.smoke.consumer_id')::uuid, 'PRIVACY_SMOKE_ANON_ATTRIBUTED', '{"fixture":true}'::jsonb);
  EXCEPTION WHEN insufficient_privilege THEN
    attributed_insert_denied := true;
  END;

  IF NOT attributed_insert_denied THEN
    RAISE EXCEPTION 'Anonymous client inserted an attributed analytics event';
  END IF;
END
$$;

ROLLBACK;
SELECT 'analytics_events RLS, Owner preservation, personal isolation and least-privilege smoke: PASS' AS result;