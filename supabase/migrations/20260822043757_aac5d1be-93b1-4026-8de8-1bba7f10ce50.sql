-- Re-running Seeding Fixes without the missing function

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_price_history() TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
CREATE POLICY "Users can manage their own favorites" ON public.favorites
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.price_alerts;
CREATE POLICY "Users can manage their own alerts" ON public.price_alerts
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own interests" ON public.user_interests;
CREATE POLICY "Users can manage their own interests" ON public.user_interests
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own events" ON public.analytics_events;
CREATE POLICY "Users can insert their own events" ON public.analytics_events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_alerts_user_id_product_id_key') THEN
        ALTER TABLE public.price_alerts ADD CONSTRAINT price_alerts_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
END $$;
