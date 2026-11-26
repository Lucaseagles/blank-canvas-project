-- Keep personal history readable without exposing another user's events.
-- Tighten table privileges; RLS remains the row-level boundary.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own events" ON public.analytics_events;
CREATE POLICY "Users can view their own events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Replace historical broad grants with the minimum privileges required by
-- the canonical client writer, authenticated personal history, and server jobs.
REVOKE ALL PRIVILEGES ON TABLE public.analytics_events FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.analytics_events TO anon;
GRANT SELECT, INSERT ON TABLE public.analytics_events TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.analytics_events TO service_role;

-- Reassert the intended INSERT boundaries. These policies are additive under
-- PostgreSQL RLS, so remove permissive historical aliases before recreating.
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anonymous events must be unattributed" ON public.analytics_events;

CREATE POLICY "Users can insert their own events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous events must be unattributed"
  ON public.analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
