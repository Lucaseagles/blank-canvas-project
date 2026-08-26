DROP POLICY IF EXISTS "Everyone can view bundle items" ON public.bundle_products;
CREATE POLICY "Everyone can view active bundle items"
ON public.bundle_products FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_products.bundle_id AND b.is_active = true)
);

DROP POLICY IF EXISTS "Everyone can view relationships" ON public.product_relationships;
CREATE POLICY "Everyone can view active relationships"
ON public.product_relationships FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_relationships.product_id AND p.status = 'active')
  AND EXISTS (SELECT 1 FROM public.products rp WHERE rp.id = product_relationships.related_product_id AND rp.status = 'active')
);