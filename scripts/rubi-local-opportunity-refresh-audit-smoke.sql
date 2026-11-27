\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE rubi_qa_refresh_actor(master_id uuid, non_owner_id uuid) ON COMMIT DROP;
INSERT INTO rubi_qa_refresh_actor VALUES (:'master_id'::uuid, :'non_owner_id'::uuid);

CREATE FUNCTION pg_temp.rubi_qa_reject_refresh_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action_type='RUBI_OPPORTUNITY_ALERTS_REFRESHED' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_REFRESH_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_refresh_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_refresh_audit();

DO $grants$
BEGIN
  IF NOT has_function_privilege('service_role','public.rubi_refresh_opportunity_alerts_audited(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute audited refresh';
  END IF;
  IF has_function_privilege('anon','public.rubi_refresh_opportunity_alerts_audited(uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.rubi_refresh_opportunity_alerts_audited(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted API role can execute audited refresh';
  END IF;
END;
$grants$;

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE v_before bigint; v_after bigint;
BEGIN
  SELECT count(*) INTO v_before FROM public.opportunity_alerts;
  BEGIN
    PERFORM public.rubi_refresh_opportunity_alerts_audited((SELECT master_id FROM rubi_qa_refresh_actor));
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_REFRESH_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_REFRESH_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  SELECT count(*) INTO v_after FROM public.opportunity_alerts;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'Refresh data survived failed audit';
  END IF;
END;
$rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_refresh_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_refresh_audit();
SET LOCAL ROLE service_role;

DO $authorization$
BEGIN
  BEGIN
    PERFORM public.rubi_refresh_opportunity_alerts_audited((SELECT non_owner_id FROM rubi_qa_refresh_actor));
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_REFRESH_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$authorization$;

RESET ROLE;
ROLLBACK;
