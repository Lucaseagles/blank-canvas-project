-- Restore the popup event relation required by Sprint 25 and later
-- frequency/analytics queries. Keep the schema aligned with the generated
-- Supabase Database type contract and preserve server-only write access.
CREATE TABLE IF NOT EXISTS public.popup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_rule_id uuid NOT NULL
    REFERENCES public.popup_rules(id),
  user_id uuid,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_events_rule_user_type_created
  ON public.popup_events(popup_rule_id, user_id, event_type, created_at DESC);

ALTER TABLE public.popup_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.popup_events FROM PUBLIC;
REVOKE ALL ON TABLE public.popup_events FROM anon, authenticated;
GRANT ALL ON TABLE public.popup_events TO service_role;
