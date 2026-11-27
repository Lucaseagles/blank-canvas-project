-- Sprint 365: least-privilege EXECUTE grants for SECURITY DEFINER functions.
-- Browser clients never call benefit eligibility directly; the trusted server
-- invokes it with the service-role client after resolving the authenticated user.
BEGIN;

-- Owner audit writes remain callable by authenticated clients because the
-- function itself derives auth.uid() and enforces the Owner role internally.
REVOKE ALL ON FUNCTION public.append_admin_audit(text,text,text,jsonb,jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.append_admin_audit(text,text,text,jsonb,jsonb)
  TO authenticated;

-- Benefit popup accepts an arbitrary user UUID. Keep it server-only so a
-- browser user cannot probe another profile by changing p_user_id.
REVOKE ALL ON FUNCTION public.get_eligible_benefit_popup(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_benefit_popup(uuid)
  TO service_role;

-- Trigger functions are invoked by PostgreSQL triggers, not PostgREST RPC.
REVOKE ALL ON FUNCTION public.audit_marketplace_mutation()
  FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT has_function_privilege('anon',
      'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE') = false THEN
    RAISE EXCEPTION 'anon must not execute append_admin_audit';
  END IF;
  IF NOT has_function_privilege('authenticated',
      'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated Owner audit entrypoint grant was removed';
  END IF;
  IF has_function_privilege('anon',
      'public.get_eligible_benefit_popup(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated',
      'public.get_eligible_benefit_popup(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'benefit popup remains browser-executable';
  END IF;
  IF NOT has_function_privilege('service_role',
      'public.get_eligible_benefit_popup(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role benefit popup execution grant is missing';
  END IF;
  IF has_function_privilege('anon', 'public.audit_marketplace_mutation()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.audit_marketplace_mutation()', 'EXECUTE') THEN
    RAISE EXCEPTION 'trigger function remains directly executable by browser roles';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
    JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='audit_marketplace_mutation'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'marketplace audit trigger attachment is missing';
  END IF;
END
$$;

COMMIT;
