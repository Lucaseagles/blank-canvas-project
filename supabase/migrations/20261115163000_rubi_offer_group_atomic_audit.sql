-- RUBI Sprint 210: Owner-audited Offer Groups and featured controls.
-- DML and audit must commit/rollback together and prevent direct authenticated bypass.
create or replace function public.rubi_manage_offer_group_audited(
 p_action text,p_id uuid,p_title text,p_product_id uuid,p_group_id uuid,
 p_feature jsonb,p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $rubi$
declare
 old_group public.offer_groups%rowtype;
 old_product public.products%rowtype;
 new_id uuid;
 new_name text;
 v_featured boolean;
 v_priority integer;
 v_start timestamptz;
 v_end timestamptz;
 action_name text;
 prev jsonb:='{}'::jsonb;
 next jsonb:='{}'::jsonb;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('save','delete','assign','feature') then raise exception 'Unsupported action'; end if;
 if p_action='assign' then
  if p_product_id is null then raise exception 'Product required'; end if;
  select * into old_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product missing'; end if;
  if p_group_id is not null then
   perform 1 from public.offer_groups where id=p_group_id for key share;
   if not found then raise exception 'Offer group missing'; end if;
  end if;
  update public.products set offer_group_id=p_group_id,updated_at=now() where id=p_product_id;
  new_id:=p_product_id;
  action_name:='PRODUCT_OFFER_GROUP_CHANGED';
  prev:=jsonb_build_object('offer_group_id',old_product.offer_group_id);
  next:=jsonb_build_object('offer_group_id',p_group_id);
 else
  if p_action='save' then
   new_name:=btrim(coalesce(p_title,''));
   if length(new_name) not between 1 and 200 then raise exception 'Invalid offer title'; end if;
   if p_id is null then
    insert into public.offer_groups(canonical_title) values(new_name) returning id into new_id;
    action_name:='OFFER_GROUP_CREATED';
    next:=jsonb_build_object('canonical_title',new_name);
   end if;
  end if;
  if new_id is null then
   if p_id is null then raise exception 'Offer group ID required'; end if;
   select * into old_group from public.offer_groups where id=p_id for update;
   if not found then raise exception 'Offer group missing'; end if;
   new_id:=p_id;
   prev:=jsonb_build_object('canonical_title',old_group.canonical_title,
    'featured',old_group.is_featured_on_hub,'priority',old_group.featured_priority,
    'starts_at',old_group.featured_starts_at,'ends_at',old_group.featured_ends_at);
   if p_action='save' then
    update public.offer_groups set canonical_title=new_name,updated_at=now() where id=p_id;
    action_name:='OFFER_GROUP_UPDATED';
    next:=jsonb_build_object('canonical_title',new_name);
   elsif p_action='delete' then
    perform 1 from public.products where offer_group_id=p_id limit 1;
    if found then raise exception 'Cannot delete group linked to products'; end if;
    delete from public.offer_groups where id=p_id;
    action_name:='OFFER_GROUP_DELETED';
    next:='{}'::jsonb;
   elsif p_action='feature' then
    if p_feature is null or jsonb_typeof(p_feature)<>'object' or p_feature='{}'::jsonb
      or exists(select 1 from jsonb_object_keys(p_feature) as k(key)
        where k.key not in ('is_featured_on_hub','featured_priority','featured_starts_at','featured_ends_at'))
    then raise exception 'Invalid featured payload'; end if;
    v_featured:=case when p_feature ? 'is_featured_on_hub'
      then (p_feature->>'is_featured_on_hub')::boolean else old_group.is_featured_on_hub end;
    v_priority:=case when p_feature ? 'featured_priority'
      then (p_feature->>'featured_priority')::integer else old_group.featured_priority end;
    v_start:=case when p_feature ? 'featured_starts_at'
      then (p_feature->>'featured_starts_at')::timestamptz else old_group.featured_starts_at end;
    v_end:=case when p_feature ? 'featured_ends_at'
      then (p_feature->>'featured_ends_at')::timestamptz else old_group.featured_ends_at end;
    if v_priority not between 0 and 100 or (v_start is not null and v_end is not null and v_end<v_start)
    then raise exception 'Invalid featured scheduling'; end if;
    update public.offer_groups set
     is_featured_on_hub=v_featured,featured_priority=v_priority,
     featured_starts_at=v_start,featured_ends_at=v_end,updated_at=now()
    where id=p_id;
    action_name:='OFFER_GROUP_FEATURE_UPDATED';
    next:=jsonb_build_object('featured',v_featured,'priority',v_priority,
      'starts_at',v_start,'ends_at',v_end);
   end if;
  end if;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values (p_actor,null,action_name,
  case when p_action='assign' then 'products' else 'offer_groups' end,
  new_id,prev,next);
 return jsonb_build_object('id',new_id,'action',p_action);
end;
$rubi$;
revoke all on function public.rubi_manage_offer_group_audited(text,uuid,text,uuid,uuid,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_offer_group_audited(text,uuid,text,uuid,uuid,jsonb,uuid)
 to service_role;
-- Public SELECT policies remain unchanged. Mutations must use the audited server RPC.
revoke insert,update,delete on public.offer_groups from public,anon,authenticated;
