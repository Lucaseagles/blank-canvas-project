\set ON_ERROR_STOP on

-- Disposable local PostgreSQL proof for Sprint 308 Strategy Orchestration pause.
-- All fixture writes, deliberate audit failure and assertions are rolled back.

BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);

DO $grants$
BEGIN
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

DROP TRIGGER rubi_qa_reject_orchestration_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_orchestration_audit();

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

RESET ROLE;
ROLLBACK;
\echo 'PASS: pause RPC grants, non-owner rejection, invalid-state rejection, atomic audit rollback and successful audited transition.'
