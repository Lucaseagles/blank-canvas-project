
-- product_relationships
DROP POLICY IF EXISTS "Everyone can view relationships" ON public.product_relationships;
CREATE POLICY "Relationships of active products are readable"
ON public.product_relationships FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_relationships.product_id AND p.status = 'active')
  AND EXISTS (SELECT 1 FROM public.products r WHERE r.id = product_relationships.related_product_id AND r.status = 'active')
);

-- category_highlights
DROP POLICY IF EXISTS "Everyone can read category highlights" ON public.category_highlights;
CREATE POLICY "Highlights of active products are readable"
ON public.category_highlights FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = category_highlights.product_id AND p.status = 'active'));

-- bundle_products
DROP POLICY IF EXISTS "Everyone can view bundle items" ON public.bundle_products;
CREATE POLICY "Items of active bundles are readable"
ON public.bundle_products FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_products.bundle_id AND b.is_active));

-- price_history
DROP POLICY IF EXISTS "Allow anon read of price history" ON public.price_history;
DROP POLICY IF EXISTS "Allow read of price history" ON public.price_history;
CREATE POLICY "Price history of active products is readable"
ON public.price_history FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = price_history.product_id AND p.status = 'active'));

-- offer_groups
DROP POLICY IF EXISTS "Public can read offer groups" ON public.offer_groups;
CREATE POLICY "Offer groups with active products are readable"
ON public.offer_groups FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.offer_group_id = offer_groups.id AND p.status = 'active'));

-- marketplaces (column grants already restrict to public columns)
DROP POLICY IF EXISTS "Public can read marketplace public columns" ON public.marketplaces;
CREATE POLICY "Active marketplaces are readable"
ON public.marketplaces FOR SELECT TO anon, authenticated
USING (status = 'active');

-- reference/config tables: server-side reads only
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
REVOKE ALL ON public.badges FROM anon, authenticated;
GRANT ALL ON public.badges TO service_role;

DROP POLICY IF EXISTS "Anyone authenticated can view milestones" ON public.referral_milestones;
REVOKE ALL ON public.referral_milestones FROM anon, authenticated;
GRANT ALL ON public.referral_milestones TO service_role;

DROP POLICY IF EXISTS "Authenticated users can read feed mix config" ON public.feed_mix_config;
