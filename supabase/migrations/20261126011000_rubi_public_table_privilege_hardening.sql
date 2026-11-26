-- Revoke table-level capabilities that bypass row policies or are unnecessary
-- for Data API clients. Keep normal application DML; RLS remains the row boundary.
--
-- PostgreSQL 17 / Supabase 17.6. TRUNCATE bypasses RLS entirely. REFERENCES,
-- TRIGGER and MAINTAIN are not needed by Data API clients.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- Reset the postgres-owned public-table defaults explicitly. A partial REVOKE
-- can leave inherited/default ACL entries behind; rebuild the intended DML
-- surface so future public tables retain only normal RLS-gated operations.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
