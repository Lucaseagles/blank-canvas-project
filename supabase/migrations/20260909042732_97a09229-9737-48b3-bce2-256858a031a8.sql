-- 1. SECURITY DEFINER function callable by anon/authenticated
REVOKE EXECUTE ON FUNCTION public.get_campaign_funnel(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_funnel(uuid) TO service_role;

-- 2. user_roles: explicit owner-only write policies + remove anon grants
REVOKE ALL ON TABLE public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles FROM authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

DROP POLICY IF EXISTS "user_roles_owner_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_owner_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_owner_delete" ON public.user_roles;

CREATE POLICY "user_roles_owner_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "user_roles_owner_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "user_roles_owner_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role));

-- 3. marketplaces: anon must not hold write grants (api_config already column-restricted)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.marketplaces FROM anon;
GRANT ALL ON TABLE public.marketplaces TO service_role;

-- 4. whatsapp_config: anon has no policies; remove residual grants entirely
REVOKE ALL ON TABLE public.whatsapp_config FROM anon;
GRANT ALL ON TABLE public.whatsapp_config TO service_role;

-- 5. integration tables stay fail-closed (RLS on, no policies, no anon/authenticated grants)
REVOKE ALL ON TABLE public.integration_credentials FROM anon, authenticated;
REVOKE ALL ON TABLE public.integration_credential_fields FROM anon, authenticated;
GRANT ALL ON TABLE public.integration_credentials TO service_role;
GRANT ALL ON TABLE public.integration_credential_fields TO service_role;
GRANT ALL ON TABLE public.integration_platforms TO service_role;