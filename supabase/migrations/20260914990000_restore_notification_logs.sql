-- Restore the notification delivery history expected by the generated schema
-- and the Master notification dashboard. Delivery writes remain server-only.
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_logs_created_at_status_idx
  ON public.notification_logs (created_at DESC, status);
CREATE INDEX IF NOT EXISTS notification_logs_user_type_created_idx
  ON public.notification_logs (user_id, type, created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.notification_logs TO authenticated;
GRANT ALL ON TABLE public.notification_logs TO service_role;

DROP POLICY IF EXISTS "Master can read notification history" ON public.notification_logs;
CREATE POLICY "Master can read notification history"
  ON public.notification_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

COMMENT ON TABLE public.notification_logs IS
  'Server-written notification delivery history; readable only by authorized Master/admin users.';
COMMENT ON COLUMN public.notification_logs.payload IS
  'Notification payload metadata. Do not store provider secrets or access tokens here.';
