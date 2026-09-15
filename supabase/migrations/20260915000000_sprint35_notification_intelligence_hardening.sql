CREATE OR REPLACE FUNCTION public.get_notification_intelligence()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'owner'::public.app_role) AND NOT public.has_role(auth.uid(),'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  SELECT jsonb_build_object(
    'templates', (SELECT count(*) FROM public.notification_templates),
    'active_templates', (SELECT count(*) FROM public.notification_templates WHERE is_active),
    'logs_30d', (SELECT count(*) FROM public.notification_logs WHERE created_at >= now()-interval '30 days'),
    'sent_30d', (SELECT count(*) FROM public.notification_logs WHERE created_at >= now()-interval '30 days' AND status IN ('sent','delivered','success')),
    'failed_30d', (SELECT count(*) FROM public.notification_logs WHERE created_at >= now()-interval '30 days' AND status IN ('failed','error')),
    'users_with_push', (SELECT count(DISTINCT user_id) FROM public.push_subscriptions),
    'retention_enabled', (SELECT count(*) FROM public.notification_preferences WHERE retention_enabled),
    'push_enabled', (SELECT count(*) FROM public.notification_preferences WHERE push_enabled),
    'last_sent_at', (SELECT max(sent_at) FROM public.notification_logs)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_notification_intelligence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_notification_intelligence() TO authenticated;
CREATE INDEX IF NOT EXISTS notification_logs_created_at_status_idx ON public.notification_logs(created_at DESC,status);
CREATE INDEX IF NOT EXISTS notification_logs_user_type_created_idx ON public.notification_logs(user_id,type,created_at DESC);
CREATE INDEX IF NOT EXISTS notification_preferences_retention_idx ON public.notification_preferences(retention_enabled,frequency_cap_days,last_retention_sent_at);
