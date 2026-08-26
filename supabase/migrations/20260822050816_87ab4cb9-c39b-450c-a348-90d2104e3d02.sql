-- Sprint 6 Parte 2/2: Product Relationship Engine & Bundles

-- 1. Create Relationship Type Enum
DO $$ BEGIN
    CREATE TYPE public.relationship_type AS ENUM ('CROSS_SELL', 'UPSELL', 'DOWNSELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Product Relationships Table
CREATE TABLE IF NOT EXISTS public.product_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    related_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    type relationship_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, related_product_id, type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_relationships TO authenticated;
GRANT ALL ON public.product_relationships TO service_role;
GRANT SELECT ON public.product_relationships TO anon;

ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Owners can manage relationships" 
    ON public.product_relationships 
    FOR ALL 
    TO authenticated 
    USING (public.has_role(auth.uid(), 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Everyone can view relationships" 
    ON public.product_relationships 
    FOR SELECT 
    TO public 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Bundles Table
CREATE TABLE IF NOT EXISTS public.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundles TO authenticated;
GRANT ALL ON public.bundles TO service_role;
GRANT SELECT ON public.bundles TO anon;

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Owners can manage bundles" 
    ON public.bundles 
    FOR ALL 
    TO authenticated 
    USING (public.has_role(auth.uid(), 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Everyone can view active bundles" 
    ON public.bundles 
    FOR SELECT 
    TO public 
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Bundle Products (Pivot Table)
CREATE TABLE IF NOT EXISTS public.bundle_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_products TO authenticated;
GRANT ALL ON public.bundle_products TO service_role;
GRANT SELECT ON public.bundle_products TO anon;

ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Owners can manage bundle items" 
    ON public.bundle_products 
    FOR ALL 
    TO authenticated 
    USING (public.has_role(auth.uid(), 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Everyone can view bundle items" 
    ON public.bundle_products 
    FOR SELECT 
    TO public 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
