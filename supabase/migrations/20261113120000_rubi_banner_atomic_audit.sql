-- Sprint 171: Banner publication/deletion and audit log commit in the same transaction.
create or replace function public.rubi_create_banner_audited(p_data jsonb,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare new_banner public.banners%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
   where r.user_id=p_actor and r.role='owner') then
  raise exception 'Owner authorization required';
 end if;
 if coalesce(char_length(btrim(p_data->>'title')),0)<1
   or coalesce(char_length(p_data->>'title'),0)>180
   or coalesce(char_length(p_data->>'image_url'),0)>2000
   or (p_data->>'image_url') not like 'https://%'
   or (p_data->>'target_device') not in ('all','desktop','tablet','mobile') then
  raise exception 'Invalid banner configuration';
 end if;
 if (p_data->>'ends_at')::timestamptz < (p_data->>'starts_at')::timestamptz then
  raise exception 'Invalid banner schedule';
 end if;
 insert into public.banners
 (title,image_url,link_url,starts_at,ends_at,is_active,position,audience_segment,target_device,
  target_category_id,target_product_id,campaign_id)
 values(
  p_data->>'title',p_data->>'image_url',nullif(p_data->>'link_url',''),
  (p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,
  coalesce((p_data->>'is_active')::boolean,true),
  coalesce((p_data->>'position')::integer,0),nullif(p_data->>'audience_segment',''),
  p_data->>'target_device',(p_data->>'target_category_id')::uuid,
  (p_data->>'target_product_id')::uuid,(p_data->>'campaign_id')::uuid
 ) returning * into new_banner;
 insert into public.admin_audit_log
 (actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_BANNER_CREATED','banners',new_banner.id,'{}'::jsonb,
  jsonb_build_object('active',new_banner.is_active,'target_device',new_banner.target_device,
   'position',new_banner.position));
 return to_jsonb(new_banner);
end;
$$;
revoke all on function public.rubi_create_banner_audited(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.rubi_create_banner_audited(jsonb,uuid) to service_role;

create or replace function public.rubi_delete_banner_audited(p_id uuid,p_actor uuid)
returns void language plpgsql security invoker set search_path=''
as $$
declare old_banner public.banners%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
   where r.user_id=p_actor and r.role='owner') then
  raise exception 'Owner authorization required';
 end if;
 select b.* into old_banner from public.banners b where b.id=p_id for update;
 if not found then raise exception 'Banner not found'; end if;
 delete from public.banners b where b.id=p_id;
 insert into public.admin_audit_log
 (actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_BANNER_DELETED','banners',p_id,
  jsonb_build_object('active',old_banner.is_active,'position',old_banner.position),
  jsonb_build_object('deleted',true));
end;
$$;
revoke all on function public.rubi_delete_banner_audited(uuid,uuid) from public,anon,authenticated;
grant execute on function public.rubi_delete_banner_audited(uuid,uuid) to service_role;
