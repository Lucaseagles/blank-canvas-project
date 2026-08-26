CREATE POLICY "Anyone can insert analytics_events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert user_interests" ON public.user_interests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update their interests" ON public.user_interests FOR UPDATE USING (true);
