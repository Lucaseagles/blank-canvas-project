-- Restore the social-proof settings table before the migration that extends it.
-- The canonical grants, RLS policies and default row are installed by
-- 20260826054406_cbbc3429-5be0-4564-b48a-a18869ed45d4.sql.
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
