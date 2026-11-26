\set ON_ERROR_STOP on
-- Executed by the authenticated local E2E workflow against disposable PostgreSQL.
BEGIN;

DO $$
DECLARE
  privileged_table text;
BEGIN
  SELECT format('%I.%I', n.nspname, c.relname)
    INTO privileged_table
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND (
      has_table_privilege('anon', c.oid, 'TRUNCATE')
      OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
      OR has_table_privilege('anon', c.oid, 'REFERENCES')
      OR has_table_privilege('authenticated', c.oid, 'REFERENCES')
      OR has_table_privilege('anon', c.oid, 'TRIGGER')
      OR has_table_privilege('authenticated', c.oid, 'TRIGGER')
      OR has_table_privilege('anon', c.oid, 'MAINTAIN')
      OR has_table_privilege('authenticated', c.oid, 'MAINTAIN')
    )
  LIMIT 1;

  IF privileged_table IS NOT NULL THEN
    RAISE EXCEPTION 'Data API role retains table-level bypass/schema privilege on %', privileged_table;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    JOIN pg_namespace n ON n.oid = d.defaclnamespace
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    JOIN pg_roles r ON r.oid = a.grantee
    WHERE n.nspname = 'public'
      AND d.defaclobjtype = 'r'
      AND r.rolname IN ('anon', 'authenticated')
      AND a.privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  ) THEN
    RAISE EXCEPTION 'Postgres default privileges still grant non-application table capabilities to Data API roles';
  END IF;

  -- Preserve existing application reads and RLS-gated writes.
  IF NOT has_table_privilege('anon', 'public.products', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.products', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.products', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.products', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.products', 'DELETE') THEN
    RAISE EXCEPTION 'Products application grants changed unexpectedly';
  END IF;

  IF NOT has_table_privilege('anon', 'public.customer_coupons', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.customer_coupons', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.customer_coupons', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.customer_coupons', 'DELETE') THEN
    RAISE EXCEPTION 'Customer coupon application grants changed unexpectedly';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.products', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.products', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.products', 'DELETE') THEN
    RAISE EXCEPTION 'Trusted server product DML grants changed unexpectedly';
  END IF;
END
$$;

ROLLBACK;
SELECT 'Public table privilege hardening smoke: PASS' AS result;
