
-- Ensure tables exist and add tracking-related fields/logic
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price history" ON public.price_history
    FOR SELECT TO authenticated USING (true);

-- Trigger to record price history when product price changes
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
      IF (OLD.current_price IS DISTINCT FROM NEW.current_price) THEN
          INSERT INTO public.price_history (product_id, price)
          VALUES (NEW.id, NEW.current_price);
      END IF;
    ELSIF (TG_OP = 'INSERT') THEN
      INSERT INTO public.price_history (product_id, price)
      VALUES (NEW.id, NEW.current_price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_record_price_history ON public.products;
CREATE TRIGGER tr_record_price_history
    AFTER INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION record_price_history();

-- Personalized ranking helper function
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
