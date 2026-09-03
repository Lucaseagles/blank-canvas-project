-- Sprint 37: categories metadata + product filter indexes/functions.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_category_id_s37 ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_discount_s37 ON public.products(discount);
CREATE INDEX IF NOT EXISTS idx_products_rating_s37 ON public.products(rating);
CREATE INDEX IF NOT EXISTS idx_products_current_price_s37 ON public.products(current_price);
CREATE INDEX IF NOT EXISTS idx_products_marketplace_id_s37 ON public.products(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_products_free_shipping_s37 ON public.products(free_shipping);

CREATE OR REPLACE FUNCTION public.get_category_product_count(category_id UUID)
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT count(*)::BIGINT FROM public.products
  WHERE products.category_id = $1 AND products.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.get_categories_with_counts()
RETURNS TABLE(id UUID, name TEXT, slug TEXT, icon TEXT, image_url TEXT, color TEXT, product_count BIGINT, has_children BOOLEAN)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT c.id, c.name, c.slug, c.icon, c.image_url, c.color,
         count(p.id)::BIGINT,
         EXISTS (SELECT 1 FROM public.categories child WHERE child.parent_id = c.id)
  FROM public.categories c
  LEFT JOIN public.products p ON p.category_id = c.id AND p.status = 'active'
  WHERE c.parent_id IS NULL AND COALESCE(c.is_active, true) = true
  GROUP BY c.id, c.name, c.slug, c.icon, c.image_url, c.color, c.display_order
  ORDER BY c.display_order ASC, c.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_category_product_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_categories_with_counts() TO anon, authenticated;
