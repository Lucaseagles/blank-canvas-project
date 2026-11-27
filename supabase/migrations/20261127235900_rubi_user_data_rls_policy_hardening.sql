-- Remove legacy permissive policies that bypassed the intended per-user RLS boundary.
-- The application writes these records through authenticated server functions;
-- user_interests personalization updates use the server-side service role.
BEGIN;

DROP POLICY IF EXISTS "Anyone can insert user_interests" ON public.user_interests;
DROP POLICY IF EXISTS "Anyone can update their interests" ON public.user_interests;
DROP POLICY IF EXISTS "Anyone can insert favorites" ON public.favorites;

-- Remove anonymous/public write grants as defense in depth. Authenticated
-- server flows retain their existing table grants and owner-scoped RLS policies.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_interests FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.favorites FROM PUBLIC, anon;

DO $$
DECLARE
  interests_policy record;
  favorites_policy record;
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.user_interests'::regclass) THEN
    RAISE EXCEPTION 'user_interests must keep RLS enabled';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.favorites'::regclass) THEN
    RAISE EXCEPTION 'favorites must keep RLS enabled';
  END IF;

  SELECT * INTO interests_policy
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_interests'
    AND policyname = 'Users can manage their own interests' AND cmd = 'ALL';
  IF interests_policy.policyname IS NULL
     OR interests_policy.roles <> ARRAY['authenticated']::name[]
     OR interests_policy.qual NOT ILIKE '%auth.uid()%user_id%'
     OR interests_policy.with_check NOT ILIKE '%auth.uid()%user_id%' THEN
    RAISE EXCEPTION 'user_interests owner-scoped authenticated policy is missing or unsafe';
  END IF;

  SELECT * INTO favorites_policy
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'favorites'
    AND policyname = 'Users can manage their own favorites' AND cmd = 'ALL';
  IF favorites_policy.policyname IS NULL
     OR favorites_policy.roles <> ARRAY['authenticated']::name[]
     OR favorites_policy.qual NOT ILIKE '%auth.uid()%user_id%'
     OR favorites_policy.with_check NOT ILIKE '%auth.uid()%user_id%' THEN
    RAISE EXCEPTION 'favorites owner-scoped authenticated policy is missing or unsafe';
  END IF;

  IF has_table_privilege('anon', 'public.user_interests', 'INSERT')
     OR has_table_privilege('anon', 'public.user_interests', 'UPDATE')
     OR has_table_privilege('anon', 'public.favorites', 'INSERT')
     OR has_table_privilege('anon', 'public.favorites', 'UPDATE') THEN
    RAISE EXCEPTION 'anonymous write privileges remain on per-user engagement tables';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.user_interests', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.user_interests', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.favorites', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.favorites', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated engagement flow grants were unexpectedly removed';
  END IF;
END
$$;

COMMIT;
