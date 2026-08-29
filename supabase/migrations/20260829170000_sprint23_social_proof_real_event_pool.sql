-- Sprint 23: expand the production social-proof pool using only real events.
-- No synthetic/fictitious production users or events are inserted.

ALTER TABLE public.social_proof_config
  ADD COLUMN IF NOT EXISTS enabled_formats text[];

UPDATE public.social_proof_config
SET enabled_formats = ARRAY[
  'session','favorite','offer_click','price_alert_conversion',
  'aggregate_count','video_complete','badge_unlock','referral_activated'
]
WHERE enabled_formats IS NULL
   OR NOT ('video_complete' = ANY(enabled_formats));

ALTER TABLE public.social_proof_config
  ALTER COLUMN enabled_formats SET DEFAULT ARRAY[
    'session','favorite','offer_click','price_alert_conversion',
    'aggregate_count','video_complete','badge_unlock','referral_activated'
  ];

-- Keep the legacy simulation switch permanently disabled. Production social proof
-- remains backed by observed events only.
UPDATE public.social_proof_config
SET hybrid_simulation_enabled = false,
    simulated_volume_boost = 0;

-- Helpful indexes for the expanded real-event queries.
CREATE INDEX IF NOT EXISTS idx_analytics_events_social_proof_type_created
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at
  ON public.user_badges (earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_events_activated_created
  ON public.referral_events (status, created_at DESC)
  WHERE status = 'activated';
