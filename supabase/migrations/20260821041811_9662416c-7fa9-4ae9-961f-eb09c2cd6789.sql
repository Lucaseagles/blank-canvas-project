-- Ensure parent_id exists for hierarchical categories
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parent_id') THEN
        ALTER TABLE public.categories ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS for categories to allow authenticated owners to manage
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

-- Analytics events grants
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
GRANT INSERT ON public.analytics_events TO anon;

-- Ensure owner role exists and check works
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'owner');
$$;
