-- Sprint 10 (Part 3/3): Affiliate Compliance Center

-- 1. Create compliance_rules table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    rule_key TEXT NOT NULL,
    rule_value JSONB NOT NULL DEFAULT 'true',
    is_enforced BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    source_url TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(marketplace_id, rule_key)
);

-- 2. Create compliance_audit_log table
CREATE TABLE IF NOT EXISTS public.compliance_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    rule_key TEXT NOT NULL,
    violation_detail TEXT,
    detected_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Only admins (owner role) can see and manage compliance rules
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage compliance rules') THEN
        CREATE POLICY "Admins can manage compliance rules"
            ON public.compliance_rules
            FOR ALL
            TO authenticated
            USING (public.has_role(auth.uid(), 'owner'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view compliance audit logs') THEN
        CREATE POLICY "Admins can view compliance audit logs"
            ON public.compliance_audit_log
            FOR SELECT
            TO authenticated
            USING (public.has_role(auth.uid(), 'owner'));
    END IF;
END $$;

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_rules TO authenticated;
GRANT ALL ON public.compliance_rules TO service_role;

GRANT SELECT, INSERT ON public.compliance_audit_log TO authenticated;
GRANT ALL ON public.compliance_audit_log TO service_role;
