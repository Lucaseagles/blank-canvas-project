-- Seed test relationships
INSERT INTO public.product_relationships (product_id, related_product_id, type)
VALUES 
  ('753106af-e7d3-4e85-98c3-ba062b15aeab', '00ddb01a-ab18-40d5-a83e-814a39a00e4e', 'CROSS_SELL'),
  ('753106af-e7d3-4e85-98c3-ba062b15aeab', 'efbd7514-c33d-4af9-9779-ffa1b46650cb', 'UPSELL'),
  ('00ddb01a-ab18-40d5-a83e-814a39a00e4e', 'af4b7d7b-ebff-4d2a-b77f-e9bef7f1b0ff', 'DOWNSELL')
ON CONFLICT DO NOTHING;

-- Seed test bundle
INSERT INTO public.bundles (slug, title, description, is_active)
VALUES ('ergonomic-setup', 'Ultimate Ergonomic Setup', 'Everything you need for a premium workspace.', true)
ON CONFLICT (slug) DO NOTHING;

-- Relate products to bundle
INSERT INTO public.bundle_products (bundle_id, product_id, position)
SELECT b.id, p.id, 1
FROM public.bundles b, public.products p
WHERE b.slug = 'ergonomic-setup' AND p.slug = 'ergonomic-chair-mesh'
ON CONFLICT DO NOTHING;
