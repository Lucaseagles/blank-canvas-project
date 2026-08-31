-- Sprint 25 Part 1: strategic popups using real catalog, relationships and analytics only.
-- No stock claims, no synthetic events, no purchase claims.

ALTER TABLE public.bundles
  ADD COLUMN IF NOT EXISTS bundle_discount_price numeric;

CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle_product
  ON public.bundle_products(bundle_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_relationships_product_type
  ON public.product_relationships(product_id, type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_type_created
  ON public.analytics_events(product_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popup_events_rule_user_type_created
  ON public.popup_events(popup_rule_id, user_id, event_type, created_at DESC);

-- Idempotently register the three strategic popup rules. Their eligibility is
-- computed server-side; content is populated by get_eligible_strategic_popup.
INSERT INTO public.popup_rules
  (name, trigger_type, conditions, priority, cooldown_minutes, frequency_cap_per_day, content, cta_label, cta_target, is_active)
VALUES
  ('Kit / Combo Personalizado', 'STRATEGIC_BUNDLE', '{"strategy":"bundle"}'::jsonb, 80, 240, 2, '{"strategy":"bundle"}'::jsonb, 'Ver kit', NULL, true),
  ('Oferta Relâmpago Personalizada', 'STRATEGIC_FLASH_DEAL', '{"strategy":"flash_deal"}'::jsonb, 85, 180, 3, '{"strategy":"flash_deal"}'::jsonb, 'Ver oferta', NULL, true),
  ('Upsell Inteligente', 'STRATEGIC_UPSELL', '{"strategy":"upsell"}'::jsonb, 75, 360, 2, '{"strategy":"upsell"}'::jsonb, 'Ver opção premium', NULL, true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_eligible_strategic_popup(p_user_id uuid)
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
  v_now timestamptz := now();
  v_user uuid := COALESCE(p_user_id, auth.uid());
  v_min_events integer := 5;
  v_rule record;
  v_product record;
  v_bundle record;
  v_base record;
  v_up record;
  v_sum numeric;
  v_views bigint;
  v_total_clicks bigint;
  v_upsell_clicks bigint;
  v_affinity numeric;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;

  SELECT COALESCE(min_events_for_counter, 5) INTO v_min_events
  FROM public.social_proof_config LIMIT 1;

  -- 1) Bundle: recently shown/favorited product with an active bundle.
  SELECT r.* INTO v_bundle
  FROM public.bundles r
  WHERE r.is_active
    AND EXISTS (
      SELECT 1
      FROM public.bundle_products bp
      JOIN public.recently_shown rs ON rs.product_id = bp.product_id AND rs.user_id = v_user
      WHERE bp.bundle_id = r.id
        AND rs.shown_at >= v_now - interval '7 days'
    )
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_bundle.id IS NOT NULL THEN
    SELECT COALESCE(SUM(p.current_price),0) INTO v_sum
    FROM public.bundle_products bp JOIN public.products p ON p.id=bp.product_id
    WHERE bp.bundle_id=v_bundle.id AND p.status='active';

    SELECT count(*) INTO v_views
    FROM public.analytics_events ae
    JOIN public.bundle_products bp ON bp.product_id=ae.product_id
    WHERE bp.bundle_id=v_bundle.id AND ae.event_type='PRODUCT_VIEW'
      AND ae.created_at >= v_now - interval '24 hours';

    IF v_views >= v_min_events THEN
      SELECT affinity_score INTO v_affinity
      FROM public.content_affinity_log
      WHERE content_id = (SELECT product_id FROM public.bundle_products WHERE bundle_id=v_bundle.id ORDER BY position LIMIT 1)
        AND user_id=v_user ORDER BY created_at DESC LIMIT 1;

      SELECT id,name,priority,cooldown_minutes INTO v_rule
      FROM public.popup_rules WHERE trigger_type='STRATEGIC_BUNDLE' AND is_active LIMIT 1;

      IF v_rule.id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.popup_events pe
        WHERE pe.popup_rule_id=v_rule.id AND pe.user_id=v_user AND pe.event_type='view'
          AND pe.created_at >= current_date
      ) THEN
        RETURN QUERY SELECT v_rule.id,v_rule.name,v_rule.priority,
          jsonb_build_object('strategy','bundle','bundle_id',v_bundle.id,'title',v_bundle.title,
            'description',v_bundle.description,'image_url',v_bundle.image_url,
            'bundle_discount_price',CASE WHEN v_bundle.bundle_discount_price IS NOT NULL AND v_bundle.bundle_discount_price < v_sum THEN v_bundle.bundle_discount_price END,
            'sum_price',v_sum,'view_count',v_views,'affinity_score',v_affinity),
          'Ver kit', '/bundle/'||v_bundle.slug, v_rule.cooldown_minutes;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- 2) Flash deal: a product actually viewed by the user, with a real active end time.
  SELECT p.* INTO v_product
  FROM public.products p
  WHERE p.status='active' AND p.flash_deal_ends_at > v_now
    AND p.discount IS NOT NULL AND p.discount > 0
    AND EXISTS (
      SELECT 1 FROM public.recently_shown rs
      WHERE rs.product_id=p.id AND rs.user_id=v_user AND rs.shown_at >= v_now - interval '7 days'
    )
  ORDER BY p.demand_score DESC NULLS LAST, p.flash_deal_ends_at ASC
  LIMIT 1;

  IF v_product.id IS NOT NULL THEN
    SELECT affinity_score INTO v_affinity
    FROM public.content_affinity_log WHERE content_id=v_product.id AND user_id=v_user
    ORDER BY created_at DESC LIMIT 1;
    SELECT id,name,priority,cooldown_minutes INTO v_rule
    FROM public.popup_rules WHERE trigger_type='STRATEGIC_FLASH_DEAL' AND is_active LIMIT 1;
    IF v_rule.id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.popup_events pe WHERE pe.popup_rule_id=v_rule.id AND pe.user_id=v_user
        AND pe.event_type='view' AND pe.created_at >= current_date
    ) THEN
      RETURN QUERY SELECT v_rule.id,v_rule.name,v_rule.priority,
        jsonb_build_object('strategy','flash_deal','product_id',v_product.id,'title',v_product.title,
          'image_url',v_product.images[1],'current_price',v_product.current_price,
          'previous_price',v_product.previous_price,'discount',v_product.discount,
          'ends_at',v_product.flash_deal_ends_at,'affinity_score',v_affinity),
        'Ver oferta', '/product/'||v_product.slug, v_rule.cooldown_minutes;
      RETURN;
    END IF;
  END IF;

  -- 3) Upsell: recently shown base product with a real UPSELL relationship.
  SELECT p.*, pr.related_product_id INTO v_base
  FROM public.product_relationships pr
  JOIN public.products p ON p.id=pr.product_id
  WHERE pr.type='UPSELL' AND p.status='active'
    AND EXISTS (SELECT 1 FROM public.recently_shown rs WHERE rs.product_id=p.id AND rs.user_id=v_user AND rs.shown_at>=v_now-interval '7 days')
  ORDER BY p.demand_score DESC NULLS LAST, p.updated_at DESC LIMIT 1;

  IF v_base.id IS NOT NULL THEN
    SELECT * INTO v_up FROM public.products WHERE id=v_base.related_product_id AND status='active';
    IF v_up.id IS NOT NULL AND v_up.current_price IS NOT NULL AND v_base.current_price IS NOT NULL AND v_up.current_price > v_base.current_price THEN
      SELECT count(*) FILTER (WHERE ae.product_id IN (v_base.id,v_up.id)),
             count(*) FILTER (WHERE ae.product_id=v_up.id)
      INTO v_total_clicks,v_upsell_clicks
      FROM public.analytics_events ae
      WHERE ae.event_type='OUTBOUND_CLICK' AND ae.product_id IN (v_base.id,v_up.id)
        AND ae.created_at >= v_now - interval '90 days';

      SELECT affinity_score INTO v_affinity FROM public.content_affinity_log
      WHERE content_id=v_base.id AND user_id=v_user ORDER BY created_at DESC LIMIT 1;
      SELECT id,name,priority,cooldown_minutes INTO v_rule FROM public.popup_rules WHERE trigger_type='STRATEGIC_UPSELL' AND is_active LIMIT 1;
      IF v_rule.id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.popup_events pe WHERE pe.popup_rule_id=v_rule.id AND pe.user_id=v_user AND pe.event_type='view' AND pe.created_at>=current_date
      ) THEN
        RETURN QUERY SELECT v_rule.id,v_rule.name,v_rule.priority,
          jsonb_build_object('strategy','upsell','base_product_id',v_base.id,'base_title',v_base.title,
            'base_price',v_base.current_price,'upsell_product_id',v_up.id,'upsell_title',v_up.title,
            'upsell_price',v_up.current_price,'price_difference',v_up.current_price-v_base.current_price,
            'image_url',v_up.images[1],'affinity_score',v_affinity,
            'choice_rate',CASE WHEN v_total_clicks >= 20 THEN round((v_upsell_clicks::numeric/v_total_clicks::numeric)*100,1) END,
            'choice_sample_size',v_total_clicks),
          'Ver opção premium', '/product/'||v_up.slug, v_rule.cooldown_minutes;
        RETURN;
      END IF;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_eligible_strategic_popup(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eligible_strategic_popup(uuid) TO authenticated;
