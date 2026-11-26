\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);

DO $grants$
BEGIN
  IF NOT has_function_privilege('service_role','public.rubi_create_referral_tier_audited(jsonb,uuid)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.rubi_update_referral_tier_audited(uuid,timestamp with time zone,jsonb,uuid)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.rubi_deactivate_referral_tier_audited(uuid,timestamp with time zone,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'service_role is missing referral tier RPC execute';
  END IF;
  IF has_function_privilege('anon','public.rubi_create_referral_tier_audited(jsonb,uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.rubi_create_referral_tier_audited(jsonb,uuid)','EXECUTE')
    OR has_function_privilege('anon','public.rubi_update_referral_tier_audited(uuid,timestamp with time zone,jsonb,uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.rubi_update_referral_tier_audited(uuid,timestamp with time zone,jsonb,uuid)','EXECUTE')
    OR has_function_privilege('anon','public.rubi_deactivate_referral_tier_audited(uuid,timestamp with time zone,uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.rubi_deactivate_referral_tier_audited(uuid,timestamp with time zone,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted API role can execute referral tier RPC';
  END IF;
  IF has_table_privilege('anon','public.referral_tiers','INSERT')
    OR has_table_privilege('authenticated','public.referral_tiers','INSERT')
    OR has_table_privilege('anon','public.referral_tiers','UPDATE')
    OR has_table_privilege('authenticated','public.referral_tiers','UPDATE')
    OR has_table_privilege('anon','public.referral_tiers','DELETE')
    OR has_table_privilege('authenticated','public.referral_tiers','DELETE') THEN
    RAISE EXCEPTION 'Browser role retains direct referral tier DML';
  END IF;
  IF NOT has_table_privilege('anon','public.referral_tiers','SELECT')
    OR NOT has_table_privilege('authenticated','public.referral_tiers','SELECT') THEN
    RAISE EXCEPTION 'Consumer referral tier SELECT was removed';
  END IF;
END;
$grants$;

CREATE FUNCTION pg_temp.rubi_qa_reject_referral_tier_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.entity_type='referral_tiers' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_REFERRAL_TIER_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_referral_tier_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_referral_tier_audit();

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE v_key text := 'rubi-qa-rollback-'||replace(gen_random_uuid()::text,'-','');
BEGIN
  BEGIN
    PERFORM public.rubi_create_referral_tier_audited(
      jsonb_build_object('tier_name','RUBI QA rollback','tier_key',v_key,'min_referrals',0,
        'reward_description','rollback only','icon','🏅','color','#6B7280','is_active',true,'display_order',999999),
      current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_REFERRAL_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_REFERRAL_TIER_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.referral_tiers WHERE tier_key=v_key) THEN
    RAISE EXCEPTION 'Referral tier survived failed audit insert';
  END IF;
END;
$rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_referral_tier_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_referral_tier_audit();

SET LOCAL ROLE service_role;
DO $owner$
DECLARE v_key text := 'rubi-qa-denied-'||replace(gen_random_uuid()::text,'-','');
BEGIN
  BEGIN
    PERFORM public.rubi_create_referral_tier_audited(
      jsonb_build_object('tier_name','RUBI QA denied','tier_key',v_key,'min_referrals',0,
        'reward_description','must not persist','icon','🏅','color','#6B7280','is_active',true,'display_order',999998),
      current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_REFERRAL_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.referral_tiers WHERE tier_key=v_key) THEN
    RAISE EXCEPTION 'Non-Owner referral tier unexpectedly persisted';
  END IF;
END;
$owner$;

DO $lifecycle$
DECLARE
  v_key text := 'rubi-qa-tier-'||replace(gen_random_uuid()::text,'-','');
  v_created jsonb;
  v_updated jsonb;
  v_deactivated jsonb;
  v_id uuid;
  v_timestamp timestamptz;
BEGIN
  v_created:=public.rubi_create_referral_tier_audited(
    jsonb_build_object('tier_name','RUBI QA tier','tier_key',v_key,'min_referrals',0,
      'reward_description','temporary local fixture','icon','🏅','color','#6B7280','is_active',true,'display_order',999997),
    current_setting('rubi.qa_master_id')::uuid
  );
  v_id:=(v_created->>'id')::uuid;
  v_timestamp:=(v_created->>'updated_at')::timestamptz;

  v_updated:=public.rubi_update_referral_tier_audited(
    v_id,v_timestamp,jsonb_build_object('tier_name','RUBI QA tier updated'),
    current_setting('rubi.qa_master_id')::uuid
  );
  IF v_updated->>'tier_name' IS DISTINCT FROM 'RUBI QA tier updated' THEN
    RAISE EXCEPTION 'Referral tier update did not persist';
  END IF;

  BEGIN
    PERFORM public.rubi_update_referral_tier_audited(
      v_id,v_timestamp,jsonb_build_object('tier_name','RUBI QA stale update'),
      current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_STALE_UPDATE_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Referral tier changed%' THEN RAISE; END IF;
  END;

  v_deactivated:=public.rubi_deactivate_referral_tier_audited(
    v_id,(v_updated->>'updated_at')::timestamptz,current_setting('rubi.qa_master_id')::uuid
  );
  IF (v_deactivated->>'is_active')::boolean IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Referral tier soft deactivation did not persist';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log WHERE entity_type='referral_tiers' AND entity_id=v_id::text
      AND action_type IN ('RUBI_REFERRAL_TIER_CREATED','RUBI_REFERRAL_TIER_UPDATED','RUBI_REFERRAL_TIER_DEACTIVATED')) <> 3 THEN
    RAISE EXCEPTION 'Referral tier lifecycle must write exactly three audit events';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_audit_log
      WHERE entity_type='referral_tiers' AND entity_id=v_id::text
      AND (coalesce(previous_value,'{}'::jsonb)||coalesce(new_value,'{}'::jsonb)) ? 'reward_description') THEN
    RAISE EXCEPTION 'Audit log unexpectedly contains referral tier descriptive values';
  END IF;
END;
$lifecycle$;
RESET ROLE;
ROLLBACK;
\echo 'PASS: referral tier Owner authorization, least privilege, audit rollback, optimistic concurrency, lifecycle and audit redaction.'
