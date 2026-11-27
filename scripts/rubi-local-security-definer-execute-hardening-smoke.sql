\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('rubi.smoke.consumer_id', :'consumer_id', true);

DO $
BEGIN
  IF has_function_privilege('anon', 'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'append_admin_audit grants do not match authenticated Owner-only contract';
  END IF;
  IF has_function_privilege('anon', 'public.audit_marketplace_mutation()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.audit_marketplace_mutation()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.audit_marketplace_mutation()', 'EXECUTE') THEN
    RAISE EXCEPTION 'marketplace trigger function is exposed as a direct RPC';
  END IF;
  IF has_function_privilege('anon', 'public.get_eligible_benefit_popup(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.get_eligible_benefit_popup(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.get_eligible_benefit_popup(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'benefit popup function is not service_role-only';
  END IF;
END
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'consumer_id', true);

DO $$
DECLARE
  non_owner_denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.append_admin_audit(
      'RUBI_SECURITY_DEFINER_SMOKE_DENIED',
      'security_definer_smoke',
      'non_owner',
      '{}'::jsonb,
      '{}'::jsonb
    );
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Owner access required' THEN
      non_owner_denied := true;
    ELSE
      RAISE;
    END IF;
  END;
  IF NOT non_owner_denied THEN
    RAISE EXCEPTION 'Authenticated non-Owner called append_admin_audit successfully';
  END IF;

  BEGIN
    PERFORM * FROM public.get_eligible_benefit_popup(current_setting('rubi.smoke.consumer_id', true)::uuid);
    RAISE EXCEPTION 'Authenticated client called service-role-only benefit popup function';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'master_id', true);

DO $$
DECLARE
  audit_id uuid;
BEGIN
  audit_id := public.append_admin_audit(
    'RUBI_SECURITY_DEFINER_SMOKE_OWNER',
    'security_definer_smoke',
    'owner',
    '{}'::jsonb,
    '{"values_redacted":true}'::jsonb
  );
  IF audit_id IS NULL THEN
    RAISE EXCEPTION 'Owner append_admin_audit did not return an audit ID';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE id = audit_id AND actor_user_id = auth.uid()
      AND action_type = 'RUBI_SECURITY_DEFINER_SMOKE_OWNER'
  ) THEN
    RAISE EXCEPTION 'Owner audit event was not persisted with auth.uid() as actor';
  END IF;
END
$$;

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);

DO $$
DECLARE
  anon_audit_denied boolean := false;
  anon_benefit_denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.append_admin_audit('RUBI_ANON_SMOKE', 'security', 'anon', NULL, NULL);
  EXCEPTION WHEN insufficient_privilege THEN
    anon_audit_denied := true;
  END;
  IF NOT anon_audit_denied THEN
    RAISE EXCEPTION 'Anonymous client executed append_admin_audit';
  END IF;

  BEGIN
    PERFORM * FROM public.get_eligible_benefit_popup(current_setting('rubi.smoke.consumer_id', true)::uuid);
  EXCEPTION WHEN insufficient_privilege THEN
    anon_benefit_denied := true;
  END;
  IF NOT anon_benefit_denied THEN
    RAISE EXCEPTION 'Anonymous client executed get_eligible_benefit_popup';
  END IF;
END
$$;

ROLLBACK;
SELECT 'SECURITY DEFINER grants, Owner actor validation and service-role-only benefit lookup: PASS' AS result;
