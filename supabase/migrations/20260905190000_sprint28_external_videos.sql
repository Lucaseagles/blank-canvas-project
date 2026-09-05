-- SPRINT 28 — Ponte de Vídeo
-- External curation only: no embeds, downloads, or external media playback.

CREATE TABLE IF NOT EXISTS public.external_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('tiktok', 'shopee_video', 'mercado_livre_video')),
  external_url text NOT NULL CHECK (length(btrim(external_url)) > 0),
  thumbnail_url text,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  description text,
  platform_icon text,
  is_active boolean NOT NULL DEFAULT true,
  view_count bigint NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  click_count bigint NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_videos_product
  ON public.external_videos(product_id);

CREATE INDEX IF NOT EXISTS idx_external_videos_platform
  ON public.external_videos(platform);

CREATE INDEX IF NOT EXISTS idx_external_videos_active_added_at
  ON public.external_videos(is_active, added_at DESC);

CREATE OR REPLACE FUNCTION public.set_external_videos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_external_videos_updated_at ON public.external_videos;
CREATE TRIGGER trg_external_videos_updated_at
BEFORE UPDATE ON public.external_videos
FOR EACH ROW
EXECUTE FUNCTION public.set_external_videos_updated_at();

ALTER TABLE public.external_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_videos_public_read_active" ON public.external_videos;
CREATE POLICY "external_videos_public_read_active"
ON public.external_videos
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "external_videos_owner_select" ON public.external_videos;
CREATE POLICY "external_videos_owner_select"
ON public.external_videos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role));

DROP POLICY IF EXISTS "external_videos_owner_insert" ON public.external_videos;
CREATE POLICY "external_videos_owner_insert"
ON public.external_videos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

DROP POLICY IF EXISTS "external_videos_owner_update" ON public.external_videos;
CREATE POLICY "external_videos_owner_update"
ON public.external_videos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

DROP POLICY IF EXISTS "external_videos_owner_delete" ON public.external_videos;
CREATE POLICY "external_videos_owner_delete"
ON public.external_videos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role));

-- Explicit grants are intentional for the current/future Supabase public-schema grant model.
GRANT SELECT ON public.external_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.external_videos TO authenticated;
GRANT ALL ON public.external_videos TO service_role;

-- Atomic counters. These functions only update the requested row and never expose table-wide write access.
CREATE OR REPLACE FUNCTION public.increment_external_video_view(video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.external_videos
  SET view_count = view_count + 1
  WHERE id = video_id
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_external_video_click(video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.external_videos
  SET click_count = click_count + 1
  WHERE id = video_id
    AND is_active = true;
$$;

REVOKE ALL ON FUNCTION public.increment_external_video_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_external_video_view(uuid) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_external_video_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_external_video_click(uuid) TO anon, authenticated, service_role;

-- Reference metadata used by the bridge UI.
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_key text UNIQUE NOT NULL,
  platform_name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_config_public_read_active" ON public.platform_config;
CREATE POLICY "platform_config_public_read_active"
ON public.platform_config
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "platform_config_owner_write" ON public.platform_config;
CREATE POLICY "platform_config_owner_write"
ON public.platform_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

GRANT SELECT ON public.platform_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_config TO authenticated;
GRANT ALL ON public.platform_config TO service_role;

INSERT INTO public.platform_config (platform_key, platform_name, icon, color)
VALUES
  ('tiktok', 'TikTok', '🎵', '#000000'),
  ('shopee_video', 'Shopee Video', '🛍️', '#EE4D2D'),
  ('mercado_livre_video', 'Mercado Livre Vídeos', '📦', '#FFE600')
ON CONFLICT (platform_key) DO UPDATE
SET platform_name = EXCLUDED.platform_name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;
