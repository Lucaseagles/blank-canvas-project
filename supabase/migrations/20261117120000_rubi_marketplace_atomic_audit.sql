-- RUBI Sprint 227: transactional marketplace CRUD, credential updates and connector status.
-- Audit is part of the same transaction; secrets are never copied to the audit payload.
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
  -- FOR UPDATE conflicts with the KEY SHARE lock taken by product FK inserts,
  -- so a new product cannot attach after this check and before deletion.
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

revoke all on function public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)
 to service_role;
comment on function public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)
 is 'Owner-gated marketplace CRUD, credentials and API status with transactional sanitized audit. Delete locks the row and rejects linked products.';
