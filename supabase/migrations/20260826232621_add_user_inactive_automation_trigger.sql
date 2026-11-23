-- Restore the production-applied USER_INACTIVE trigger value that was missing
-- from the repository migration history. Keep this enum change isolated so
-- PostgreSQL can use the new value in the following migration.
ALTER TYPE public.automation_trigger_type
  ADD VALUE IF NOT EXISTS 'USER_INACTIVE';
