
-- Add slug column to products if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
        ALTER TABLE public.products ADD COLUMN slug TEXT;
    END IF;
END $$;

-- Generate slugs for existing products and set NOT NULL
UPDATE public.products SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id::text WHERE slug IS NULL;
ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);

-- Drop function first because return type is changing
DROP FUNCTION IF EXISTS public.get_personalized_recommendations(uuid,integer,integer);

-- Recreate function with slug
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  description TEXT,
  current_price NUMERIC,
  previous_price NUMERIC,
  discount INT,
  images TEXT[],
  rating NUMERIC,
  review_count INT,
  category_id UUID,
  marketplace_id UUID,
  recommendation_score NUMERIC
) AS $$
DECLARE
  v_view_weight NUMERIC;
  v_click_weight NUMERIC;
BEGIN
  -- Get weights
  SELECT weight INTO v_view_weight FROM personalization_weights WHERE signal_key = 'view';
  SELECT weight INTO v_click_weight FROM personalization_weights WHERE signal_key = 'click_affiliate';

  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title, 
    p.description, 
    p.current_price, 
    p.previous_price, 
    p.discount, 
    p.images, 
    p.rating, 
    p.review_count, 
    p.category_id, 
    p.marketplace_id,
    (
      COALESCE(ui.score, 0) + 
      (COALESCE(p.rating, 0) * 10) +
      (CASE WHEN p.created_at > now() - interval '7 days' THEN 20 ELSE 0 END)
    )::NUMERIC as recommendation_score
  FROM 
    products p
  LEFT JOIN 
    user_interests ui ON ui.category_id = p.category_id AND ui.user_id = p_user_id
  WHERE 
    p.is_published = true
  ORDER BY 
    recommendation_score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Revoke execute from public/authenticated as it's a security definer
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO service_role;
