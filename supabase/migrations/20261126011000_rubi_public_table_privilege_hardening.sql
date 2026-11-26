-- Revoke table-level capabilities that bypass row policies or are unnecessary
-- for Data API clients. Keep SELECT/INSERT/UPDATE/DELETE grants unchanged:
-- application DML remains governed by the existing RLS policies.
--
-- PostgreSQL 17 / Supabase 17.6. TRUNCATE bypasses RLS entirely; REFERENCES,
-- TRIGGER and MAINTAIN are schema/maintenance capabilities, not client actions.

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- Supabase's existing postgres-owned default ACL grants broad table privileges
-- to Data API roles. Remove only non-application capabilities for future tables.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON TABLES
FROM anon, authenticated;
