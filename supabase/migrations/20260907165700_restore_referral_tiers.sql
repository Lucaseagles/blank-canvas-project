-- Restore the canonical referral reward tiers consumed by the referral
-- progression service and Master CRUD before Sprint 41 enables Realtime.
CREATE TABLE IF NOT EXISTS public.referral_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL CHECK (char_length(btrim(tier_name)) BETWEEN 1 AND 120),
  tier_key text NOT NULL UNIQUE CHECK (tier_key ~ '^[a-z0-9_-]{1,80}$'),
  min_referrals integer NOT NULL CHECK (min_referrals >= 0),
  reward_description text NOT NULL CHECK (char_length(btrim(reward_description)) BETWEEN 1 AND 1000),
  badge_id uuid REFERENCES public.badges(id) ON DELETE SET NULL,
  icon text NOT NULL DEFAULT '🏅',
  color text NOT NULL DEFAULT '#6B7280',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_tiers_active_order_idx
  ON public.referral_tiers (is_active, display_order, min_referrals);

ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active referral tiers" ON public.referral_tiers;
CREATE POLICY "Anyone can read active referral tiers"
  ON public.referral_tiers FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage referral tiers" ON public.referral_tiers;
CREATE POLICY "Owners can manage referral tiers"
  ON public.referral_tiers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role::text = 'owner'
  ));

GRANT SELECT ON public.referral_tiers TO anon, authenticated;
GRANT ALL ON public.referral_tiers TO service_role;
