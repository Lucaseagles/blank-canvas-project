\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);
SELECT set_config('rubi.qa_merchant_id', :'merchant_id', true);

CREATE TEMP TABLE rubi_qa_quote_ids (quote_id uuid PRIMARY KEY) ON COMMIT DROP;
GRANT ALL ON TABLE pg_temp.rubi_qa_quote_ids TO service_role;

INSERT INTO public.hub_b2b_quote_requests(
 commercial_profile_id,merchant_user_id,status,requested_lines,total_estimate,
 followup_opt_in,followup_interval_days,followup_due_at
)
SELECT cp.id, current_setting('rubi.qa_merchant_id')::uuid, 'requested',
 '[{"productId":"00000000-0000-4000-8000-000000000001","title":"RUBI QA B2B quote","quantity":2,"unitPrice":10,"total":20}]'::jsonb,
 20,true,14,clock_timestamp()+interval '14 days'
FROM public.commercial_profiles cp
WHERE cp.user_id=current_setting('rubi.qa_merchant_id')::uuid
 AND cp.audience='merchant' AND cp.status='approved'
LIMIT 1
RETURNING id INTO TEMP TABLE rubi_qa_quote_seed;
INSERT INTO pg_temp.rubi_qa_quote_ids SELECT id FROM rubi_qa_quote_seed;
DROP TABLE rubi_qa_quote_seed;

DO $grants$
BEGIN
 IF NOT has_function_privilege('service_role','public.rubi_update_business_quote_admin_audited(uuid,timestamp with time zone,text,text,uuid)','EXECUTE')
 OR NOT has_function_privilege('service_role','public.rubi_complete_business_followup_admin_audited(uuid,timestamp with time zone,uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'service_role is missing B2B quote audit RPC execute';
 END IF;
 IF has_function_privilege('anon','public.rubi_update_business_quote_admin_audited(uuid,timestamp with time zone,text,text,uuid)','EXECUTE')
 OR has_function_privilege('authenticated','public.rubi_update_business_quote_admin_audited(uuid,timestamp with time zone,text,text,uuid)','EXECUTE')
 OR has_function_privilege('anon','public.rubi_complete_business_followup_admin_audited(uuid,timestamp with time zone,uuid)','EXECUTE')
 OR has_function_privilege('authenticated','public.rubi_complete_business_followup_admin_audited(uuid,timestamp with time zone,uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'Untrusted API role can execute B2B quote audit RPC';
 END IF;
END;
$grants$;

CREATE FUNCTION pg_temp.rubi_qa_reject_business_quote_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
 IF NEW.entity_type='hub_b2b_quote_requests' THEN RAISE EXCEPTION 'RUBI_QA_FORCED_BUSINESS_QUOTE_AUDIT_FAILURE'; END IF;
 RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_business_quote_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_business_quote_audit();

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE v_id uuid; v_revision timestamptz; v_status text;
BEGIN
 SELECT q.id,q.updated_at,q.status INTO v_id,v_revision,v_status
 FROM public.hub_b2b_quote_requests q JOIN pg_temp.rubi_qa_quote_ids f ON f.quote_id=q.id;
 BEGIN
  PERFORM public.rubi_update_business_quote_admin_audited(v_id,v_revision,'reviewing','rollback probe',current_setting('rubi.qa_master_id')::uuid);
  RAISE EXCEPTION 'RUBI_QA_EXPECTED_BUSINESS_QUOTE_AUDIT_FAILURE_NOT_RAISED';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_BUSINESS_QUOTE_AUDIT_FAILURE%' THEN RAISE; END IF;
 END;
 SELECT status INTO v_status FROM public.hub_b2b_quote_requests WHERE id=v_id;
 IF v_status IS DISTINCT FROM 'requested' THEN RAISE EXCEPTION 'B2B quote status survived failed audit insert'; END IF;
END;
$rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_business_quote_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_business_quote_audit();

SET LOCAL ROLE service_role;
DO $non_owner$
DECLARE v_id uuid; v_revision timestamptz;
BEGIN
 SELECT q.id,q.updated_at INTO v_id,v_revision FROM public.hub_b2b_quote_requests q JOIN pg_temp.rubi_qa_quote_ids f ON f.quote_id=q.id;
 BEGIN
  PERFORM public.rubi_update_business_quote_admin_audited(v_id,v_revision,'reviewing','forbidden',current_setting('rubi.qa_non_owner_id')::uuid);
  RAISE EXCEPTION 'RUBI_QA_EXPECTED_BUSINESS_QUOTE_NON_OWNER_REJECTION_NOT_RAISED';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
 END;
 IF (SELECT status FROM public.hub_b2b_quote_requests WHERE id=v_id) IS DISTINCT FROM 'requested' THEN
  RAISE EXCEPTION 'Non-Owner changed B2B quote';
 END IF;
END;
$non_owner$;

DO $lifecycle$
DECLARE v_id uuid; v_revision timestamptz; v_result jsonb; v_updated timestamptz;
BEGIN
 SELECT q.id,q.updated_at INTO v_id,v_revision FROM public.hub_b2b_quote_requests q JOIN pg_temp.rubi_qa_quote_ids f ON f.quote_id=q.id;
 v_result:=public.rubi_update_business_quote_admin_audited(v_id,v_revision,'responded','private QA reply text',current_setting('rubi.qa_master_id')::uuid);
 IF v_result->>'status' IS DISTINCT FROM 'responded' OR v_result->>'responded_at' IS NULL THEN
  RAISE EXCEPTION 'B2B quote response timestamp/status was not persisted';
 END IF;
 v_updated:=(v_result->>'updated_at')::timestamptz;
 BEGIN
  PERFORM public.rubi_update_business_quote_admin_audited(v_id,v_revision,'closed','stale update',current_setting('rubi.qa_master_id')::uuid);
  RAISE EXCEPTION 'RUBI_QA_EXPECTED_STALE_BUSINESS_QUOTE_REJECTION_NOT_RAISED';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%Business quote changed%' THEN RAISE; END IF;
 END;
 v_result:=public.rubi_complete_business_followup_admin_audited(v_id,v_updated,current_setting('rubi.qa_master_id')::uuid);
 IF v_result->>'followup_completed_at' IS NULL THEN RAISE EXCEPTION 'B2B internal follow-up did not complete'; END IF;
 IF (SELECT count(*) FROM public.admin_audit_log WHERE entity_type='hub_b2b_quote_requests' AND entity_id=v_id::text
  AND action_type IN ('RUBI_BUSINESS_QUOTE_UPDATED','RUBI_BUSINESS_FOLLOWUP_COMPLETED'))<>2 THEN
  RAISE EXCEPTION 'B2B quote admin lifecycle audit count mismatch';
 END IF;
 IF EXISTS(SELECT 1 FROM public.admin_audit_log WHERE entity_type='hub_b2b_quote_requests' AND entity_id=v_id::text
  AND new_value::text LIKE '%private QA reply text%') THEN
  RAISE EXCEPTION 'B2B quote private note leaked into audit log';
 END IF;
END;
$lifecycle$;
RESET ROLE;
ROLLBACK;
\echo 'PASS: B2B quote Owner gate, least-privilege grants, atomic audit rollback, stale-write guard, response timestamp and internal follow-up audit.'
