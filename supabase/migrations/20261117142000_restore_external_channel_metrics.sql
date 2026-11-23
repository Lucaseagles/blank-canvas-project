-- Restore external channel metric persistence before Sprint 228 creates
-- the atomic Telegram collection/audit function.
CREATE TABLE IF NOT EXISTS public.external_channel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.social_channels(id) ON DELETE SET NULL,
  metric_type text NOT NULL CHECK (char_length(metric_type) BETWEEN 1 AND 80),
  value integer NOT NULL CHECK (value >= 0),
  collected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS external_channel_metrics_collected_at_idx
  ON public.external_channel_metrics (collected_at DESC);

CREATE INDEX IF NOT EXISTS external_channel_metrics_channel_type_collected_idx
  ON public.external_channel_metrics (channel_id, metric_type, collected_at DESC);

ALTER TABLE public.external_channel_metrics ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.external_channel_metrics FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.external_channel_metrics TO service_role;

COMMENT ON TABLE public.external_channel_metrics IS
  'Server-written snapshots of external social-channel metrics; access is restricted to service_role.';
