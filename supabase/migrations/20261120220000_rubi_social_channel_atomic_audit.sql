-- Sprint 299: social channel create/update/delete and admin audit share one transaction.
create or replace function public.rubi_manage_social_channel_audited(
 p_action text,
 p_id uuid,
 p_payload jsonb,
 p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
 old_row public.social_channels%rowtype;
 new_row public.social_channels%rowtype;
 v_platform text;
 v_name text;
 v_url text;
 v_icon text;
 v_active boolean;
 v_action_type text;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then
  raise exception 'Owner authorization required';
 end if;

 if p_action is null or p_action not in ('save','delete') then
  raise exception 'Invalid social channel action';
 end if;

 if p_action='delete' then
  if p_id is null then raise exception 'Social channel ID required'; end if;
  select * into old_row from public.social_channels where id=p_id for update;
  if not found then raise exception 'Social channel not found'; end if;

  delete from public.social_channels where id=p_id;
  insert into public.admin_audit_log(
   actor_user_id,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
   p_actor,'RUBI_SOCIAL_CHANNEL_DELETED','social_channel',p_id::text,
   public.sanitize_admin_audit_value(jsonb_build_object(
    'platform',old_row.platform,'channel_name',old_row.channel_name,
    'channel_url_host',split_part(split_part(old_row.channel_url,'/',3),'?',1),
    'icon',old_row.icon,'is_active',old_row.is_active
   )),'{}'::jsonb
  );
  return jsonb_build_object('id',p_id,'action','deleted');
 end if;

 if jsonb_typeof(p_payload) is distinct from 'object' then
  raise exception 'Social channel payload required';
 end if;

 v_platform:=p_payload->>'platform';
 v_name:=btrim(coalesce(p_payload->>'channel_name',''));
 v_url:=btrim(coalesce(p_payload->>'channel_url',''));
 v_icon:=nullif(btrim(coalesce(p_payload->>'icon','')),'');
 v_active:=(p_payload->>'is_active')::boolean;

 if v_platform is null or v_platform not in ('tiktok','instagram','kwai','telegram','youtube')
  or length(v_name) not between 2 and 120
  or v_url !~* '^https://[^/@[:space:]]+(/[^[:space:]]*)?$'
  or v_active is null
  or length(coalesce(v_icon,''))>40
 then
  raise exception 'Invalid social channel attributes';
 end if;

 if p_id is null then
  insert into public.social_channels(platform,channel_name,channel_url,icon,is_active,created_at,updated_at)
  values(v_platform,v_name,v_url,coalesce(v_icon,v_platform),v_active,now(),now())
  returning * into new_row;
  v_action_type:='RUBI_SOCIAL_CHANNEL_CREATED';
 else
  select * into old_row from public.social_channels where id=p_id for update;
  if not found then raise exception 'Social channel not found'; end if;
  update public.social_channels set
   platform=v_platform,channel_name=v_name,channel_url=v_url,
   icon=coalesce(v_icon,v_platform),is_active=v_active,updated_at=now()
  where id=p_id returning * into new_row;
  v_action_type:='RUBI_SOCIAL_CHANNEL_UPDATED';
 end if;

 insert into public.admin_audit_log(
  actor_user_id,action_type,entity_type,entity_id,previous_value,new_value
 ) values (
  p_actor,v_action_type,'social_channel',new_row.id::text,
  case when p_id is null then '{}'::jsonb else
   public.sanitize_admin_audit_value(jsonb_build_object(
    'platform',old_row.platform,'channel_name',old_row.channel_name,
    'channel_url_host',split_part(split_part(old_row.channel_url,'/',3),'?',1),
    'icon',old_row.icon,'is_active',old_row.is_active
   )) end,
  public.sanitize_admin_audit_value(jsonb_build_object(
   'platform',new_row.platform,'channel_name',new_row.channel_name,
   'channel_url_host',split_part(split_part(new_row.channel_url,'/',3),'?',1),
   'icon',new_row.icon,'is_active',new_row.is_active
  ))
 );
 return jsonb_build_object('id',new_row.id,'action',v_action_type);
end;
$function$;

revoke all on function public.rubi_manage_social_channel_audited(text,uuid,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_social_channel_audited(text,uuid,jsonb,uuid)
 to service_role;
comment on function public.rubi_manage_social_channel_audited(text,uuid,jsonb,uuid)
 is 'Owner-gated atomic social channel create/update/delete with sanitized admin audit snapshots.';
