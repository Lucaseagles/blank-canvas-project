-- Restore the Master-managed badge configuration contract before Sprint 185
-- installs its atomic audited update function.
CREATE TABLE IF NOT EXISTS public.badges_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text NOT NULL UNIQUE,
  badge_name text NOT NULL,
  badge_text text NOT NULL,
  icon text,
  color text,
  threshold jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges_config ENABLE ROW LEVEL SECURITY;

-- Badge configuration is currently read and written through owner-guarded
-- server functions using the service role. Do not expose direct table access.
REVOKE ALL ON TABLE public.badges_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.badges_config TO service_role;

CREATE INDEX IF NOT EXISTS badges_config_enabled_name_idx
  ON public.badges_config (is_enabled, badge_name);

COMMENT ON TABLE public.badges_config IS
  'Master-managed badge presentation and threshold configuration; accessed through owner-guarded server functions.';
COMMENT ON COLUMN public.badges_config.threshold IS
  'JSON threshold rules interpreted by the application; no credentials or private tokens.';
