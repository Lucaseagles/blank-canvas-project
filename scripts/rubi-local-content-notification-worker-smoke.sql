\set ON_ERROR_STOP on

-- Runtime regression for the SECURITY DEFINER notification worker.
-- This runs only against the disposable local Supabase instance.
BEGIN;

CREATE TEMP TABLE rubi_worker_qa_target (
  product_id uuid PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO pg_temp.rubi_worker_qa_target(product_id)
VALUES (:'product_id'::uuid);

-- Simulate a caller-owned temp relation with the legacy worker's name.
-- The hardened worker must neither truncate nor write to it.
CREATE TEMP TABLE tmp_content_affinity (
  user_id uuid PRIMARY KEY,
  affinity_score numeric NOT NULL
) ON COMMIT DROP;

INSERT INTO pg_temp.tmp_content_affinity(user_id, affinity_score)
VALUES ('00000000-0000-4000-8000-000000000306', 99.99);

-- Force the disposable fixture product through the real publication trigger.
-- The trigger enqueues the product and invokes the SECURITY DEFINER worker.
UPDATE public.products
SET status = 'draft'
WHERE id = (SELECT product_id FROM pg_temp.rubi_worker_qa_target);

UPDATE public.products
SET status = 'published'
WHERE id = (SELECT product_id FROM pg_temp.rubi_worker_qa_target);

DO $assertions$
DECLARE
  target_product uuid;
  queue_status text;
  temp_rows integer;
  worker_oid oid;
BEGIN
  SELECT product_id INTO target_product
  FROM pg_temp.rubi_worker_qa_target;

  SELECT status INTO queue_status
  FROM public.content_notification_queue
  WHERE content_type = 'product'
    AND content_id = target_product
  ORDER BY created_at DESC
  LIMIT 1;

  IF queue_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Notification worker did not complete the fixture queue item (status=%)', queue_status;
  END IF;

  SELECT count(*) INTO temp_rows
  FROM pg_temp.tmp_content_affinity;

  IF temp_rows <> 1 OR NOT EXISTS (
    SELECT 1
    FROM pg_temp.tmp_content_affinity
    WHERE user_id = '00000000-0000-4000-8000-000000000306'
      AND affinity_score = 99.99
  ) THEN
    RAISE EXCEPTION 'Notification worker modified the caller-owned tmp_content_affinity relation';
  END IF;

  SELECT p.oid INTO worker_oid
  FROM pg_proc AS p
  WHERE p.oid = 'public.process_content_notification_queue(integer)'::regprocedure;

  IF has_function_privilege('anon', worker_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', worker_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'Notification worker is executable by anon or authenticated';
  END IF;

  IF NOT has_function_privilege('service_role', worker_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role lost EXECUTE permission on notification worker';
  END IF;
END;
$assertions$;

ROLLBACK;
