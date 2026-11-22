-- Restore the production-applied Sprint 24 content-affinity notification
-- infrastructure that was missing from the repository migration history.
-- Definitions below were reconciled against the live schema and generated types.

CREATE TABLE IF NOT EXISTS public.content_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.content_affinity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  user_id uuid NOT NULL,
  affinity_score numeric NOT NULL,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_affinity_log_content_id_user_id_key UNIQUE (content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_notification_queue_pending
  ON public.content_notification_queue(status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_content_affinity_log_content
  ON public.content_affinity_log(content_id, affinity_score DESC);

CREATE INDEX IF NOT EXISTS idx_content_affinity_log_content_user
  ON public.content_affinity_log(content_id, user_id);

CREATE INDEX IF NOT EXISTS idx_content_affinity_log_user
  ON public.content_affinity_log(user_id, created_at DESC);

ALTER TABLE public.content_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_affinity_log ENABLE ROW LEVEL SECURITY;

DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_notification_queue'
      AND policyname = 'owner manages content notification queue'
  ) THEN
    CREATE POLICY "owner manages content notification queue"
      ON public.content_notification_queue
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'owner'::public.app_role))
      WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_affinity_log'
      AND policyname = 'owner manages content affinity logs'
  ) THEN
    CREATE POLICY "owner manages content affinity logs"
      ON public.content_affinity_log
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'owner'::public.app_role))
      WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));
  END IF;
END
$policies$;

CREATE OR REPLACE FUNCTION public.calculate_content_affinity(
  p_content_id uuid,
  p_content_type text DEFAULT 'product'
)
RETURNS TABLE(user_id uuid, affinity_score numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH content AS (
    SELECT p.id, p.category_id
    FROM public.products p
    WHERE p.id = p_content_id
      AND p_content_type = 'product'
      AND p.status = 'published'
  ),
  active_users AS (
    SELECT DISTINCT ae.user_id
    FROM public.analytics_events ae
    WHERE ae.user_id IS NOT NULL
      AND ae.created_at >= now() - interval '30 minutes'
  ),
  candidates AS (
    SELECT
      au.user_id,
      GREATEST(
        LEAST(COALESCE(ui.score, 0), 100),
        CASE
          WHEN c.category_id = ANY(COALESCE(up.preferred_categories, '{}'::uuid[])) THEN 85
          ELSE 0
        END
      ) AS score
    FROM active_users au
    CROSS JOIN content c
    LEFT JOIN public.user_interests ui
      ON ui.user_id = au.user_id
     AND ui.category_id = c.category_id
    LEFT JOIN public.user_preferences up
      ON up.user_id = au.user_id
  )
  SELECT user_id, ROUND(LEAST(100, GREATEST(0, score))::numeric, 2)
  FROM candidates;
$function$;

CREATE OR REPLACE FUNCTION public.process_content_notification_queue(
  p_batch_size integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  q record;
  threshold numeric := 70;
  processed_count integer := 0;
  notified_count integer := 0;
  title text;
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
    LIMIT GREATEST(1, LEAST(COALESCE(p_batch_size,25),100))
  LOOP
    UPDATE public.content_notification_queue
      SET status='processing', error_message=NULL
      WHERE id=q.id;
    processed_count := processed_count + 1;

    BEGIN
      IF q.content_type = 'product' THEN
        SELECT p.title INTO title
        FROM public.products p
        WHERE p.id=q.content_id AND p.status='published';
        IF title IS NULL THEN RAISE EXCEPTION 'Published product not found'; END IF;

        CREATE TEMP TABLE IF NOT EXISTS tmp_content_affinity (
          user_id uuid PRIMARY KEY,
          affinity_score numeric
        ) ON COMMIT DROP;
        TRUNCATE tmp_content_affinity;
        INSERT INTO tmp_content_affinity
          SELECT a.user_id,a.affinity_score
          FROM public.calculate_content_affinity(q.content_id,q.content_type) a
          WHERE a.affinity_score >= threshold;
        GET DIAGNOSTICS eligible_rows = ROW_COUNT;
        notified_count := notified_count + eligible_rows;

        INSERT INTO public.content_affinity_log(content_id,user_id,affinity_score,notified)
        SELECT q.content_id,user_id,affinity_score,true
        FROM tmp_content_affinity
        ON CONFLICT(content_id,user_id)
        DO UPDATE SET affinity_score=excluded.affinity_score, notified=true;

        INSERT INTO public.notifications(user_id,type,title,body,product_id)
        SELECT t.user_id,'content_affinity','Novo conteúdo para você',
               'Porque você se interessou por '||title||'.',q.content_id
        FROM tmp_content_affinity t
        WHERE NOT EXISTS (
          SELECT 1 FROM public.notifications n
          WHERE n.user_id=t.user_id
            AND n.type='content_affinity'
            AND n.product_id=q.content_id
            AND n.created_at >= now()-interval '24 hours'
        );
      END IF;

      UPDATE public.content_notification_queue
        SET status='completed', processed_at=now()
        WHERE id=q.id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.content_notification_queue
        SET status='failed', processed_at=now(), error_message=left(SQLERRM,500)
        WHERE id=q.id;
    END;
  END LOOP;

  RETURN jsonb_build_object('processed',processed_count,'notified',notified_count,'threshold',threshold);
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_published_product_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status='published' AND COALESCE(OLD.status,'')<>'published' THEN
    INSERT INTO public.content_notification_queue(content_type,content_id)
    SELECT 'product',NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.content_notification_queue q
      WHERE q.content_type='product'
        AND q.content_id=NEW.id
        AND q.status IN ('pending','processing','completed')
    );

    PERFORM public.process_content_notification_queue(25);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_products_content_published ON public.products;
CREATE TRIGGER trg_products_content_published
  AFTER UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_published_product_notification();

REVOKE ALL ON FUNCTION public.calculate_content_affinity(uuid,text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_content_notification_queue(integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_published_product_notification()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_content_affinity(uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_content_notification_queue(integer) TO service_role;
