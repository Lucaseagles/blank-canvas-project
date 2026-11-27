-- Local disposable PostgreSQL smoke: run after the Sprint 365 grant migration.
DO $$
BEGIN
  IF has_function_privilege('anon','public.append_admin_audit(text,text,text,jsonb,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'anon unexpectedly executes append_admin_audit';
  END IF;
  IF NOT has_function_privilege('authenticated','public.append_admin_audit(text,text,text,jsonb,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost the guarded Owner audit function';
  END IF;
  IF has_function_privilege('anon','public.get_eligible_benefit_popup(uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.get_eligible_benefit_popup(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'browser role can execute server-only benefit popup';
  END IF;
  IF NOT has_function_privilege('service_role','public.get_eligible_benefit_popup(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute benefit popup';
  END IF;
  IF has_function_privilege('anon','public.audit_marketplace_mutation()','EXECUTE')
     OR has_function_privilege('authenticated','public.audit_marketplace_mutation()','EXECUTE') THEN
    RAISE EXCEPTION 'browser role can directly execute trigger function';
  END IF;
END
$$;
