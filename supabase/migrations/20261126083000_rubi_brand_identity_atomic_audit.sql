-- Sprint 317: audit the singleton brand identity mutation atomically.
-- Preserve the boolean singleton key and keep all browser-role DML revoked.
create or replace function public.rubi_update_brand_identity_audited(
  p_display_name text,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id=p_actor and r.role::text='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  if p_display_name is null or length(btrim(p_display_name)) not between 2 and 80 then
    raise exception 'Brand display name must contain 2 to 80 characters';
  end if;

  -- Serialize the singleton even when the row has not yet been created.
  perform pg_advisory_xact_lock(hashtextextended('public.brand_identity.singleton', 0));

  select to_jsonb(b) into v_before
  from public.brand_identity b
  where b.id=true
  for update;

  insert into public.brand_identity as target(id,display_name,updated_at)
  values (true,btrim(p_display_name),now())
  on conflict (id) do update
    set display_name=excluded.display_name,
        updated_at=excluded.updated_at
  returning to_jsonb(target.*) into v_after;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,
    null,
    case when v_before is null then 'RUBI_BRAND_IDENTITY_CREATED' else 'RUBI_BRAND_IDENTITY_UPDATED' end,
    'brand_identity',
    'true',
    jsonb_build_object('display_name_changed', (v_before->>'display_name') is distinct from (v_after->>'display_name'), 'values_redacted', true),
    jsonb_build_object('changed_fields', jsonb_build_array('display_name'), 'values_redacted', true)
  );

  return v_after;
end;
$fn$;

revoke all on function public.rubi_update_brand_identity_audited(text,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_update_brand_identity_audited(text,uuid)
  to service_role;
comment on function public.rubi_update_brand_identity_audited(text,uuid)
  is 'Owner-only singleton brand identity update with sanitized atomic audit; browser roles cannot execute.';
