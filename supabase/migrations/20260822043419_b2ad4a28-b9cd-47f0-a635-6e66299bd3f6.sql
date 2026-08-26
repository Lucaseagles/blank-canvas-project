ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products are viewable by everyone" ON public.products FOR SELECT USING (true);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
