-- Final check on price_alerts and notifications RLS

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.price_alerts;
CREATE POLICY "Users can manage their own alerts" ON public.price_alerts
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.price_alerts TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Also ensuring profiles are viewable for the seed to find the user_id
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
