-- Sprint 306 hardening: remove attacker-precreatable temp-table dependency
-- from the privileged content notification worker.
--
-- authenticated/anon roles have TEMP privilege. The old worker used
-- CREATE TEMP TABLE IF NOT EXISTS + unqualified TRUNCATE/SELECT under
-- search_path=public, allowing a pre-existing session temp relation to shadow
-- the intended work table. Snapshot eligible users once into a local JSONB
-- value instead; no session objects or repeated affinity calculation remain.
CREATE OR REPLACE FUNCTION public.process_content_notification_queue(
  p_batch_size integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  q record;
  threshold numeric := 70;
  processed_count integer := 0;
  notified_count integer := 0;
  title text;
  eligible jsonb;
  eligible_rows integer := 0;
BEGIN
  SELECT COALESCE(content_affinity_threshold, 70)
    INTO threshold
  FROM public.social_proof_config
  ORDER BY id
  LIMIT 1;

  FOR q IN
    SELECT id, content_type, content_id
    FROM public.content_notification_queue
    WHERE status = 'pending'
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(1, LEAST(COALESCE(p_batch_size, 25), 100))
  LOOP
    UPDATE public.content_notification_queue
      SET status = 'processing', error_message = NULL
      WHERE id = q.id;
    processed_count := processed_count + 1;

    BEGIN
      IF q.content_type = 'product' THEN
        SELECT p.title
          INTO title
        FROM public.products AS p
        WHERE p.id = q.content_id
          AND p.status = 'published';

        IF title IS NULL THEN
          RAISE EXCEPTION 'Published product not found';
        END IF;

        SELECT COALESCE(
          jsonb_agg(jsonb_build_object(
            'user_id', a.user_id,
            'affinity_score', a.affinity_score
          )),
          '[]'::jsonb
        )
        INTO eligible
        FROM public.calculate_content_affinity(q.content_id, q.content_type) AS a
        WHERE a.affinity_score >= threshold;

        eligible_rows := jsonb_array_length(eligible);
        notified_count := notified_count + eligible_rows;

        INSERT INTO public.content_affinity_log (
          content_id, user_id, affinity_score, notified
        )
        SELECT
          q.content_id, x.user_id, x.affinity_score, true
        FROM jsonb_to_recordset(eligible) AS x(
          user_id uuid,
          affinity_score numeric
        )
        ON CONFLICT (content_id, user_id)
        DO UPDATE SET
          affinity_score = EXCLUDED.affinity_score,
          notified = true;

        INSERT INTO public.notifications (
          user_id, type, title, body, product_id
        )
        SELECT
          x.user_id,
          'content_affinity',
          'Novo conteúdo para você',
          'Porque você se interessou por ' || title || '.',
          q.content_id
        FROM jsonb_to_recordset(eligible) AS x(
          user_id uuid,
          affinity_score numeric
        )
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.notifications AS n
          WHERE n.user_id = x.user_id
            AND n.type = 'content_affinity'
            AND n.product_id = q.content_id
            AND n.created_at >= now() - interval '24 hours'
        );
      END IF;

      UPDATE public.content_notification_queue
        SET status = 'completed', processed_at = now()
        WHERE id = q.id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.content_notification_queue
        SET status = 'failed',
            processed_at = now(),
            error_message = left(SQLERRM, 500)
        WHERE id = q.id;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', processed_count,
    'notified', notified_count,
    'threshold', threshold
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.process_content_notification_queue(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_content_notification_queue(integer)
  TO service_role;
