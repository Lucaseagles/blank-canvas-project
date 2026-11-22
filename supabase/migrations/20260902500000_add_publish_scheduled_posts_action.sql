-- Register the scheduled-post action before the Sprint 36 truthfulness migration references it.
-- Keep enum extension isolated so PostgreSQL commits the new value before later migrations use it.
ALTER TYPE public.automation_action_type
  ADD VALUE IF NOT EXISTS 'PUBLISH_SCHEDULED_POSTS';
