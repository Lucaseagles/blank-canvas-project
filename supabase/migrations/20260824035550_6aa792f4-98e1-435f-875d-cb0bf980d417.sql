-- 1. Function search path
CREATE OR REPLACE FUNCTION public.check_campaign_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.starts_at <= NOW() AND NEW.ends_at >= NOW() AND NEW.status = 'scheduled' THEN
        NEW.status := 'active';
    ELSIF NEW.ends_at < NOW() AND NEW.status = 'active' THEN
        NEW.status := 'ended';
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. Lock down SECURITY DEFINER functions that must not be callable from the API
REVOKE ALL ON FUNCTION public.get_campaign_funnel(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_daily_clicks(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_daily_user_growth(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_automation_activity(uuid, jsonb, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_campaign_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_funnel(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_clicks(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_user_growth(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_automation_activity(uuid, jsonb, text, text) TO service_role;

-- has_role must stay callable by signed-in users (used inside RLS policies), but anon never needs it
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 3. Marketplaces: hide api_config / api_status from public + authenticated reads
REVOKE SELECT ON public.marketplaces FROM anon, authenticated;
GRANT SELECT (id, name, slug, status, created_at) ON public.marketplaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplaces TO authenticated;
GRANT ALL ON public.marketplaces TO service_role;

-- 4. Campaign channels: hide config from reads
REVOKE SELECT ON public.campaign_channels FROM anon, authenticated;
GRANT SELECT (id, campaign_id, channel, is_enabled) ON public.campaign_channels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campaign_channels TO authenticated;
GRANT ALL ON public.campaign_channels TO service_role;

-- 5. Profiles: prevent self privilege escalation via the role column
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, location_city, location_state, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;