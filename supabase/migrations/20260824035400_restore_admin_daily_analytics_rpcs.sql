-- Restore admin dashboard RPCs referenced by the hardening migration and app types.
-- These aggregate existing analytics/profile data; no synthetic events are created.
CREATE OR REPLACE FUNCTION public.get_daily_clicks(start_date timestamptz)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date_trunc('day', ae.created_at)::date AS day, count(*)::bigint AS count
  FROM public.analytics_events ae
  WHERE ae.created_at >= start_date
    AND ae.event_type = 'OUTBOUND_CLICK'
  GROUP BY date_trunc('day', ae.created_at)::date
  ORDER BY day;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_user_growth(start_date timestamptz)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date_trunc('day', p.created_at)::date AS day, count(*)::bigint AS count
  FROM public.profiles p
  WHERE p.created_at >= start_date
  GROUP BY date_trunc('day', p.created_at)::date
  ORDER BY day;
$$;

REVOKE ALL ON FUNCTION public.get_daily_clicks(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_daily_user_growth(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_clicks(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_user_growth(timestamptz) TO service_role;
