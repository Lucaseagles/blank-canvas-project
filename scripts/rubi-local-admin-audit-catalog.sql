\pset format unaligned
\pset tuples_only on
\pset pager off

-- Read-only catalog snapshot for the disposable local Supabase database.
-- Contains schema metadata only: no rows, function bodies, credentials or secrets.
select pg_catalog.jsonb_pretty(pg_catalog.jsonb_build_object(
  'generated_at', pg_catalog.clock_timestamp(),
  'database_scope', 'disposable local Supabase; public schema catalog metadata only',
  'limitations', pg_catalog.jsonb_build_array(
    'Catalog metadata does not prove application reachability or business-level audit completeness.',
    'Function names and grants do not prove that every caller validates the intended actor.',
    'Review this snapshot together with source inventory and transaction smokes.'
  ),
  'tables', coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'table', c.relname,
      'kind', c.relkind,
      'rls_enabled', c.relrowsecurity,
      'rls_forced', c.relforcerowsecurity,
      'browser_privileges', pg_catalog.jsonb_build_object(
        'anon_select', has_table_privilege('anon', c.oid, 'SELECT'),
        'anon_insert', has_table_privilege('anon', c.oid, 'INSERT'),
        'anon_update', has_table_privilege('anon', c.oid, 'UPDATE'),
        'anon_delete', has_table_privilege('anon', c.oid, 'DELETE'),
        'authenticated_select', has_table_privilege('authenticated', c.oid, 'SELECT'),
        'authenticated_insert', has_table_privilege('authenticated', c.oid, 'INSERT'),
        'authenticated_update', has_table_privilege('authenticated', c.oid, 'UPDATE'),
        'authenticated_delete', has_table_privilege('authenticated', c.oid, 'DELETE'),
        'service_role_insert', has_table_privilege('service_role', c.oid, 'INSERT'),
        'service_role_update', has_table_privilege('service_role', c.oid, 'UPDATE'),
        'service_role_delete', has_table_privilege('service_role', c.oid, 'DELETE')
      ),
      'policies', coalesce((
        select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'name', p.policyname,
          'command', p.cmd,
          'permissive', p.permissive,
          'roles', pg_catalog.to_jsonb(p.roles),
          'using_expression', p.qual,
          'check_expression', p.with_check
        ) order by p.policyname)
        from pg_catalog.pg_policies p
        where p.schemaname = 'public' and p.tablename = c.relname
      ), '[]'::jsonb)
    ) order by c.relname)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p','v','m')
  ), '[]'::jsonb),
  'functions', coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'name', p.proname,
      'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
      'result', pg_catalog.pg_get_function_result(p.oid),
      'security_definer', p.prosecdef,
      'configuration', coalesce(pg_catalog.to_jsonb(p.proconfig), '[]'::jsonb),
      'execute_privileges', pg_catalog.jsonb_build_object(
        'anon', has_function_privilege('anon', p.oid, 'EXECUTE'),
        'authenticated', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
        'service_role', has_function_privilege('service_role', p.oid, 'EXECUTE')
      )
    ) order by p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
  ), '[]'::jsonb),
  'triggers', coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'table', c.relname,
      'name', t.tgname,
      'enabled', t.tgenabled,
      'function', p.proname,
      'definition', pg_catalog.pg_get_triggerdef(t.oid, true)
    ) order by c.relname, t.tgname)
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_proc p on p.oid = t.tgfoid
    where n.nspname = 'public' and not t.tgisinternal
  ), '[]'::jsonb),
  'security_definer_anon_executable', coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'name', p.proname,
      'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid)
    ) order by p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ), '[]'::jsonb),
  'unrestricted_public_write_policies', coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'table', p.tablename,
      'name', p.policyname,
      'command', p.cmd,
      'roles', pg_catalog.to_jsonb(p.roles),
      'using_expression', p.qual,
      'check_expression', p.with_check
    ) order by p.tablename, p.policyname)
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      and ('public' = any(p.roles) or 'anon' = any(p.roles))
      and (
        lower(trim(coalesce(p.qual, ''))) in ('true', '(true)')
        or lower(trim(coalesce(p.with_check, ''))) in ('true', '(true)')
      )
  ), '[]'::jsonb)
));
