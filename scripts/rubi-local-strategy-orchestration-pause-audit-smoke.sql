\set ON_ERROR_STOP on

-- Disposable local PostgreSQL proof for Sprint 308 Strategy Orchestration pause.
-- All fixture writes, deliberate audit failure and assertions are rolled back.

BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);

DO $grants$
BEGIN
  -- Legacy mutation RPCs and direct authenticated DML must be closed.
  IF has_function_privilege('authenticated', 'public.create_strategy_orchestration(text,text,integer,text,uuid[])', 'EXECUTE')
    OR has_function_privilege('service_role', 'public.create_strategy_orchestration(text,text,integer,text,uuid[])', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[])', 'EXECUTE')
    OR has_function_privilege('service_role', 'public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[])', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.generate_strategy_orchestration_plan(uuid)', 'EXECUTE')
    OR has_function_privilege('service_role', 'public.generate_strategy_orchestration_plan(uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.approve_strategy_orchestration(uuid)', 'EXECUTE')
    OR has_function_privilege('service_role', 'public.approve_strategy_orchestration(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Legacy Strategy Orchestration mutation RPC remains executable';
  END IF;
  IF has_table_privilege('authenticated', 'public.strategy_orchestrations', 'INSERT')
    OR has_table_privilege('authenticated', 'public.strategy_orchestrations', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.strategy_orchestrations', 'DELETE')
    OR has_table_privilege('authenticated', 'public.strategy_orchestration_items', 'INSERT')
    OR has_table_privilege('authenticated', 'public.strategy_orchestration_items', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.strategy_orchestration_items', 'DELETE')
    OR has_table_privilege('authenticated', 'public.strategy_orchestration_videos', 'INSERT')
    OR has_table_privilege('authenticated', 'public.strategy_orchestration_videos', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.strategy_orchestration_videos', 'DELETE') THEN
    RAISE EXCEPTION 'Authenticated clients retain direct Strategy Orchestration write privileges';
  END IF;
  IF NOT has_function_privilege('service_role',
    'public.rubi_pause_strategy_orchestration_audited(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute audited pause RPC';
  END IF;
  IF has_function_privilege('anon',
    'public.rubi_pause_strategy_orchestration_audited(uuid,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated',
    'public.rubi_pause_strategy_orchestration_audited(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Audited pause RPC is executable by an untrusted API role';
  END IF;
END;
$grants$;

CREATE TEMP TABLE rubi_qa_orchestration_ids (
  rollback_id uuid NOT NULL,
  success_id uuid NOT NULL,
  invalid_id uuid NOT NULL
) ON COMMIT DROP;
GRANT ALL ON TABLE pg_temp.rubi_qa_orchestration_ids TO service_role;

SET LOCAL ROLE service_role;
INSERT INTO public.strategy_orchestrations(name, objective, status, priority, created_by)
VALUES
 ('RUBI QA pause rollback', 'traffic', 'ready', 50, current_setting('rubi.qa_master_id')::uuid),
 ('RUBI QA pause success', 'engagement', 'approved', 50, current_setting('rubi.qa_master_id')::uuid),
 ('RUBI QA pause invalid state', 'conversion', 'draft', 50, current_setting('rubi.qa_master_id')::uuid);

INSERT INTO pg_temp.rubi_qa_orchestration_ids
SELECT
 (SELECT id FROM public.strategy_orchestrations WHERE name='RUBI QA pause rollback' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM public.strategy_orchestrations WHERE name='RUBI QA pause success' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM public.strategy_orchestrations WHERE name='RUBI QA pause invalid state' ORDER BY created_at DESC LIMIT 1);

-- A failed audit insert must roll back the status transition.
CREATE FUNCTION pg_temp.rubi_qa_reject_orchestration_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action_type = 'RUBI_STRATEGY_ORCHESTRATION_PAUSED' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_ORCHESTRATION_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_orchestration_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_orchestration_audit();

DO $rollback$
DECLARE v_id uuid;
BEGIN
  SELECT rollback_id INTO STRICT v_id FROM pg_temp.rubi_qa_orchestration_ids;
  BEGIN
    PERFORM public.rubi_pause_strategy_orchestration_audited(
      v_id, current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_ORCHESTRATION_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_ORCHESTRATION_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.strategy_orchestrations WHERE id=v_id) <> 'ready' THEN
    RAISE EXCEPTION 'Orchestration status survived failed audit insert';
  END IF;
END;
$rollback$;

-- Trigger DDL belongs to the migration/test owner, not service_role.
RESET ROLE;
DROP TRIGGER rubi_qa_reject_orchestration_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_orchestration_audit();

-- Re-enter the restricted executor role for all remaining RPC assertions.
SET LOCAL ROLE service_role;

-- A non-owner identity must be rejected even when supplied through service_role.
DO $non_owner$
DECLARE v_id uuid;
BEGIN
  SELECT success_id INTO STRICT v_id FROM pg_temp.rubi_qa_orchestration_ids;
  BEGIN
    PERFORM public.rubi_pause_strategy_orchestration_audited(
      v_id, current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_ORCHESTRATION_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$non_owner$;

-- Invalid states are rejected without mutation.
DO $invalid$
DECLARE v_id uuid;
BEGIN
  SELECT invalid_id INTO STRICT v_id FROM pg_temp.rubi_qa_orchestration_ids;
  BEGIN
    PERFORM public.rubi_pause_strategy_orchestration_audited(
      v_id, current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_INVALID_STATE_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%cannot be paused from current status%' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.strategy_orchestrations WHERE id=v_id) <> 'draft' THEN
    RAISE EXCEPTION 'Invalid-state orchestration was unexpectedly changed';
  END IF;
END;
$invalid$;

-- Successful transition writes exactly one matching audit event.
DO $success$
DECLARE v_id uuid; result jsonb;
BEGIN
  SELECT success_id INTO STRICT v_id FROM pg_temp.rubi_qa_orchestration_ids;
  result := public.rubi_pause_strategy_orchestration_audited(
    v_id, current_setting('rubi.qa_master_id')::uuid
  );
  IF result->>'status' IS DISTINCT FROM 'paused' THEN
    RAISE EXCEPTION 'Audited orchestration pause returned an unexpected status';
  END IF;
  IF (SELECT status FROM public.strategy_orchestrations WHERE id=v_id) <> 'paused' THEN
    RAISE EXCEPTION 'Successful orchestration pause did not persist';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type='strategy_orchestration'
        AND entity_id=v_id::text
        AND action_type='RUBI_STRATEGY_ORCHESTRATION_PAUSED') <> 1 THEN
    RAISE EXCEPTION 'Successful orchestration pause did not create exactly one audit event';
  END IF;
END;
$success$;

-- Audited creation: success writes exactly one event with only safe summary fields.
CREATE TEMP TABLE rubi_qa_created_orchestration (id uuid NOT NULL) ON COMMIT DROP;
DO $create_success$
DECLARE result jsonb; v_id uuid;
BEGIN
  result := public.rubi_create_strategy_orchestration_audited(
    'RUBI QA audited creation', 'traffic', 40, 'disposable test',
    '{}'::uuid[], '{}'::uuid[], current_setting('rubi.qa_master_id')::uuid
  );
  v_id := (result->>'id')::uuid;
  IF result->>'status' IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Audited creation returned unexpected status';
  END IF;
  INSERT INTO pg_temp.rubi_qa_created_orchestration VALUES (v_id);
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type='strategy_orchestration' AND entity_id=v_id::text
        AND action_type='RUBI_STRATEGY_ORCHESTRATION_CREATED') <> 1 THEN
    RAISE EXCEPTION 'Audited creation must create exactly one audit event';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE entity_type='strategy_orchestration' AND entity_id=v_id::text
      AND action_type='RUBI_STRATEGY_ORCHESTRATION_CREATED'
      AND (new_value ? 'notes' OR new_value ? 'video_urls' OR new_value ? 'strategy_payload')
  ) THEN
    RAISE EXCEPTION 'Creation audit contains a forbidden detail field';
  END IF;
END;
$create_success$;

-- A non-owner actor must not create an orchestration even via service_role.
DO $create_non_owner$
BEGIN
  BEGIN
    PERFORM public.rubi_create_strategy_orchestration_audited(
      'RUBI QA forbidden creation', 'traffic', 40, null,
      '{}'::uuid[], '{}'::uuid[], current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_CREATE_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$create_non_owner$;

-- Forced audit failure must roll back the orchestration and its linked records.
RESET ROLE;
CREATE FUNCTION pg_temp.rubi_qa_reject_orchestration_create_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action_type = 'RUBI_STRATEGY_ORCHESTRATION_CREATED' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_ORCHESTRATION_CREATE_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_orchestration_create_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_orchestration_create_audit();
SET LOCAL ROLE service_role;
DO $create_rollback$
DECLARE result jsonb;
BEGIN
  BEGIN
    result := public.rubi_create_strategy_orchestration_audited(
      'RUBI QA creation rollback', 'engagement', 30, null,
      '{}'::uuid[], '{}'::uuid[], current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_CREATE_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_ORCHESTRATION_CREATE_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.strategy_orchestrations WHERE name='RUBI QA creation rollback') THEN
    RAISE EXCEPTION 'Creation survived failed audit insert';
  END IF;
END;
$create_rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_orchestration_create_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_orchestration_create_audit();

-- Plan generation: empty selection remains a draft and emits exactly one summary audit.
CREATE TEMP TABLE rubi_qa_plan_ids (empty_id uuid NOT NULL, approval_id uuid NOT NULL) ON COMMIT DROP;
GRANT SELECT ON TABLE pg_temp.rubi_qa_plan_ids TO service_role;
INSERT INTO public.strategy_orchestrations(name, objective, status, priority, created_by)
VALUES
 ('RUBI QA audited plan empty', 'traffic', 'draft', 40, current_setting('rubi.qa_master_id')::uuid),
 ('RUBI QA audited approval', 'conversion', 'ready', 40, current_setting('rubi.qa_master_id')::uuid);
INSERT INTO pg_temp.rubi_qa_plan_ids
SELECT
 (SELECT id FROM public.strategy_orchestrations WHERE name='RUBI QA audited plan empty' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM public.strategy_orchestrations WHERE name='RUBI QA audited approval' ORDER BY created_at DESC LIMIT 1);
UPDATE public.strategy_orchestrations
SET plan = jsonb_build_object('strategies', jsonb_build_array(jsonb_build_object('id','qa-fixture')))
WHERE id=(SELECT approval_id FROM pg_temp.rubi_qa_plan_ids);

DO $plan_success$
DECLARE v_id uuid; result jsonb;
BEGIN
  SELECT empty_id INTO STRICT v_id FROM pg_temp.rubi_qa_plan_ids;
  result := public.rubi_generate_strategy_orchestration_plan_audited(
    v_id, current_setting('rubi.qa_master_id')::uuid
  );
  IF jsonb_array_length(result->'strategies') <> 0 THEN
    RAISE EXCEPTION 'Empty orchestration unexpectedly generated strategies';
  END IF;
  IF (SELECT status FROM public.strategy_orchestrations WHERE id=v_id) <> 'draft' THEN
    RAISE EXCEPTION 'Empty plan must remain draft';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type='strategy_orchestration' AND entity_id=v_id::text
        AND action_type='RUBI_STRATEGY_ORCHESTRATION_PLAN_GENERATED') <> 1 THEN
    RAISE EXCEPTION 'Plan generation must create exactly one audit event';
  END IF;
END;
$plan_success$;

DO $plan_non_owner$
DECLARE v_id uuid;
BEGIN
  SELECT empty_id INTO STRICT v_id FROM pg_temp.rubi_qa_plan_ids;
  BEGIN
    PERFORM public.rubi_generate_strategy_orchestration_plan_audited(
      v_id, current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_PLAN_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$plan_non_owner$;

-- Approval requires a non-empty generated plan and writes one atomic audit event.
DO $approval_success$
DECLARE v_id uuid; result jsonb;
BEGIN
  SELECT approval_id INTO STRICT v_id FROM pg_temp.rubi_qa_plan_ids;
  result := public.rubi_approve_strategy_orchestration_audited(
    v_id, current_setting('rubi.qa_master_id')::uuid
  );
  IF result->>'approved' IS DISTINCT FROM 'true' OR result->>'status' IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Audited approval returned unexpected result';
  END IF;
  IF (SELECT status FROM public.strategy_orchestrations WHERE id=v_id) <> 'approved' THEN
    RAISE EXCEPTION 'Approval status did not persist';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type='strategy_orchestration' AND entity_id=v_id::text
        AND action_type='RUBI_STRATEGY_ORCHESTRATION_APPROVED') <> 1 THEN
    RAISE EXCEPTION 'Approval must create exactly one audit event';
  END IF;
END;
$approval_success$;

-- Failed plan-audit insert must roll back both the generated plan and status.
RESET ROLE;
CREATE FUNCTION pg_temp.rubi_qa_reject_plan_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action_type = 'RUBI_STRATEGY_ORCHESTRATION_PLAN_GENERATED' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_PLAN_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_plan_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_plan_audit();
SET LOCAL ROLE service_role;
DO $plan_rollback$
DECLARE v_id uuid; old_plan jsonb;
BEGIN
  SELECT empty_id INTO STRICT v_id FROM pg_temp.rubi_qa_plan_ids;
  SELECT plan INTO old_plan FROM public.strategy_orchestrations WHERE id=v_id;
  BEGIN
    PERFORM public.rubi_generate_strategy_orchestration_plan_audited(
      v_id, current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_PLAN_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_PLAN_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF (SELECT plan FROM public.strategy_orchestrations WHERE id=v_id) IS DISTINCT FROM old_plan THEN
    RAISE EXCEPTION 'Plan survived failed audit insert';
  END IF;
END;
$plan_rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_plan_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_plan_audit();

-- Failed approval-audit insert must roll back the approved status.
CREATE FUNCTION pg_temp.rubi_qa_reject_approval_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action_type = 'RUBI_STRATEGY_ORCHESTRATION_APPROVED' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_APPROVAL_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_approval_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_approval_audit();
SET LOCAL ROLE service_role;
DO $approval_rollback$
DECLARE v_id uuid;
BEGIN
  SELECT approval_id INTO STRICT v_id FROM pg_temp.rubi_qa_plan_ids;
  -- Revert the disposable fixture to a valid pre-approval state for this rollback proof.
  UPDATE public.strategy_orchestrations SET status='ready' WHERE id=v_id;
  BEGIN
    PERFORM public.rubi_approve_strategy_orchestration_audited(
      v_id, current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_APPROVAL_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_APPROVAL_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.strategy_orchestrations WHERE id=v_id) <> 'ready' THEN
    RAISE EXCEPTION 'Approval survived failed audit insert';
  END IF;
END;
$approval_rollback$;
RESET ROLE;
DROP TRIGGER rubi_qa_reject_approval_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_approval_audit();

RESET ROLE;
ROLLBACK;
\echo 'PASS: pause, creation, plan and approval RPC grants, authorization, state validation and atomic audit rollback/success.'
