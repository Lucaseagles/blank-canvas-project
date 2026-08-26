
-- Estender a tabela videos existente
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));

-- Criar tabela de associação video_products
CREATE TABLE IF NOT EXISTS public.video_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    position integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(video_id, product_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT SELECT ON public.videos TO anon;
GRANT ALL ON public.videos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_products TO authenticated;
GRANT SELECT ON public.video_products TO anon;
GRANT ALL ON public.video_products TO service_role;

-- RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_products ENABLE ROW LEVEL SECURITY;

-- Polices para videos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published videos') THEN
        CREATE POLICY "Public can view published videos" ON public.videos FOR SELECT USING (status = 'published');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all videos') THEN
        -- Corrigido para 'owner' conforme definido no Sprint 0 e na memória do projeto
        CREATE POLICY "Admins can manage all videos" ON public.videos TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view video product associations') THEN
        CREATE POLICY "Public can view video product associations" ON public.video_products FOR SELECT USING (EXISTS (SELECT 1 FROM public.videos WHERE id = video_id AND status = 'published'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage video associations') THEN
        CREATE POLICY "Admins can manage video associations" ON public.video_products TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
    END IF;
END $$;
