-- Sprint 25 Part 2: benefit popups with real lastro only.
-- Coupons are capability-gated; rewards read existing real point transactions;
-- gifts are shown only when an admin curates a real marketplace promotion.

CREATE TABLE IF NOT EXISTS public.coupon_capability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  supports_exclusive_coupon boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (marketplace_id)
);

ALTER TABLE public.offer_groups
  ADD COLUMN IF NOT EXISTS real_gift_offer_description text;

CREATE INDEX IF NOT EXISTS idx_coupon_capability_marketplace_active
  ON public.coupon_capability(marketplace_id, supports_exclusive_coupon);

ALTER TABLE public.coupon_capability ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coupon_capability FROM PUBLIC;
GRANT SELECT ON public.coupon_capability TO authenticated;
GRANT ALL ON public.coupon_capability TO service_role;

DROP POLICY IF EXISTS "Owners manage coupon capability" ON public.coupon_capability;
CREATE POLICY "Owners manage coupon capability"
  ON public.coupon_capability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Returns only an already-earned real reward. It never creates a transaction.
CREATE OR REPLACE FUNCTION public.get_eligible_benefit_popup(p_user_id uuid)
RETURNS TABLE(
  rule_id uuid,
  name text,
  priority integer,
  content jsonb,
  cta_label text,
  cta_target text,
  cooldown_minutes integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := COALESCE(p_user_id, auth.uid());
  v_rule record;
  v_tx record;
  v_gift record;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;

  -- Real gamification reward: display a recent positive transaction.
  SELECT pt.* INTO v_tx
  FROM public.point_transactions pt
  WHERE pt.user_id = v_user AND pt.points > 0
  ORDER BY pt.created_at DESC
  LIMIT 1;

  IF v_tx.id IS NOT NULL THEN
    SELECT id,name,priority,cooldown_minutes INTO v_rule
    FROM public.popup_rules
    WHERE trigger_type='STRATEGIC_REWARD' AND is_active
    LIMIT 1;

    IF v_rule.id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.popup_events pe
      WHERE pe.popup_rule_id=v_rule.id AND pe.user_id=v_user
        AND pe.event_type='view' AND pe.created_at >= current_date
    ) THEN
      RETURN QUERY SELECT v_rule.id,v_rule.name,v_rule.priority,
        jsonb_build_object(
          'strategy','reward',
          'points',v_tx.points,
          'reason',v_tx.reason,
          'transaction_id',v_tx.id,
          'earned_at',v_tx.created_at
        ),
        'Ver conquistas','/profile',v_rule.cooldown_minutes;
      RETURN;
    END IF;
  END IF;

  -- Real marketplace gift promotion curated by owner/admin. No invented benefit.
  SELECT og.* INTO v_gift
  FROM public.offer_groups og
  WHERE og.real_gift_offer_description IS NOT NULL
    AND btrim(og.real_gift_offer_description) <> ''
  ORDER BY og.updated_at DESC NULLS LAST, og.created_at DESC
  LIMIT 1;

  IF v_gift.id IS NOT NULL THEN
    SELECT id,name,priority,cooldown_minutes INTO v_rule
    FROM public.popup_rules
    WHERE trigger_type='STRATEGIC_GIFT' AND is_active
    LIMIT 1;

    IF v_rule.id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.popup_events pe
      WHERE pe.popup_rule_id=v_rule.id AND pe.user_id=v_user
        AND pe.event_type='view' AND pe.created_at >= current_date
    ) THEN
      RETURN QUERY SELECT v_rule.id,v_rule.name,v_rule.priority,
        jsonb_build_object(
          'strategy','gift',
          'offer_group_id',v_gift.id,
          'gift_description',v_gift.real_gift_offer_description
        ),
        'Ver oferta',NULL,v_rule.cooldown_minutes;
      RETURN;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_eligible_benefit_popup(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eligible_benefit_popup(uuid) TO authenticated;

INSERT INTO public.popup_rules
  (name, trigger_type, conditions, priority, cooldown_minutes, frequency_cap_per_day, content, cta_label, cta_target, is_active)
VALUES
  ('Recompensa de pontos', 'STRATEGIC_REWARD', '{"strategy":"reward"}'::jsonb, 70, 1440, 1, '{"strategy":"reward"}'::jsonb, 'Ver conquistas', '/profile', true),
  ('Brinde de oferta real', 'STRATEGIC_GIFT', '{"strategy":"gift"}'::jsonb, 72, 1440, 1, '{"strategy":"gift"}'::jsonb, 'Ver oferta', NULL, true)
ON CONFLICT DO NOTHING;

-- Coupon popup remains unavailable until BOTH capability and real integration exist.
INSERT INTO public.popup_rules
  (name, trigger_type, conditions, priority, cooldown_minutes, frequency_cap_per_day, content, cta_label, cta_target, is_active)
VALUES
  ('Cupom exclusivo — aguardando integração real', 'STRATEGIC_COUPON', '{"strategy":"coupon"}'::jsonb, 60, 1440, 1, '{"strategy":"coupon"}'::jsonb, 'Ver cupom', NULL, false)
ON CONFLICT DO NOTHING;
