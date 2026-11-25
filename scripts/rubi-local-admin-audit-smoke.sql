\set ON_ERROR_STOP on

-- Disposable local PostgreSQL proof for Sprint 307.
-- The workflow supplies IDs created only by rubi-local-auth-fixtures.mjs.
-- All mutations and the deliberate audit failure are contained in this transaction.

BEGIN;

SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);
SELECT set_config('rubi.qa_product_id', :'product_id', true);

CREATE TEMP TABLE rubi_qa_video_ids (video_id uuid PRIMARY KEY) ON COMMIT DROP;
CREATE TEMP TABLE rubi_qa_bridge_video_ids (bridge_video_id uuid PRIMARY KEY) ON COMMIT DROP;
GRANT ALL ON TABLE pg_temp.rubi_qa_video_ids TO service_role;
GRANT ALL ON TABLE pg_temp.rubi_qa_bridge_video_ids TO service_role;

DO $grants$
BEGIN
  IF NOT has_function_privilege('service_role',
    'public.rubi_manage_video_audited(text,uuid,jsonb,jsonb,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute audited video RPC';
  END IF;
  IF has_function_privilege('anon',
    'public.rubi_manage_video_audited(text,uuid,jsonb,jsonb,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated',
    'public.rubi_manage_video_audited(text,uuid,jsonb,jsonb,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Video RPC is executable by an unprivileged API role';
  END IF;
  IF NOT has_function_privilege('service_role',
    'public.rubi_manage_bridge_video_audited(text,uuid,jsonb,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute audited bridge-video RPC';
  END IF;
  IF has_function_privilege('anon',
    'public.rubi_manage_bridge_video_audited(text,uuid,jsonb,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated',
    'public.rubi_manage_bridge_video_audited(text,uuid,jsonb,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Bridge-video RPC is executable by an unprivileged API role';
  END IF;
END;
$grants$;

-- A forced audit insert failure must abort the underlying video write.
CREATE FUNCTION pg_temp.rubi_qa_reject_audit_insert()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  RAISE EXCEPTION 'RUBI_QA_FORCED_AUDIT_FAILURE';
END;
$trigger$;

CREATE TRIGGER rubi_qa_reject_audit_insert
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_audit_insert();

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE
  test_title text := 'RUBI QA rollback ' || gen_random_uuid()::text;
BEGIN
  BEGIN
    PERFORM public.rubi_manage_video_audited(
      'save', NULL,
      jsonb_build_object('title', test_title, 'status', 'draft',
        'external_url', 'https://example.test/rubi-qa-rollback.mp4'),
      '[]'::jsonb, current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.videos WHERE title = test_title) THEN
    RAISE EXCEPTION 'Video write survived failed audit insert';
  END IF;
END;
$rollback$;
RESET ROLE;

DROP TRIGGER rubi_qa_reject_audit_insert ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_audit_insert();

-- The server-side Owner check must reject a real non-owner identity.
SET LOCAL ROLE service_role;
DO $owner$
BEGIN
  BEGIN
    PERFORM public.rubi_manage_video_audited(
      'save', NULL,
      jsonb_build_object('title', 'RUBI QA non-owner rejection', 'status', 'draft',
        'external_url', 'https://example.test/rubi-qa-denied.mp4'),
      '[]'::jsonb, current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$owner$;

-- Verify successful native video lifecycle and exactly one audit row per mutation.
INSERT INTO pg_temp.rubi_qa_video_ids
SELECT (public.rubi_manage_video_audited(
  'save', NULL,
  jsonb_build_object('title', 'RUBI QA audited native video', 'status', 'draft',
    'external_url', 'https://example.test/rubi-qa-video.mp4'),
  '[]'::jsonb, current_setting('rubi.qa_master_id')::uuid
)->>'id')::uuid;

DO $video$
DECLARE v_id uuid; result jsonb;
BEGIN
  SELECT video_id INTO STRICT v_id FROM pg_temp.rubi_qa_video_ids;
  IF NOT EXISTS (SELECT 1 FROM public.videos WHERE id = v_id) THEN
    RAISE EXCEPTION 'Native video create did not persist';
  END IF;
  result := public.rubi_manage_video_audited(
    'status', v_id, jsonb_build_object('status', 'archived'), NULL,
    current_setting('rubi.qa_master_id')::uuid
  );
  IF result->>'status' IS DISTINCT FROM 'archived' THEN
    RAISE EXCEPTION 'Native video status transition failed';
  END IF;
  PERFORM public.rubi_manage_video_audited(
    'delete', v_id, '{}'::jsonb, NULL, current_setting('rubi.qa_master_id')::uuid
  );
  IF EXISTS (SELECT 1 FROM public.videos WHERE id = v_id) THEN
    RAISE EXCEPTION 'Native video delete did not persist';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type = 'video' AND entity_id = v_id::text
      AND action_type IN ('RUBI_VIDEO_CREATED','RUBI_VIDEO_STATUS_CHANGED','RUBI_VIDEO_DELETED')) <> 3 THEN
    RAISE EXCEPTION 'Native video lifecycle did not produce exactly three audit events';
  END IF;
END;
$video$;

-- Verify bridge-video create/delete against a real seeded product.
INSERT INTO pg_temp.rubi_qa_bridge_video_ids
SELECT (public.rubi_manage_bridge_video_audited(
  'save', NULL,
  jsonb_build_object('product_id', current_setting('rubi.qa_product_id')::uuid,
    'title', 'RUBI QA audited bridge video', 'platform', 'youtube',
    'link', 'https://youtube.com/watch?v=rubi-qa-audit', 'is_active', true),
  current_setting('rubi.qa_master_id')::uuid
)->>'id')::uuid;

DO $bridge$
DECLARE v_id uuid;
BEGIN
  SELECT bridge_video_id INTO STRICT v_id FROM pg_temp.rubi_qa_bridge_video_ids;
  IF NOT EXISTS (SELECT 1 FROM public.bridge_videos WHERE id = v_id) THEN
    RAISE EXCEPTION 'Bridge-video create did not persist';
  END IF;
  PERFORM public.rubi_manage_bridge_video_audited(
    'delete', v_id, '{}'::jsonb, current_setting('rubi.qa_master_id')::uuid
  );
  IF EXISTS (SELECT 1 FROM public.bridge_videos WHERE id = v_id) THEN
    RAISE EXCEPTION 'Bridge-video delete did not persist';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type = 'bridge_video' AND entity_id = v_id::text
      AND action_type IN ('RUBI_BRIDGE_VIDEO_CREATED','RUBI_BRIDGE_VIDEO_DELETED')) <> 2 THEN
    RAISE EXCEPTION 'Bridge-video lifecycle did not produce exactly two audit events';
  END IF;
END;
$bridge$;

RESET ROLE;
ROLLBACK;

\echo 'PASS: audited RPC grants, Owner rejection, atomic audit rollback, native-video lifecycle and bridge-video lifecycle.'
