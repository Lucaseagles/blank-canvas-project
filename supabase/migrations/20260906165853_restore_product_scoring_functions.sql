-- Restore scoring RPCs referenced by the generated Supabase contract and
-- hardened by the following security migration.
-- All calculations read the canonical analytics_events stream and never mutate
-- source events. Functions run as the caller (SECURITY INVOKER).
CREATE OR REPLACE FUNCTION public.calculate_product_demand(p_product_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT COALESCE(SUM(CASE
    WHEN lower(event_type) IN ('purchase', 'order_completed', 'checkout_completed') THEN 10
    WHEN lower(event_type) IN ('add_to_cart', 'cart_add') THEN 4
    WHEN lower(event_type) IN ('product_click', 'click', 'select_item') THEN 2
    WHEN lower(event_type) IN ('product_view', 'view_item', 'view') THEN 1
    ELSE 0 END), 0)::numeric
  FROM public.analytics_events
  WHERE product_id = p_product_id AND created_at >= now() - interval '30 days';
$$;

CREATE OR REPLACE FUNCTION public.calculate_product_trend_velocity(p_product_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  WITH windows AS (
    SELECT
      COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::numeric AS recent,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '14 days'
                         AND created_at < now() - interval '7 days')::numeric AS previous
    FROM public.analytics_events
    WHERE product_id = p_product_id
      AND created_at >= now() - interval '14 days'
      AND lower(event_type) IN ('purchase','order_completed','checkout_completed',
        'add_to_cart','cart_add','product_click','click','select_item',
        'product_view','view_item','view')
  )
  SELECT CASE
    WHEN previous = 0 AND recent = 0 THEN 0
    WHEN previous = 0 THEN 100
    ELSE round(least(greatest(((recent - previous) / previous) * 100, -100), 1000), 2)
  END FROM windows;
$$;

CREATE OR REPLACE FUNCTION public.classify_user_segment(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT CASE
    WHEN lower(coalesce(role, '')) IN ('admin','master','super_admin','superadmin') THEN 'admin'
    WHEN lower(coalesce(role, '')) IN ('merchant','store_owner','lojista','business') THEN 'merchant'
    WHEN lower(coalesce(role, '')) IN ('partner','affiliate','influencer','parceiro') THEN 'partner'
    ELSE 'consumer'
  END
  FROM public.profiles
  WHERE user_id = p_user_id OR id = p_user_id
  ORDER BY CASE WHEN user_id = p_user_id THEN 0 ELSE 1 END
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.calculate_product_demand(uuid) IS
  'Weighted 30-day demand from canonical analytics_events; read-only scoring.';
COMMENT ON FUNCTION public.calculate_product_trend_velocity(uuid) IS
  'Seven-day event momentum versus the preceding seven days; read-only scoring.';
COMMENT ON FUNCTION public.classify_user_segment(uuid) IS
  'Maps the authenticated profile role to a stable audience segment label.';
