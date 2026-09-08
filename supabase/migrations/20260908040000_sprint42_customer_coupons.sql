-- Sprint 42 Part 2 — customer coupon wallet
CREATE TABLE IF NOT EXISTS public.customer_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE RESTRICT, code TEXT NOT NULL, description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')), discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(), valid_until TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT TRUE, is_real BOOLEAN NOT NULL DEFAULT TRUE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0), used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_coupons_valid_window CHECK (valid_until IS NULL OR valid_until >= valid_from), CONSTRAINT customer_coupons_usage_limit CHECK (max_uses IS NULL OR used_count <= max_uses)
);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_active ON public.customer_coupons(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_marketplace ON public.customer_coupons(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_product ON public.customer_coupons(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_category ON public.customer_coupons(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_coupons_marketplace_code ON public.customer_coupons(marketplace_id, lower(code));
ALTER TABLE public.customer_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_coupons_public_select" ON public.customer_coupons;
DROP POLICY IF EXISTS "customer_coupons_admin_select" ON public.customer_coupons;
DROP POLICY IF EXISTS "customer_coupons_owner_insert" ON public.customer_coupons;
DROP POLICY IF EXISTS "customer_coupons_owner_update" ON public.customer_coupons;
DROP POLICY IF EXISTS "customer_coupons_owner_delete" ON public.customer_coupons;
CREATE POLICY "customer_coupons_public_select" ON public.customer_coupons FOR SELECT TO anon, authenticated USING (is_active AND is_real AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()) AND (max_uses IS NULL OR used_count < max_uses));
CREATE POLICY "customer_coupons_admin_select" ON public.customer_coupons FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "customer_coupons_owner_insert" ON public.customer_coupons FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "customer_coupons_owner_update" ON public.customer_coupons FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "customer_coupons_owner_delete" ON public.customer_coupons FOR DELETE TO authenticated USING ((SELECT public.is_admin()));
CREATE OR REPLACE FUNCTION public.customer_coupons_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS customer_coupons_set_updated_at ON public.customer_coupons;
CREATE TRIGGER customer_coupons_set_updated_at BEFORE UPDATE ON public.customer_coupons FOR EACH ROW EXECUTE FUNCTION public.customer_coupons_set_updated_at();
CREATE OR REPLACE FUNCTION public.customer_coupons_enforce_real() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$ BEGIN IF NEW.is_real IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Somente cupons reais e confirmados podem ser publicados.'; END IF; NEW.code = UPPER(TRIM(NEW.code)); IF NEW.code = '' THEN RAISE EXCEPTION 'O código do cupom é obrigatório.'; END IF; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS customer_coupons_enforce_real ON public.customer_coupons;
CREATE TRIGGER customer_coupons_enforce_real BEFORE INSERT OR UPDATE ON public.customer_coupons FOR EACH ROW EXECUTE FUNCTION public.customer_coupons_enforce_real();