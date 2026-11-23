-- Restore the production-applied analytics event contract that was absent
-- from the repository history. Column names/types/nullability were reconciled
-- against public.analytics_events, generated Supabase types and live indexes.
-- No foreign keys are added: the verified production table has none for these
-- nullable attribution dimensions.

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS event_name text,
  ADD COLUMN IF NOT EXISTS anonymous_id text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS campaign_id uuid,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS follow_intent_platform text;

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_created_at
  ON public.analytics_events(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign_created_at
  ON public.analytics_events(campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_anonymous_session
  ON public.analytics_events(anonymous_id, session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created_at
  ON public.analytics_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name_created_at
  ON public.analytics_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata_created
  ON public.analytics_events USING gin(metadata);

CREATE INDEX IF NOT EXISTS analytics_events_follow_intent_idx
  ON public.analytics_events(event_type, follow_intent_platform)
  WHERE event_type = 'FOLLOW_CLICK';

CREATE INDEX IF NOT EXISTS analytics_events_campaign_idx
  ON public.analytics_events(campaign_id)
  WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS analytics_events_source_idx
  ON public.analytics_events(source)
  WHERE source IS NOT NULL;
