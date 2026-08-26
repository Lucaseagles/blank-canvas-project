-- Cleanup and Hardening Migration

-- Revoke execute from public to satisfy linter
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;

-- Harden Engagement Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;

-- Ensure RLS is active and correct
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Anonymous users should only be able to see products and categories
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.marketplaces TO anon;

-- Explicit insert policies for seeding (allowing user to insert their own data)
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
