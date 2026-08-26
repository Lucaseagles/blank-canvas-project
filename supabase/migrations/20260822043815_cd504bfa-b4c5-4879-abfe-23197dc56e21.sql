-- Cleanup existing data for the test user to ensure a fresh seed

DELETE FROM public.user_interests WHERE user_id = 'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b';
DELETE FROM public.favorites WHERE user_id = 'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b';
DELETE FROM public.price_alerts WHERE user_id = 'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b';
DELETE FROM public.notifications WHERE user_id = 'd41e74f8-1d2a-4a2c-b51f-5c2d3e4f5a6b';

-- Temporary GRANT to allow the client to delete (already should have it, but ensuring)
GRANT ALL ON public.user_interests TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.price_alerts TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
