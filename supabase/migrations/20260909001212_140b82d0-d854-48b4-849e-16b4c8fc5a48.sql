-- 1. Categories: only active categories are publicly readable
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
CREATE POLICY "Active categories are viewable by everyone"
ON public.categories FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE);

CREATE POLICY "Owners can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

-- 2. Products: only published/active products are publicly readable
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
ON public.products FOR SELECT
TO anon, authenticated
USING (status IN ('active', 'published'));

-- 3. Apply the intended privilege lockdown only to RPC signatures present
-- in this migration lineage. Some generated client types describe legacy RPCs
-- that are not created by the clean-install migration sequence.
DO $$
DECLARE
  target record;
  function_oid regprocedure;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('admin_count_users', 'text,boolean'),
      ('admin_list_users', 'integer,integer,text,boolean'),
      ('admin_list_profiles', 'integer,integer,text,boolean'),
      ('admin_set_profile_banned', 'uuid,boolean'),
      ('get_referral_leaderboard', 'integer'),
      ('get_referral_leaderboard_position', 'uuid')
    ) AS targets(function_name, argument_types)
  LOOP
    function_oid := to_regprocedure(
      format('public.%I(%s)', target.function_name, target.argument_types)
    );

    IF function_oid IS NULL THEN
      RAISE NOTICE 'Skipping privilege update for absent function public.%(%)',
        target.function_name, target.argument_types;
    ELSE
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        function_oid
      );
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION %s TO service_role',
        function_oid
      );
    END IF;
  END LOOP;
END
$$;
