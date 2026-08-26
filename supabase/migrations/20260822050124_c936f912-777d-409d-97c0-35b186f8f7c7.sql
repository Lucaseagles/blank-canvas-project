-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add flash deal metadata to products
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'flash_deal_ends_at') THEN
        ALTER TABLE public.products ADD COLUMN flash_deal_ends_at TIMESTAMPTZ;
    END IF;
END $$;

-- Grants
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

GRANT UPDATE(flash_deal_ends_at) ON public.products TO authenticated;

-- RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on retry
DROP POLICY IF EXISTS "Allow public read-only access to active banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;

CREATE POLICY "Allow public read-only access to active banners"
ON public.banners FOR SELECT
TO anon, authenticated
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage banners"
ON public.banners FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Seed some categories icons
UPDATE public.categories SET icon = 'Smartphone' WHERE slug = 'smartphones';
UPDATE public.categories SET icon = 'Laptop' WHERE slug = 'laptops';
UPDATE public.categories SET icon = 'Watch' WHERE slug = 'wearables';
UPDATE public.categories SET icon = 'Gamepad' WHERE slug = 'gaming';
UPDATE public.categories SET icon = 'Headphones' WHERE slug = 'audio';

-- Seed a banner
INSERT INTO public.banners (title, image_url, link_url, starts_at, position)
VALUES ('Premium Tech Week', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop', '/deals', now(), 1);

-- Seed a flash deal
UPDATE public.products 
SET flash_deal_ends_at = now() + interval '2 hours' 
WHERE id IN (
    SELECT id FROM public.products 
    WHERE discount > 15 
    LIMIT 2
);
