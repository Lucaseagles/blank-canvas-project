-- Sprint 211: category CRUD/reorder and audit share a single Owner transaction.
-- Public category reads remain unchanged.
create or replace function public.rubi_manage_category_audited(
 p_action text,p_id uuid,p_payload jsonb,p_ids uuid[],p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $rubi$
declare
 old_category public.categories%rowtype;
 new_id uuid;
 v_name text;
 v_slug text;
 v_parent uuid;
 v_order integer;
 v_active boolean;
 v_parent_active boolean;
 v_next uuid;
 v_visited uuid[];
 v_description text;
 v_icon text;
 v_image text;
 v_color text;
 rec record;
 row_count integer;
 action_name text;
 prev jsonb:='{}'::jsonb;
 next jsonb:='{}'::jsonb;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles u where u.user_id=p_actor and u.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('save','reorder','delete') then raise exception 'Unknown category action'; end if;
 perform pg_advisory_xact_lock(20261115,211);
 if p_action='reorder' then
  if p_ids is null or cardinality(p_ids)<1 or cardinality(p_ids)>500
   or array_position(p_ids,null) is not null
   or (select count(distinct v) from unnest(p_ids) v)<>cardinality(p_ids)
  then raise exception 'Invalid category order'; end if;
  select count(*) into row_count from public.categories c where c.id=any(p_ids);
  if row_count<>cardinality(p_ids) then raise exception 'Category list incomplete'; end if;
  for rec in select c.id,c.display_order from public.categories c
    where c.id=any(p_ids) order by c.id for update loop
    update public.categories c set display_order=(array_position(p_ids,rec.id)-1)
      where c.id=rec.id;
    insert into public.admin_audit_log(
     actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
    ) values(
     p_actor,null,'RUBI_CATEGORY_REORDERED','category',rec.id,
     jsonb_build_object('display_order',rec.display_order),
     jsonb_build_object('display_order',array_position(p_ids,rec.id)-1)
    );
  end loop;
  return jsonb_build_object('count',row_count);
 end if;
 if p_action='delete' then
  if p_id is null then raise exception 'Category ID required'; end if;
  select * into old_category from public.categories where id=p_id for update;
  if not found then raise exception 'Category not found'; end if;
  perform 1 from public.categories where parent_id=p_id limit 1;
  if found then raise exception 'Category has subcategories'; end if;
  perform 1 from public.products where category_id=p_id limit 1;
  if found then raise exception 'Category has linked products'; end if;
  delete from public.categories where id=p_id;
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values(
   p_actor,null,'RUBI_CATEGORY_DELETED','category',p_id,
   jsonb_build_object('name',old_category.name,'slug',old_category.slug),
   '{}'::jsonb
  );
  return jsonb_build_object('id',p_id);
 end if;
 if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Category payload required'; end if;
 v_name:=btrim(coalesce(p_payload->>'name',''));
 v_slug:=btrim(coalesce(p_payload->>'slug',''));
 v_parent:=nullif(p_payload->>'parent_id','')::uuid;
 v_active:=coalesce((p_payload->>'is_active')::boolean,true);
 v_order:=coalesce((p_payload->>'display_order')::integer,0);
 v_description:=nullif(btrim(coalesce(p_payload->>'description','')),'');
 v_icon:=nullif(btrim(coalesce(p_payload->>'icon','')),'');
 v_image:=nullif(btrim(coalesce(p_payload->>'image_url','')),'');
 v_color:=nullif(btrim(coalesce(p_payload->>'color','')),'');
 if length(v_name) not between 2 and 120
  or length(v_slug) not between 2 and 120
  or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  or v_order not between 0 and 100000
 then raise exception 'Invalid category attributes'; end if;
 if v_parent is not null then
  if p_id=v_parent then raise exception 'Self parent forbidden'; end if;
  select coalesce(is_active,false) into v_parent_active from public.categories where id=v_parent;
  if not found then raise exception 'Parent category not found'; end if;
  if v_active and not v_parent_active then raise exception 'Active category cannot use inactive parent'; end if;
  v_visited:=array[]::uuid[];
  v_next:=v_parent;
  while v_next is not null loop
   if v_next=any(v_visited) or (p_id is not null and v_next=p_id) then
    raise exception 'Category parent cycle'; end if;
   v_visited:=array_append(v_visited,v_next);
   select parent_id into v_next from public.categories where id=v_next;
   if not found then raise exception 'Broken parent chain'; end if;
  end loop;
 end if;
 if p_id is null then
  insert into public.categories(
   name,slug,parent_id,icon,is_active,image_url,color,display_order,description
  ) values(
   v_name,v_slug,v_parent,v_icon,v_active,v_image,v_color,v_order,v_description
  ) returning id into new_id;
  action_name:='RUBI_CATEGORY_CREATED';
 else
  select * into old_category from public.categories where id=p_id for update;
  if not found then raise exception 'Category not found'; end if;
  if not v_active then
   perform 1 from public.categories where parent_id=p_id and is_active=true limit 1;
   if found then raise exception 'Active subcategory must be deactivated first'; end if;
  end if;
  update public.categories set
   name=v_name,slug=v_slug,parent_id=v_parent,icon=v_icon,is_active=v_active,
   image_url=v_image,color=v_color,display_order=v_order,description=v_description
  where id=p_id;
  new_id:=p_id;
  action_name:='RUBI_CATEGORY_UPDATED';
  prev:=jsonb_build_object('name',old_category.name,'slug',old_category.slug,
    'parent_id',old_category.parent_id,'active',old_category.is_active,
    'display_order',old_category.display_order);
 end if;
 next:=jsonb_build_object('name',v_name,'slug',v_slug,'parent_id',v_parent,
   'active',v_active,'display_order',v_order);
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,action_name,'category',new_id,prev,next);
 return jsonb_build_object('id',new_id);
end;
$rubi$;
revoke all on function public.rubi_manage_category_audited(text,uuid,jsonb,uuid[],uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_category_audited(text,uuid,jsonb,uuid[],uuid)
 to service_role;
revoke insert,update,delete on public.categories from public,anon,authenticated;
