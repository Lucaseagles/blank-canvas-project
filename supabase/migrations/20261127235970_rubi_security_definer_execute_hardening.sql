-- Keep SECURITY DEFINER entry points limited to their intended caller roles.
BEGIN;

-- Legacy Owner-only RPC: authenticated owners retain the function-level Owner check;
-- anonymous clients and service-role callers do not need this entry point.
REVOKE ALL ON FUNCTION public.append_admin_audit(text, text, text, jsonb, jsonb)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.append_admin_audit(text, text, text, jsonb, jsonb)
  TO authenticated;

-- Trigger-only function: it is invoked by the existing marketplace trigger and
-- is not an API operation. Revoke direct execution from every API role.
REVOKE ALL ON FUNCTION public.audit_marketplace_mutation()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_marketplace_mutation()
  TO service_role;

-- The application calls this through supabaseAdmin after resolving the current
-- authenticated user server-side. Do not let API clients choose another user_id.
REVOKE ALL ON FUNCTION public.get_eligible_benefit_popup(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_benefit_popup(uuid)
  TO service_role;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.append_admin_audit(text,text,text,jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'append_admin_audit execution grants are not least-privilege';
  END IF;

  IF has_function_privilege('anon', 'public.audit_marketplace_mutation()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.audit_marketplace_mutation()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.audit_marketplace_mutation()', 'EXECUTE') THEN
    RAISE EXCEPTION 'marketplace trigger function must not be directly executable by API roles';
  END IF;

  IF has_function_privilege('anon', 'public.get_eligible_benefit_popup(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.get_eligible_benefit_popup(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.get_eligible_benefit_popup(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'benefit popup function must be service_role-only';
  END IF;
END
$$;

COMMIT;
