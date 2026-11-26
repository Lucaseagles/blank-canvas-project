\set ON_ERROR_STOP on
-- Disposable PostgreSQL privilege proof. No application data is read or changed.
BEGIN;
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.curated_collections', 'INSERT')
    OR has_table_privilege('anon', 'public.curated_collections', 'UPDATE')
    OR has_table_privilege('anon', 'public.curated_collections', 'DELETE')
    OR has_table_privilege('authenticated', 'public.curated_collections', 'INSERT')
    OR has_table_privilege('authenticated', 'public.curated_collections', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.curated_collections', 'DELETE') THEN
    RAISE EXCEPTION 'Client roles retain direct curated_collections DML';
  END IF;

  IF has_table_privilege('anon', 'public.collection_items', 'INSERT')
    OR has_table_privilege('anon', 'public.collection_items', 'UPDATE')
    OR has_table_privilege('anon', 'public.collection_items', 'DELETE')
    OR has_table_privilege('authenticated', 'public.collection_items', 'INSERT')
    OR has_table_privilege('authenticated', 'public.collection_items', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.collection_items', 'DELETE') THEN
    RAISE EXCEPTION 'Client roles retain direct collection_items DML';
  END IF;

  IF has_table_privilege('anon', 'public.collection_candidates', 'SELECT')
    OR has_table_privilege('anon', 'public.collection_candidates', 'INSERT')
    OR has_table_privilege('authenticated', 'public.collection_candidates', 'SELECT')
    OR has_table_privilege('authenticated', 'public.collection_candidates', 'INSERT')
    OR has_table_privilege('authenticated', 'public.collection_candidates', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.collection_candidates', 'DELETE') THEN
    RAISE EXCEPTION 'Client roles retain direct collection_candidates privileges';
  END IF;

  IF NOT has_table_privilege('anon', 'public.curated_collections', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.curated_collections', 'SELECT')
    OR NOT has_table_privilege('anon', 'public.collection_items', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.collection_items', 'SELECT') THEN
    RAISE EXCEPTION 'Public storefront SELECT privileges were not preserved';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.curated_collections', 'INSERT')
    OR NOT has_table_privilege('service_role', 'public.collection_items', 'DELETE')
    OR NOT has_table_privilege('service_role', 'public.collection_candidates', 'UPDATE') THEN
    RAISE EXCEPTION 'Trusted server role lost required smart collection DML';
  END IF;
END;
$$;
ROLLBACK;
