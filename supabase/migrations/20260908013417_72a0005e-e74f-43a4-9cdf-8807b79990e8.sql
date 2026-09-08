ALTER FUNCTION public.track_event(text,jsonb,uuid,uuid,uuid,text,text,text) SECURITY INVOKER;
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;