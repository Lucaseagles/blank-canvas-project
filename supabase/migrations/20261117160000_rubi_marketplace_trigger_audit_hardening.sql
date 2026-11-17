-- RUBI marketplace audit hardening: no duplicate records from the atomic RPC,
-- no NULL JSON snapshots, and no API credential values in trigger audit payloads.
create or replace function public.audit_marketplace_mutation()
returns trigger
language plpgsql
security definer
set search_path='public'
as $function$
declare
 v_previous jsonb;
 v_new jsonb;
begin
 if current_setting('rubi.marketplace_atomic_audit',true)='on' then
  return coalesce(new,old);
 end if;

 if tg_op='INSERT' then
  v_previous:='{}'::jsonb;
  v_new:=to_jsonb(new)-'api_config';
  if new.api_config is not null then
   v_new:=v_new||jsonb_build_object('api_config_redacted',true);
  end if;
 elsif tg_op='DELETE' then
  v_previous:=to_jsonb(old)-'api_config';
  if old.api_config is not null then
   v_previous:=v_previous||jsonb_build_object('api_config_redacted',true);
  end if;
  v_new:='{}'::jsonb;
 else
  v_previous:=to_jsonb(old)-'api_config';
  v_new:=to_jsonb(new)-'api_config';
  if old.api_config is distinct from new.api_config then
   v_previous:=v_previous||jsonb_build_object('api_config_redacted',old.api_config is not null);
   v_new:=v_new||jsonb_build_object('api_config_redacted',new.api_config is not null);
  end if;
 end if;

 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values (
  auth.uid(),coalesce(auth.jwt()->>'email',''),
  case when tg_op='INSERT' then 'create' when tg_op='DELETE' then 'delete' else 'update' end,
  'marketplace',coalesce(new.id,old.id),
  coalesce(v_previous,'{}'::jsonb),coalesce(v_new,'{}'::jsonb)
 );
 return coalesce(new,old);
end;
$function$;

create or replace function public.rubi_manage_marketplace_audited(
 p_action text,p_id uuid,p_payload jsonb,p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
 old_row public.marketplaces%rowtype;
 new_row public.marketplaces%rowtype;
 v_id uuid;
 v_linked boolean;
 v_fields text[];
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('save','delete','credentials','api_status') then
  raise exception 'Invalid marketplace action';
 end if;

 perform set_config('rubi.marketplace_atomic_audit','on',true);

 if p_action='save' then
  if jsonb_typeof(p_payload) is distinct from 'object'
   or length(btrim(coalesce(p_payload->>'name',''))) not between 2 and 120
   or length(btrim(coalesce(p_payload->>'slug',''))) not between 2 and 120
   or coalesce(p_payload->>'slug','') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
   or coalesce(p_payload->>'status','') not in ('active','pending','disabled') then
   raise exception 'Invalid marketplace data';
  end if;
  if p_id is null then
   insert into public.marketplaces(name,slug,status,affiliate_link_structure,updated_at)
   values(btrim(p_payload->>'name'),btrim(p_payload->>'slug'),p_payload->>'status',
    nullif(btrim(p_payload->>'affiliate_link_structure'),''),now())
   returning * into new_row;
   v_id:=new_row.id;
   insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,null,'MARKETPLACE_CREATED','marketplaces',v_id,'{}'::jsonb,
    jsonb_build_object('name',new_row.name,'slug',new_row.slug,'status',new_row.status,
     'affiliate_link_structure',new_row.affiliate_link_structure));
  else
   select * into old_row from public.marketplaces where id=p_id for update;
   if not found then raise exception 'Marketplace not found'; end if;
   update public.marketplaces set name=btrim(p_payload->>'name'),slug=btrim(p_payload->>'slug'),
    status=p_payload->>'status',
    affiliate_link_structure=nullif(btrim(p_payload->>'affiliate_link_structure'),''),
    updated_at=now()
   where id=p_id returning * into new_row;
   v_id:=new_row.id;
   insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,null,'MARKETPLACE_UPDATED','marketplaces',v_id,
    jsonb_build_object('name',old_row.name,'slug',old_row.slug,'status',old_row.status,
     'affiliate_link_structure',old_row.affiliate_link_structure),
    jsonb_build_object('name',new_row.name,'slug',new_row.slug,'status',new_row.status,
     'affiliate_link_structure',new_row.affiliate_link_structure));
  end if;
  return jsonb_build_object('id',v_id);
 end if;

 if p_id is null then raise exception 'Marketplace ID required'; end if;
 select * into old_row from public.marketplaces where id=p_id for update;
 if not found then raise exception 'Marketplace not found'; end if;

 if p_action='delete' then
  select exists(select 1 from public.products p where p.marketplace_id=p_id) into v_linked;
  if v_linked then raise exception 'Marketplace has linked products; disable it or reassign products first'; end if;
  delete from public.marketplaces where id=p_id;
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'MARKETPLACE_DELETED','marketplaces',p_id,
   jsonb_build_object('name',old_row.name,'slug',old_row.slug,'status',old_row.status),'{}'::jsonb);
  return jsonb_build_object('id',p_id);
 end if;

 if p_action='credentials' then
  if jsonb_typeof(p_payload) is distinct from 'object' or p_payload='{}'::jsonb then
   raise exception 'Marketplace credentials must be a non-empty object';
  end if;
  select array_agg(k order by k) into v_fields from jsonb_object_keys(p_payload) as fields(k);
  update public.marketplaces set api_config=p_payload,status='pending',api_status='pending',updated_at=now()
   where id=p_id returning * into new_row;
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'MARKETPLACE_CREDENTIALS_UPDATED','marketplaces',p_id,
   jsonb_build_object('credential_fields_redacted',true),
   jsonb_build_object('credential_fields',to_jsonb(v_fields),'values_redacted',true));
  return jsonb_build_object('id',p_id,'success',true);
 end if;

 if p_action='api_status' then
  if coalesce(p_payload->>'api_status','') not in
   ('pending','not_configured','connector_not_implemented','connected','error') then
   raise exception 'Invalid marketplace API status';
  end if;
  update public.marketplaces set api_status=p_payload->>'api_status',updated_at=now()
   where id=p_id returning * into new_row;
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'MARKETPLACE_API_STATUS_CHANGED','marketplaces',p_id,
   jsonb_build_object('api_status',old_row.api_status),
   jsonb_build_object('api_status',new_row.api_status));
  return jsonb_build_object('id',p_id,'api_status',new_row.api_status);
 end if;
 return '{}'::jsonb;
end;
$fn$;
