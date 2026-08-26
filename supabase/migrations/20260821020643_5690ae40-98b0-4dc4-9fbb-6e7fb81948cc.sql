-- Fix get_personalized_recommendations function to use 'status' instead of 'is_published'
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
  -- Get weights (use fallbacks if missing)
  SELECT weight INTO v_view_weight FROM personalization_weights WHERE signal_key = 'view';
  SELECT weight INTO v_click_weight FROM personalization_weights WHERE signal_key = 'click';

  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title, 
    p.description, 
    p.current_price, 
    p.previous_price, 
    p.discount::INT, 
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
    p.status = 'active'
  ORDER BY 
    recommendation_score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Seed Categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Eletrônicos', 'eletronicos', 'Zap'),
('Periféricos', 'perifericos', 'Mouse'),
('Móveis', 'moveis', 'Armchair')
ON CONFLICT (slug) DO NOTHING;

-- Seed Marketplaces
INSERT INTO public.marketplaces (name, slug, status) VALUES
('Amazon', 'amazon', 'active'),
('Mercado Livre', 'mercado-livre', 'active'),
('Shopee', 'shopee', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
DO $$
DECLARE
    cat_elec_id UUID;
    cat_peri_id UUID;
    cat_move_id UUID;
    mark_amaz_id UUID;
    mark_ml_id UUID;
    mark_shop_id UUID;
BEGIN
    SELECT id INTO cat_elec_id FROM categories WHERE slug = 'eletronicos';
    SELECT id INTO cat_peri_id FROM categories WHERE slug = 'perifericos';
    SELECT id INTO cat_move_id FROM categories WHERE slug = 'moveis';
    
    SELECT id INTO mark_amaz_id FROM marketplaces WHERE slug = 'amazon';
    SELECT id INTO mark_ml_id FROM marketplaces WHERE slug = 'mercado-livre';
    SELECT id INTO mark_shop_id FROM marketplaces WHERE slug = 'shopee';

    INSERT INTO public.products (title, description, current_price, previous_price, discount, rating, review_count, category_id, marketplace_id, affiliate_url, images, status, slug) VALUES
    ('Sony WH-1000XM5 Wireless Noise Canceling Headphones', 'Industry-leading noise cancellation with two processors controlling 8 microphones.', 1899.00, 2299.00, 17, 4.8, 1250, cat_elec_id, mark_amaz_id, 'https://amazon.com', ARRAY['https://images.unsplash.com/photo-1618366712277-7c0338a013ad?q=80&w=800&auto=format&fit=crop'], 'active', 'sony-wh-1000xm5'),
    ('Mechanical Keyboard - Custom RGB Backlit', 'High-performance mechanical switches for tactile feedback.', 450.00, 599.00, 25, 4.6, 840, cat_peri_id, mark_ml_id, 'https://mercadolivre.com.br', ARRAY['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop'], 'active', 'mechanical-keyboard-rgb'),
    ('Ergonomic Office Chair - Mesh Support', 'Breathable mesh back and adjustable lumbar support.', 1290.00, 1590.00, 18, 4.7, 2100, cat_move_id, mark_shop_id, 'https://shopee.com.br', ARRAY['https://images.unsplash.com/photo-1592078650245-662f9904d7d4?q=80&w=800&auto=format&fit=crop'], 'active', 'ergonomic-chair-mesh'),
    ('Smart Watch Series 9 - 45mm Aluminum', 'Advanced health features and faster processing.', 2899.00, 3299.00, 12, 4.9, 3400, cat_elec_id, mark_amaz_id, 'https://amazon.com', ARRAY['https://images.unsplash.com/photo-1544117518-30df578096a4?q=80&w=800&auto=format&fit=crop'], 'active', 'smart-watch-series-9')
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- Fix GRANTS
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_personalized_recommendations(UUID, INT, INT) TO anon;