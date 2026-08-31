-- Sprint 24 Part 1 finalization marker and scheduler-safe helper.
-- The database-side publish trigger already drains the queue immediately when no
-- pg_cron/Edge Function scheduler is available. This migration records the
-- operational contract without adding a parallel queue infrastructure.

CREATE INDEX IF NOT EXISTS idx_content_notification_queue_status_created
  ON public.content_notification_queue(status, created_at);

CREATE INDEX IF NOT EXISTS idx_content_affinity_log_created
  ON public.content_affinity_log(created_at DESC);

COMMENT ON TABLE public.content_notification_queue IS
  'Sprint 24: PostgreSQL queue for CONTENT_PUBLISHED affinity notifications; processed in batches by process_content_notification_queue.';

COMMENT ON TABLE public.content_affinity_log IS
  'Sprint 24: real affinity evaluations for published content; no synthetic user activity.';
