\\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);

CREATE FUNCTION pg_temp.rubi_qa_reject_brand_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.entity_type = 'brand_identity'
     AND NEW.action_type IN ('RUBI_BRAND_IDENTITY_CREATED','RUBI_BRAND_IDENTITY_UPDATED') THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_BRAND_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_brand_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_brand_audit();

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE v_before text;
BEGIN
  SELECT display_name INTO v_before FROM public.brand_identity WHERE id=true;
  BEGIN
    PERFORM public.rubi_update_brand_identity_audited(
      'RUBI QA rollback identity', current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_BRAND_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_BRAND_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF (SELECT display_name FROM public.brand_identity WHERE id=true) IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'Brand identity changed despite failed audit insert';
  END IF;
END;
$rollback$;

RESET ROLE;
DROP TRIGGER rubi_qa_reject_brand_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_brand_audit();

SET LOCAL ROLE service_role;
DO $non_owner$
BEGIN
  BEGIN
    PERFORM public.rubi_update_brand_identity_audited(
      'RUBI QA forbidden identity', current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_BRAND_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$non_owner$;

DO $success$
DECLARE v_result jsonb; v_id text;
BEGIN
  v_result := public.rubi_update_brand_identity_audited(
    'RUBI QA audited identity', current_setting('rubi.qa_master_id')::uuid
  );
  IF v_result->>'display_name' IS DISTINCT FROM 'RUBI QA audited identity' THEN
    RAISE EXCEPTION 'Brand identity RPC did not return the persisted value';
  END IF;
  SELECT id::text INTO v_id FROM public.brand_identity WHERE id=true;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type='brand_identity' AND entity_id=v_id
      AND action_type='RUBI_BRAND_IDENTITY_UPDATED') <> 1 THEN
    RAISE EXCEPTION 'Successful brand identity update did not write exactly one audit event';
  END IF;
END;
$success$;

DO $grants$
BEGIN
  IF NOT has_function_privilege('service_role',
    'public.rubi_update_brand_identity_audited(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute brand identity audit RPC';
  END IF;
  IF has_function_privilege('anon',
    'public.rubi_update_brand_identity_audited(text,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated',
    'public.rubi_update_brand_identity_audited(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted API role can execute brand identity audit RPC';
  END IF;
END;
$grants$;

ROLLBACK;
