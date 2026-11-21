-- Product relationship examples belong to isolated fixtures, not a schema migration.
-- Hard-coded product UUIDs made clean database initialization depend on deleted demo data.

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
