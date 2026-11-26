-- Sprint 318: Owner-only referral tier CRUD with atomic, sanitized audit.
-- Public consumers retain SELECT on active tiers; no browser-role write path is introduced.

create or replace function public.rubi_create_referral_tier_audited(
  p_data jsonb,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_row public.referral_tiers%rowtype;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner'
  ) then raise exception 'Owner authorization required'; end if;

  if p_data is null or jsonb_typeof(p_data)<>'object'
    or (select array_agg(k order by k) from jsonb_object_keys(p_data) k)
       is distinct from array['color','display_order','icon','is_active','min_referrals','reward_description','tier_key','tier_name']::text[]
  then raise exception 'Invalid referral tier payload'; end if;

  if length(btrim(coalesce(p_data->>'tier_name',''))) not between 1 and 120
    or (p_data->>'tier_key') !~ '^[a-z0-9_-]{1,80}$'
    or coalesce((p_data->>'min_referrals')::bigint,-1) not between 0 and 2000000000
    or length(btrim(coalesce(p_data->>'reward_description',''))) not between 1 and 1000
    or length(btrim(coalesce(p_data->>'icon',''))) not between 1 and 32
    or (p_data->>'color') !~ '^#[0-9A-Fa-f]{6}$'
    or coalesce(p_data->>'is_active','') not in ('true','false')
    or coalesce((p_data->>'display_order')::bigint,-1) not between 0 and 2000000000
  then raise exception 'Invalid referral tier fields'; end if;

  insert into public.referral_tiers(
    tier_name,tier_key,min_referrals,reward_description,icon,color,is_active,display_order
  ) values (
    btrim(p_data->>'tier_name'),p_data->>'tier_key',(p_data->>'min_referrals')::integer,
    btrim(p_data->>'reward_description'),btrim(p_data->>'icon'),p_data->>'color',
    (p_data->>'is_active')::boolean,(p_data->>'display_order')::integer
  ) returning * into v_row;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,'RUBI_REFERRAL_TIER_CREATED','referral_tiers',v_row.id::text,
    jsonb_build_object('values_redacted',true),
    jsonb_build_object('changed_fields',jsonb_build_array('tier_name','tier_key','min_referrals','reward_description','icon','color','is_active','display_order'),'values_redacted',true)
  );
  return to_jsonb(v_row);
end;
$fn$;

create or replace function public.rubi_update_referral_tier_audited(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_patch jsonb,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_before public.referral_tiers%rowtype;
  v_after public.referral_tiers%rowtype;
  v_keys text[];
  v_key text;
  v_assignments text:='';
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if p_id is null or p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb then
    raise exception 'Referral tier id and patch are required';
  end if;

  select array_agg(k order by k) into v_keys from jsonb_object_keys(p_patch) k;
  foreach v_key in array v_keys loop
    if v_key not in ('tier_name','tier_key','min_referrals','reward_description','icon','color','is_active','display_order') then
      raise exception 'Unsupported referral tier field: %',v_key;
    end if;
  end loop;

  select * into v_before from public.referral_tiers where id=p_id for update;
  if not found then raise exception 'Referral tier not found'; end if;
  if v_before.updated_at is distinct from p_expected_updated_at then
    raise exception 'Referral tier changed; reload before saving';
  end if;

  if ('tier_name'=any(v_keys) and length(btrim(coalesce(p_patch->>'tier_name',''))) not between 1 and 120)
    or ('tier_key'=any(v_keys) and (p_patch->>'tier_key') !~ '^[a-z0-9_-]{1,80}$')
    or ('min_referrals'=any(v_keys) and coalesce((p_patch->>'min_referrals')::bigint,-1) not between 0 and 2000000000)
    or ('reward_description'=any(v_keys) and length(btrim(coalesce(p_patch->>'reward_description',''))) not between 1 and 1000)
    or ('icon'=any(v_keys) and length(btrim(coalesce(p_patch->>'icon',''))) not between 1 and 32)
    or ('color'=any(v_keys) and (p_patch->>'color') !~ '^#[0-9A-Fa-f]{6}$')
    or ('is_active'=any(v_keys) and coalesce(p_patch->>'is_active','') not in ('true','false'))
    or ('display_order'=any(v_keys) and coalesce((p_patch->>'display_order')::bigint,-1) not between 0 and 2000000000)
  then raise exception 'Invalid referral tier fields'; end if;

  foreach v_key in array v_keys loop
    v_assignments:=v_assignments||case when v_assignments='' then '' else ', ' end||
      format('%I=(jsonb_populate_record(null::public.referral_tiers,$2)).%I',v_key,v_key);
  end loop;
  v_assignments:=v_assignments||', updated_at=now()';
  execute format('update public.referral_tiers t set %s where t.id=$1 returning t.*',v_assignments)
    into v_after using p_id,p_patch;
  if not found then raise exception 'Referral tier update did not persist'; end if;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,'RUBI_REFERRAL_TIER_UPDATED','referral_tiers',p_id::text,
    jsonb_build_object('changed_fields',to_jsonb(v_keys),'values_redacted',true),
    jsonb_build_object('changed_fields',to_jsonb(v_keys),'values_redacted',true)
  );
  return to_jsonb(v_after);
end;
$fn$;

create or replace function public.rubi_deactivate_referral_tier_audited(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_before public.referral_tiers%rowtype;
  v_after public.referral_tiers%rowtype;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner'
  ) then raise exception 'Owner authorization required'; end if;
  select * into v_before from public.referral_tiers where id=p_id for update;
  if not found then raise exception 'Referral tier not found'; end if;
  if v_before.updated_at is distinct from p_expected_updated_at then
    raise exception 'Referral tier changed; reload before saving';
  end if;
  if not v_before.is_active then raise exception 'Referral tier is already inactive'; end if;

  update public.referral_tiers set is_active=false,updated_at=now()
  where id=p_id returning * into v_after;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,'RUBI_REFERRAL_TIER_DEACTIVATED','referral_tiers',p_id::text,
    jsonb_build_object('is_active',true,'values_redacted',true),
    jsonb_build_object('is_active',false,'values_redacted',true)
  );
  return to_jsonb(v_after);
end;
$fn$;

revoke all on function public.rubi_create_referral_tier_audited(jsonb,uuid) from public,anon,authenticated;
revoke all on function public.rubi_update_referral_tier_audited(uuid,timestamptz,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.rubi_deactivate_referral_tier_audited(uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.rubi_create_referral_tier_audited(jsonb,uuid) to service_role;
grant execute on function public.rubi_update_referral_tier_audited(uuid,timestamptz,jsonb,uuid) to service_role;
grant execute on function public.rubi_deactivate_referral_tier_audited(uuid,timestamptz,uuid) to service_role;

comment on function public.rubi_create_referral_tier_audited(jsonb,uuid) is 'Owner-only referral tier create with strict payload validation and atomic sanitized audit.';
comment on function public.rubi_update_referral_tier_audited(uuid,timestamptz,jsonb,uuid) is 'Owner-only referral tier update with optimistic concurrency and atomic sanitized audit.';
comment on function public.rubi_deactivate_referral_tier_audited(uuid,timestamptz,uuid) is 'Owner-only soft deactivation with optimistic concurrency and atomic sanitized audit.';
