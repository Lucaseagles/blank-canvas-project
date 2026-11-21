-- Restore the canonical social-proof settings table before migrations that extend it.
-- The later 20260826054406 migration remains responsible for the legacy access policy
-- declarations and other unrelated referral/notification objects.
CREATE TABLE IF NOT EXISTS public.social_proof_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  hybrid_simulation_enabled boolean NOT NULL DEFAULT false,
  show_location boolean NOT NULL DEFAULT false,
  simulated_volume_boost integer NOT NULL DEFAULT 0,
  show_aggregated_counters boolean NOT NULL DEFAULT false,
  min_events_for_counter integer NOT NULL DEFAULT 5 CHECK (min_events_for_counter >= 1),
  counter_window_hours integer NOT NULL DEFAULT 24 CHECK (counter_window_hours BETWEEN 1 AND 168),
  allowed_event_types text[] DEFAULT ARRAY[]::text[],
  enabled_formats text[] DEFAULT ARRAY[]::text[],
  content_affinity_threshold numeric NOT NULL DEFAULT 70,
  low_volume_threshold integer NOT NULL DEFAULT 5,
  adaptive_priority_enabled boolean NOT NULL DEFAULT false,
  min_interval_seconds integer NOT NULL DEFAULT 30,
  recency_window_minutes integer NOT NULL DEFAULT 120,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_proof_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_proof_config FROM PUBLIC;
GRANT SELECT ON public.social_proof_config TO anon, authenticated;
GRANT ALL ON public.social_proof_config TO service_role;

DROP POLICY IF EXISTS "Everyone can read social proof config" ON public.social_proof_config;
CREATE POLICY "Everyone can read social proof config"
  ON public.social_proof_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage social proof config" ON public.social_proof_config;
CREATE POLICY "Admins manage social proof config"
  ON public.social_proof_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

INSERT INTO public.social_proof_config (is_enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.social_proof_config);
