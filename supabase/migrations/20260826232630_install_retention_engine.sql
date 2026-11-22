-- Restore the retention RPC that is called by the owner-only server action
-- and whose EXECUTE privileges are hardened by the next historical migration.
-- This implementation preserves the existing notification model while also
-- honoring each user's retention opt-out and configured frequency cap.
CREATE OR REPLACE FUNCTION public.run_retention_engine(_inactive_days integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_rule_id uuid;
  v_count integer := 0;
  v_user record;
  v_category_id uuid;
  v_product_id uuid;
  v_product_title text;
BEGIN
  SELECT r.id
    INTO v_rule_id
    FROM public.automation_rules AS r
   WHERE r.name = 'Retention Sentinel'
     AND r.is_active = true
   ORDER BY r.created_at, r.id
   LIMIT 1;

  IF v_rule_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_user IN
    SELECT u.id AS user_id,
           greatest(1, least(coalesce(np.frequency_cap_days, 1), 90)) AS frequency_cap_days
      FROM auth.users AS u
      LEFT JOIN public.notification_preferences AS np
        ON np.user_id = u.id
     WHERE u.deleted_at IS NULL
       AND u.last_sign_in_at IS NOT NULL
       AND u.last_sign_in_at < now() - make_interval(days => greatest(1, least(coalesce(_inactive_days, 3), 90)))
       AND coalesce(np.retention_enabled, true) = true
       AND NOT EXISTS (
         SELECT 1
           FROM public.notifications AS n
          WHERE n.user_id = u.id
            AND n.type = 'retention'
            AND n.created_at > now() - make_interval(days => greatest(1, least(coalesce(np.frequency_cap_days, 1), 90)))
       )
     ORDER BY u.last_sign_in_at, u.id
  LOOP
    -- Prevent concurrent invocations from queuing duplicate retention notices
    -- for the same user in the same transaction.
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_user.user_id::text, 0)
    );

    -- Re-check after acquiring the per-user lock.
    IF EXISTS (
      SELECT 1
        FROM public.notifications AS n
       WHERE n.user_id = v_user.user_id
         AND n.type = 'retention'
         AND n.created_at > now() - make_interval(days => v_user.frequency_cap_days)
    ) THEN
      CONTINUE;
    END IF;

    SELECT ui.category_id
      INTO v_category_id
      FROM public.user_interests AS ui
     WHERE ui.user_id = v_user.user_id
     ORDER BY ui.score DESC, ui.updated_at DESC
     LIMIT 1;

    SELECT p.id, p.title
      INTO v_product_id, v_product_title
      FROM public.products AS p
     WHERE (v_category_id IS NULL OR p.category_id = v_category_id)
       AND p.status IN ('active', 'published')
     ORDER BY p.is_best_offer DESC NULLS LAST,
              p.offer_score DESC NULLS LAST,
              p.rating DESC NULLS LAST
     LIMIT 1;

    IF v_product_id IS NULL THEN
      SELECT p.id, p.title
        INTO v_product_id, v_product_title
        FROM public.products AS p
       WHERE p.status IN ('active', 'published')
       ORDER BY p.offer_score DESC NULLS LAST,
                p.rating DESC NULLS LAST
       LIMIT 1;
    END IF;

    IF v_product_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, product_id)
      VALUES (
        v_user.user_id,
        'retention',
        'Encontramos algo que combina com você',
        'Temos uma nova descoberta que pode interessar você: ' || v_product_title,
        v_product_id
      );

      INSERT INTO public.notification_preferences (user_id, last_retention_sent_at)
      VALUES (v_user.user_id, now())
      ON CONFLICT (user_id) DO UPDATE
        SET last_retention_sent_at = EXCLUDED.last_retention_sent_at,
            updated_at = now();

      v_count := v_count + 1;
    END IF;
  END LOOP;

  PERFORM public.log_automation_activity(
    v_rule_id,
    jsonb_build_object(
      'inactive_days', greatest(1, least(coalesce(_inactive_days, 3), 90)),
      'notifications_queued', v_count
    ),
    'Retention engine processed ' || v_count || ' users',
    'success'
  );

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.run_retention_engine(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_retention_engine(integer)
  TO service_role;

COMMENT ON FUNCTION public.run_retention_engine(integer) IS
  'Queues personalized retention notifications for inactive users, honoring opt-out and per-user frequency caps. Service-role only; called by owner-guarded server logic.';
