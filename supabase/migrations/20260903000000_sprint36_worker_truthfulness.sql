-- Sprint 36 — keep automation metadata honest until the external worker is configured.
-- The GitHub Actions worker is deployed/configured separately; this prevents the DB
-- from claiming end-to-end automation before its runtime secret is present.
UPDATE public.automation_rules
SET is_fully_automated = false
WHERE action_type = 'PUBLISH_SCHEDULED_POSTS';
