CREATE TABLE IF NOT EXISTS public.browsing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  device_type text,
  UNIQUE (user_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.browsing_history TO authenticated;
GRANT ALL ON public.browsing_history TO service_role;

ALTER TABLE public.browsing_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS browsing_history_user_viewed_idx ON public.browsing_history (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS browsing_history_product_idx ON public.browsing_history (product_id);

DROP POLICY IF EXISTS "Users can read own browsing history" ON public.browsing_history;
DROP POLICY IF EXISTS "Users can insert own browsing history" ON public.browsing_history;
DROP POLICY IF EXISTS "Users can update own browsing history" ON public.browsing_history;
DROP POLICY IF EXISTS "Users can delete own browsing history" ON public.browsing_history;

CREATE POLICY "Users can read own browsing history" ON public.browsing_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own browsing history" ON public.browsing_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own browsing history" ON public.browsing_history FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own browsing history" ON public.browsing_history FOR DELETE TO authenticated USING (user_id = auth.uid());