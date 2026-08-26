-- Final manual seed for problematic tables
INSERT INTO public.price_alerts (user_id, product_id, target_price, is_active)
SELECT 'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b', id, 100, true
FROM public.products
LIMIT 2
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, title, body, read)
VALUES 
('d41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b', 'price_drop', 'Price Drop Alert', 'A product you monitor dropped in price!', false),
('d41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b', 'welcome', 'Protocol Initialized', 'Welcome to the intelligence network.', true);
