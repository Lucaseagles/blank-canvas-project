-- Sprint 232: harden privileged Secure Hub Vault functions.
-- Secrets remain callable only through the Owner-gated server functions using service_role.
create or replace function public.mark_integration_check(
  p_platform_id text,
  p_status text,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1 from public.integration_platforms
    where id = p_platform_id
  ) then
    raise exception 'Invalid integration platform';
  end if;

  if p_status is null or p_status not in ('pending', 'active', 'error') then
    raise exception 'Invalid integration status';
  end if;

  insert into public.integration_credentials (
    platform_id, status, last_checked_at, last_error, updated_at
  )
  values (
    p_platform_id, p_status, pg_catalog.now(), p_error, pg_catalog.now()
  )
  on conflict (platform_id) do update
    set status = excluded.status,
        last_checked_at = excluded.last_checked_at,
        last_error = excluded.last_error,
        updated_at = pg_catalog.now();
end;
$function$;

create or replace function public.set_integration_secret(
  p_platform_id text,
  p_field_key text,
  p_value text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  refs jsonb;
  existing_ref text;
  secret_id uuid;
  secret_name text := 'integration:' || p_platform_id || ':' || p_field_key;
  secret_description text := 'Integration secret for ' || p_platform_id || '.' || p_field_key;
begin
  if not exists (
    select 1 from public.integration_platforms
    where id = p_platform_id and active
  ) then
    raise exception 'Invalid or inactive integration platform';
  end if;

  if p_field_key is null or p_value is null or pg_catalog.length(pg_catalog.btrim(p_value)) = 0 then
    raise exception 'Invalid integration secret payload';
  end if;

  if not exists (
    select 1 from public.integration_credential_fields
    where platform_id = p_platform_id and field_key = p_field_key
  ) then
    raise exception 'Invalid credential field for integration platform';
  end if;

  select secret_refs into refs
  from public.integration_credentials
  where platform_id = p_platform_id
  for update;

  existing_ref := coalesce(refs, '{}'::jsonb) ->> p_field_key;

  if existing_ref is not null and existing_ref <> '' then
    secret_id := existing_ref::uuid;
    perform vault.update_secret(secret_id, p_value, secret_name, secret_description);
  else
    secret_id := vault.create_secret(p_value, secret_name, secret_description);
  end if;

  insert into public.integration_credentials (
    platform_id, secret_refs, status, updated_at
  )
  values (
    p_platform_id, pg_catalog.jsonb_build_object(p_field_key, secret_id::text),
    'pending', pg_catalog.now()
  )
  on conflict (platform_id) do update
    set secret_refs = coalesce(public.integration_credentials.secret_refs, '{}'::jsonb)
      || pg_catalog.jsonb_build_object(p_field_key, secret_id::text),
        status = 'pending',
        last_error = null,
        updated_at = pg_catalog.now();

  return secret_id;
end;
$function$;

create or replace function public.get_integration_secret(
  p_platform_id text,
  p_field_key text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  secret_ref text;
begin
  if not exists (
    select 1 from public.integration_platforms
    where id = p_platform_id and active
  ) then
    raise exception 'Invalid or inactive integration platform';
  end if;

  if not exists (
    select 1 from public.integration_credential_fields
    where platform_id = p_platform_id and field_key = p_field_key
  ) then
    raise exception 'Invalid credential field for integration platform';
  end if;

  select secret_refs ->> p_field_key into secret_ref
  from public.integration_credentials
  where platform_id = p_platform_id;

  if secret_ref is null or secret_ref = '' then
    return null;
  end if;

  return (
    select decrypted_secret
    from vault.decrypted_secrets
    where id = secret_ref::uuid
  );
end;
$function$;

revoke all on function public.mark_integration_check(text, text, text) from public, anon, authenticated;
revoke all on function public.set_integration_secret(text, text, text) from public, anon, authenticated;
revoke all on function public.get_integration_secret(text, text) from public, anon, authenticated;

grant execute on function public.mark_integration_check(text, text, text) to service_role;
grant execute on function public.set_integration_secret(text, text, text) to service_role;
grant execute on function public.get_integration_secret(text, text) to service_role;
