-- Ensure we have products
INSERT INTO public.products (title, slug, current_price, status, marketplace_id, category_id)
SELECT 
  'Premium Headphones', 'premium-headphones-' || gen_random_uuid(), 299.90, 'published', m.id, c.id
FROM public.marketplaces m, public.categories c
WHERE m.slug = 'amazon' AND c.slug = 'eletronicos'
LIMIT 1;

INSERT INTO public.products (title, slug, current_price, status, marketplace_id, category_id)
SELECT 
  'Mechanical Keyboard', 'mechanical-keyboard-' || gen_random_uuid(), 159.00, 'published', m.id, c.id
FROM public.marketplaces m, public.categories c
WHERE m.slug = 'amazon' AND c.slug = 'perifericos'
LIMIT 1;
