-- Seed a test user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b',
  'admin@example.com',
  '$2a$10$wT8K8V.YQ/F.l1E/y.W0.O7R0.W0.O7R0.W0.O7R0.W0.O7R0.W0.',
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create profile
INSERT INTO public.profiles (user_id, display_name, role)
VALUES (
  'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b',
  'Admin',
  'owner'
) ON CONFLICT (user_id) DO NOTHING;

-- Grant role using 'owner' as it is the valid enum value
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b',
  'owner'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Seed some products
INSERT INTO public.products (title, slug, current_price, status, marketplace_id, category_id)
SELECT 
  'Premium Headphones', 'premium-headphones', 299.90, 'published', m.id, c.id
FROM public.marketplaces m, public.categories c
WHERE m.slug = 'amazon' AND c.slug = 'eletronicos'
LIMIT 1;

INSERT INTO public.products (title, slug, current_price, status, marketplace_id, category_id)
SELECT 
  'Mechanical Keyboard', 'mechanical-keyboard', 159.00, 'published', m.id, c.id
FROM public.marketplaces m, public.categories c
WHERE m.slug = 'amazon' AND c.slug = 'perifericos'
LIMIT 1;
