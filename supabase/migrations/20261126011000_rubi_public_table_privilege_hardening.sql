-- Revoke table-level capabilities that bypass row policies or are unnecessary
-- for Data API clients. Keep normal application DML; RLS remains the row boundary.
--
-- PostgreSQL 17 / Supabase 17.6. TRUNCATE bypasses RLS entirely. REFERENCES,
-- TRIGGER and MAINTAIN are not needed by Data API clients.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- These capabilities were present in postgres-owned default ACLs at both
-- public and storage scope. Global default revocation is required because
-- schema-scoped ALTER DEFAULT PRIVILEGES cannot cancel global grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON TABLES FROM anon, authenticated;

-- Keep normal Data API DML on future public tables, subject to RLS.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
