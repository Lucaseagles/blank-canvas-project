-- Restore the bridge_videos table required by the storefront, owner tools,
-- generated Supabase contract, and the following Sprint 41 realtime migration.
CREATE TABLE IF NOT EXISTS public.bridge_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  thumbnail text,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'shopee', 'ml', 'youtube')),
  link text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bridge_videos_active_created_idx
  ON public.bridge_videos (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS bridge_videos_product_id_idx
  ON public.bridge_videos (product_id);

ALTER TABLE public.bridge_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active bridge videos" ON public.bridge_videos;
CREATE POLICY "Public can view active bridge videos"
  ON public.bridge_videos FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage bridge videos" ON public.bridge_videos;
CREATE POLICY "Owners can manage bridge videos"
  ON public.bridge_videos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ));

GRANT SELECT ON public.bridge_videos TO anon, authenticated;
GRANT ALL ON public.bridge_videos TO service_role;
