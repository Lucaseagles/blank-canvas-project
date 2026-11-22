-- Restore social channel configuration consumed by storefront and Master
-- integrations, before Sprint 41 adds it to the Realtime publication.
CREATE TABLE IF NOT EXISTS public.social_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'kwai', 'telegram', 'youtube')),
  channel_name text NOT NULL CHECK (char_length(channel_name) BETWEEN 2 AND 120),
  channel_url text NOT NULL CHECK (channel_url ~* '^https://[^/@[:space:]]+(/[^[:space:]]*)?$'),
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_channels_active_platform_idx
  ON public.social_channels (is_active, platform, channel_name);

ALTER TABLE public.social_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage social channels" ON public.social_channels;
CREATE POLICY "Owners can manage social channels"
  ON public.social_channels FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ));

GRANT ALL ON public.social_channels TO service_role;
