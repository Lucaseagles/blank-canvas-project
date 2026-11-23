-- Restore the home module configuration table consumed by Master tools
-- and required by the following Sprint 41 Realtime publication migration.
CREATE TABLE IF NOT EXISTS public.home_modules_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  module_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_modules_config_display_order_idx
  ON public.home_modules_config (display_order, id);

ALTER TABLE public.home_modules_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage home module configuration" ON public.home_modules_config;
CREATE POLICY "Owners can manage home module configuration"
  ON public.home_modules_config FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ));

GRANT ALL ON public.home_modules_config TO service_role;
