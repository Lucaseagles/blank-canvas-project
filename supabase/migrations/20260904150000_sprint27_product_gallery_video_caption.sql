-- SPRINT 27 — Product Gallery, Video Captions & Standardized Ratings
-- Safe, additive migration. Existing product/review data is preserved.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS subtitle_url text,
  ADD COLUMN IF NOT EXISTS subtitle_text text;

CREATE INDEX IF NOT EXISTS idx_products_images_gin
  ON public.products USING GIN (images);

CREATE OR REPLACE FUNCTION public.get_product_with_images(_product_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  images text[],
  rating numeric,
  review_count integer,
  video_id uuid,
  video_url text,
  video_caption text,
  subtitle_url text,
  subtitle_text text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    p.id,
    p.title AS name,
    p.description,
    p.current_price AS price,
    COALESCE(p.images, '{}'::text[]) AS images,
    p.rating,
    p.review_count,
    v.id AS video_id,
    COALESCE(v.external_url, v.video_url) AS video_url,
    v.caption AS video_caption,
    v.subtitle_url,
    v.subtitle_text
  FROM public.products AS p
  LEFT JOIN LATERAL (
    SELECT vv.id, vv.external_url, vv.video_url, vv.caption, vv.subtitle_url, vv.subtitle_text
    FROM public.video_products AS vp
    JOIN public.videos AS vv ON vv.id = vp.video_id
    WHERE vp.product_id = p.id
      AND vv.status = 'published'
      AND (vv.scheduled_for IS NULL OR vv.scheduled_for <= now())
    ORDER BY vp.position NULLS LAST, vv.created_at DESC
    LIMIT 1
  ) AS v ON true
  WHERE p.id = _product_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_product_with_images(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_with_images(uuid) TO anon, authenticated;
