-- The canonical automation_action_type is created by
-- 20260823061310_73b4b142-1ec8-41cf-9179-a0ad38143317.sql.
-- Add the video action only after that type exists in a clean database.
ALTER TYPE public.automation_action_type
  ADD VALUE IF NOT EXISTS 'VIDEO_LAUNCH';
