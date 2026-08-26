-- Create feed_mix_config table
CREATE TABLE public.feed_mix_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    relevant_pct integer NOT NULL DEFAULT 70,
    related_pct integer NOT NULL DEFAULT 20,
    discovery_pct integer NOT NULL DEFAULT 10,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT total_pct CHECK (relevant_pct + related_pct + discovery_pct = 100)
);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.feed_mix_config TO authenticated;
GRANT ALL ON public.feed_mix_config TO service_role;

-- Enable RLS
ALTER TABLE public.feed_mix_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role or owner can modify, authenticated can read
CREATE POLICY "Admins can manage feed mix config" ON public.feed_mix_config
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Authenticated users can read feed mix config" ON public.feed_mix_config
    FOR SELECT TO authenticated USING (true);

-- Seed initial config
INSERT INTO public.feed_mix_config (relevant_pct, related_pct, discovery_pct)
VALUES (70, 20, 10);

-- Create recently_shown table
CREATE TABLE public.recently_shown (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    shown_at timestamptz DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT ON public.recently_shown TO authenticated;
GRANT ALL ON public.recently_shown TO service_role;

-- Enable RLS
ALTER TABLE public.recently_shown ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own history
CREATE POLICY "Users can manage their shown history" ON public.recently_shown
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Cleanup function for old history (last 24h)
CREATE OR REPLACE FUNCTION public.cleanup_recently_shown()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.recently_shown WHERE shown_at < now() - interval '24 hours';
END;
$$;
