\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);

CREATE TEMP TABLE rubi_qa_opportunity_alert(id uuid primary key, initial_revision timestamptz) ON COMMIT DROP;
GRANT ALL ON TABLE pg_temp.rubi_qa_opportunity_alert TO service_role;
WITH inserted AS (
  INSERT INTO public.opportunity_alerts(opportunity_type,source_id,title,score,priority,reasons,recommended_action,status)
  VALUES ('campaign',gen_random_uuid(),'RUBI QA opportunity audit',50,50,'[]'::jsonb,'Review only','open')
  RETURNING id,updated_at
)
INSERT INTO pg_temp.rubi_qa_opportunity_alert SELECT id,updated_at FROM inserted;

CREATE FUNCTION pg_temp.rubi_qa_reject_opportunity_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.entity_type='opportunity_alerts' THEN RAISE EXCEPTION 'RUBI_QA_FORCED_OPPORTUNITY_AUDIT_FAILURE'; END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_opportunity_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_opportunity_audit();

DO $grants$
BEGIN
  IF NOT has_function_privilege('service_role','public.rubi_update_opportunity_alert_status_audited(uuid,timestamp with time zone,text,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute audited opportunity RPC';
  END IF;
  IF has_function_privilege('anon','public.rubi_update_opportunity_alert_status_audited(uuid,timestamp with time zone,text,uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.rubi_update_opportunity_alert_status_audited(uuid,timestamp with time zone,text,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted API role can execute audited opportunity RPC';
  END IF;
END;
$grants$;

DO $read_rpc_grants$
BEGIN
  IF has_function_privilege('anon','public.get_opportunity_alerts(text)','EXECUTE')
     OR has_function_privilege('authenticated','public.get_opportunity_alerts(text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.get_opportunity_alerts(text)','EXECUTE') THEN
    RAISE EXCEPTION 'Opportunity SECURITY DEFINER read RPC grants are not restricted to service_role';
  END IF;
END
$read_rpc_grants$;

DO $table_grants$
BEGIN
  IF has_table_privilege('anon','public.opportunity_alerts','SELECT')
     OR has_table_privilege('anon','public.opportunity_alerts','INSERT')
     OR has_table_privilege('anon','public.opportunity_alerts','UPDATE')
     OR has_table_privilege('anon','public.opportunity_alerts','DELETE') THEN
    RAISE EXCEPTION 'anon retains direct access to opportunity_alerts';
  END IF;
  IF NOT has_table_privilege('authenticated','public.opportunity_alerts','SELECT')
     OR has_table_privilege('authenticated','public.opportunity_alerts','INSERT')
     OR has_table_privilege('authenticated','public.opportunity_alerts','UPDATE')
     OR has_table_privilege('authenticated','public.opportunity_alerts','DELETE') THEN
    RAISE EXCEPTION 'authenticated table privileges do not match Owner-read-only contract';
  END IF;
  IF NOT has_table_privilege('service_role','public.opportunity_alerts','INSERT')
     OR NOT has_table_privilege('service_role','public.opportunity_alerts','UPDATE')
     OR NOT has_table_privilege('service_role','public.opportunity_alerts','DELETE') THEN
    RAISE EXCEPTION 'service_role lost audited Opportunity Engine write privileges';
  END IF;
END
$table_grants$;

SELECT set_config('request.jwt.claim.sub', current_setting('rubi.qa_master_id'), true);
SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',current_setting('rubi.qa_master_id'),'role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $direct_dml$
BEGIN
  BEGIN
    UPDATE public.opportunity_alerts SET status='dismissed' WHERE false;
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_DIRECT_UPDATE_DENIAL_NOT_RAISED';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.opportunity_alerts(opportunity_type,source_id,title,recommended_action)
    VALUES('campaign',gen_random_uuid(),'RUBI QA direct insert','must be denied');
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_DIRECT_INSERT_DENIAL_NOT_RAISED';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    DELETE FROM public.opportunity_alerts WHERE false;
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_DIRECT_DELETE_DENIAL_NOT_RAISED';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$direct_dml$;
DO $owner_read$
DECLARE v_count bigint;
BEGIN
  SELECT count(*) INTO v_count FROM public.opportunity_alerts;
  IF v_count<1 THEN RAISE EXCEPTION 'Owner read policy did not expose the seeded QA opportunity'; END IF;
END
$owner_read$;
RESET ROLE;

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE v_id uuid; v_revision timestamptz; v_status text;
BEGIN
  SELECT id,initial_revision INTO v_id,v_revision FROM pg_temp.rubi_qa_opportunity_alert;
  BEGIN
    PERFORM public.rubi_update_opportunity_alert_status_audited(v_id,v_revision,'dismissed',current_setting('rubi.qa_master_id')::uuid);
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_OPPORTUNITY_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_OPPORTUNITY_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  SELECT status INTO v_status FROM public.opportunity_alerts WHERE id=v_id;
  IF v_status IS DISTINCT FROM 'open' THEN RAISE EXCEPTION 'Opportunity status survived failed audit'; END IF;
END;
$rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_opportunity_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_opportunity_audit();

SET LOCAL ROLE service_role;
DO $lifecycle$
DECLARE v_id uuid; v_revision timestamptz; v_result jsonb; v_stale jsonb;
BEGIN
  SELECT id,initial_revision INTO v_id,v_revision FROM pg_temp.rubi_qa_opportunity_alert;
  v_result:=public.rubi_update_opportunity_alert_status_audited(v_id,v_revision,'dismissed',current_setting('rubi.qa_master_id')::uuid);
  IF v_result->>'status' IS DISTINCT FROM 'dismissed' THEN RAISE EXCEPTION 'Opportunity status did not update'; END IF;
  BEGIN
    PERFORM public.rubi_update_opportunity_alert_status_audited(v_id,v_revision,'actioned',current_setting('rubi.qa_master_id')::uuid);
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_STALE_OPPORTUNITY_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Opportunity alert changed; reload before saving%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.rubi_update_opportunity_alert_status_audited(v_id,v_revision,'actioned',current_setting('rubi.qa_non_owner_id')::uuid);
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_OPPORTUNITY_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.admin_audit_log WHERE entity_type='opportunity_alerts' AND entity_id=v_id::text AND action_type='RUBI_OPPORTUNITY_ALERT_STATUS_UPDATED')<>1 THEN
    RAISE EXCEPTION 'Expected exactly one sanitized opportunity audit record';
  END IF;
END;
$lifecycle$;
RESET ROLE;
ROLLBACK;
