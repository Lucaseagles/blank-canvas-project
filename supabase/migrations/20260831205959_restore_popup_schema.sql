-- Restore the popup schema required by Sprint 25 and later popup analytics.
-- The generated Supabase contract and server-side usage define the canonical columns.
-- These tables are accessed through owner-guarded server functions / SECURITY DEFINER RPCs.

CREATE TABLE IF NOT EXISTS public.popup_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  audience_segment text,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 0,
  cooldown_minutes integer NOT NULL DEFAULT 0,
  frequency_cap_per_day integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_target text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.popup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_rule_id uuid NOT NULL
    REFERENCES public.popup_rules(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_rules_active_priority
  ON public.popup_rules(is_active, priority DESC);

CREATE INDEX IF NOT EXISTS idx_popup_events_rule_user_type_created
  ON public.popup_events(popup_rule_id, user_id, event_type, created_at DESC);

ALTER TABLE public.popup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.popup_rules FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.popup_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.popup_rules TO service_role;
GRANT ALL ON TABLE public.popup_events TO service_role;
