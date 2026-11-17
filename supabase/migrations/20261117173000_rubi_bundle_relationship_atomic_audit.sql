create or replace function public.rubi_manage_bundle_audited(
 p_action text,p_id uuid,p_payload jsonb,p_actor uuid
) returns jsonb
language plpgsql security invoker set search_path=''
as $fn$
declare
 old_bundle public.bundles%rowtype;
 new_bundle public.bundles%rowtype;
 old_relation public.product_relationships%rowtype;
 new_relation public.product_relationships%rowtype;
 v_bundle_id uuid;
 v_product_ids uuid[];
 v_product_count integer;
 v_unique_count integer;
 v_existing_count integer;
 v_old_products jsonb;
 v_new_products jsonb;
 v_previous jsonb;
 v_next jsonb;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then
  raise exception 'Owner authorization required';
 end if;
 if p_action not in ('save','delete','relationship_create','relationship_delete') then raise exception 'Invalid bundle action'; end if;

 if p_action='save' then
  if jsonb_typeof(p_payload) is distinct from 'object'
   or length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 200
   or length(btrim(coalesce(p_payload->>'slug',''))) not between 1 and 200
   or coalesce(p_payload->>'slug','') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
   or length(coalesce(p_payload->>'description',''))>5000
   or (nullif(p_payload->>'bundle_discount_price','') is not null and (p_payload->>'bundle_discount_price')::numeric<0)
   or (nullif(p_payload->>'image_url','') is not null and p_payload->>'image_url' !~ '^https?://[^[:space:]]+$') then
   raise exception 'Invalid bundle data';
  end if;

  if p_id is not null then
   select * into old_bundle from public.bundles where id=p_id for update;
   if not found then raise exception 'Bundle not found'; end if;
   select coalesce(jsonb_agg(jsonb_build_object('id',bp.product_id,'position',bp.position) order by bp.position,bp.product_id),'[]'::jsonb)
    into v_old_products from public.bundle_products bp where bp.bundle_id=p_id;
   v_previous:=jsonb_build_object('title',old_bundle.title,'slug',old_bundle.slug,'is_active',old_bundle.is_active,
    'bundle_discount_price',old_bundle.bundle_discount_price,'products',v_old_products);
  else
   v_old_products:='[]'::jsonb; v_previous:='{}'::jsonb;
  end if;

  if p_payload ? 'products' then
   if jsonb_typeof(p_payload->'products') is distinct from 'array' or jsonb_array_length(p_payload->'products')>100 then
    raise exception 'Invalid bundle products list';
   end if;
   if exists(
    select 1 from jsonb_array_elements(p_payload->'products') as items(item)
    where jsonb_typeof(item) is distinct from 'object'
      or coalesce(item->>'id','') = ''
      or coalesce(item->>'position','') = ''
   ) then raise exception 'Invalid bundle product entry'; end if;
   v_product_ids:=array(select (item->>'id')::uuid from jsonb_array_elements(p_payload->'products') as items(item));
   select count(*),count(distinct product_id) into v_product_count,v_unique_count from unnest(v_product_ids) as ids(product_id);
   if v_product_count<>v_unique_count then raise exception 'Duplicate product in bundle'; end if;
   select count(*) into v_existing_count from public.products where id=any(v_product_ids);
   if v_existing_count<>v_product_count then raise exception 'One or more bundle products do not exist'; end if;
   perform id from public.products where id=any(v_product_ids) order by id for key share;
  end if;

  if p_id is null then
   insert into public.bundles(title,slug,description,image_url,is_active,bundle_discount_price)
   values(btrim(p_payload->>'title'),btrim(p_payload->>'slug'),nullif(p_payload->>'description',''),
    nullif(p_payload->>'image_url',''),coalesce((p_payload->>'is_active')::boolean,true),
    nullif(p_payload->>'bundle_discount_price','')::numeric) returning * into new_bundle;
  else
   update public.bundles set title=btrim(p_payload->>'title'),slug=btrim(p_payload->>'slug'),
    description=case when p_payload ? 'description' then nullif(p_payload->>'description','') else old_bundle.description end,
    image_url=case when p_payload ? 'image_url' then nullif(p_payload->>'image_url','') else old_bundle.image_url end,
    is_active=coalesce((p_payload->>'is_active')::boolean,true),
    bundle_discount_price=case when p_payload ? 'bundle_discount_price' then nullif(p_payload->>'bundle_discount_price','')::numeric else old_bundle.bundle_discount_price end
   where id=p_id returning * into new_bundle;
  end if;
  v_bundle_id:=new_bundle.id;

  if p_payload ? 'products' then
   delete from public.bundle_products where bundle_id=v_bundle_id;
   insert into public.bundle_products(bundle_id,product_id,position)
   select v_bundle_id,(item->>'id')::uuid,(item->>'position')::integer
   from jsonb_array_elements(p_payload->'products') as items(item);
   v_new_products:=p_payload->'products';
  elsif p_id is null then v_new_products:='[]'::jsonb;
  else v_new_products:=v_old_products;
  end if;

  v_next:=jsonb_build_object('title',new_bundle.title,'slug',new_bundle.slug,'is_active',new_bundle.is_active,
   'bundle_discount_price',new_bundle.bundle_discount_price,'products',v_new_products);
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,case when p_id is null then 'RUBI_BUNDLE_CREATED' else 'RUBI_BUNDLE_UPDATED' end,
   'bundle',v_bundle_id,v_previous,v_next);
  return jsonb_build_object('id',v_bundle_id,'success',true);
 end if;

 if p_action='delete' then
  if p_id is null then raise exception 'Bundle ID required'; end if;
  select * into old_bundle from public.bundles where id=p_id for update;
  if not found then raise exception 'Bundle not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',bp.product_id,'position',bp.position) order by bp.position,bp.product_id),'[]'::jsonb)
   into v_old_products from public.bundle_products bp where bp.bundle_id=p_id;
  delete from public.bundles where id=p_id;
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_BUNDLE_DELETED','bundle',p_id,
   jsonb_build_object('title',old_bundle.title,'slug',old_bundle.slug,'is_active',old_bundle.is_active,
    'bundle_discount_price',old_bundle.bundle_discount_price,'products',v_old_products),'{}'::jsonb);
  return jsonb_build_object('id',p_id,'success',true);
 end if;

 if p_action='relationship_create' then
  if jsonb_typeof(p_payload) is distinct from 'object'
   or coalesce(p_payload->>'product_id','')='' or coalesce(p_payload->>'related_product_id','')=''
   or p_payload->>'product_id'=p_payload->>'related_product_id'
   or coalesce(p_payload->>'type','') not in ('CROSS_SELL','UPSELL','DOWNSELL') then
   raise exception 'Invalid product relationship';
  end if;
  v_product_ids:=array[(p_payload->>'product_id')::uuid,(p_payload->>'related_product_id')::uuid];
  perform id from public.products where id=any(v_product_ids) order by id for key share;
  select count(*) into v_existing_count from public.products where id=any(v_product_ids);
  if v_existing_count<>2 then raise exception 'One or both products do not exist'; end if;
  insert into public.product_relationships(product_id,related_product_id,type)
  values(v_product_ids[1],v_product_ids[2],(p_payload->>'type')::public.relationship_type) returning * into new_relation;
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_PRODUCT_RELATIONSHIP_CREATED','product_relationship',new_relation.id,'{}'::jsonb,
   jsonb_build_object('product_id',new_relation.product_id,'related_product_id',new_relation.related_product_id,'type',new_relation.type::text));
  return jsonb_build_object('id',new_relation.id,'success',true);
 end if;

 if p_action='relationship_delete' then
  if p_id is null then raise exception 'Relationship ID required'; end if;
  select * into old_relation from public.product_relationships where id=p_id for update;
  if not found then raise exception 'Product relationship not found'; end if;
  delete from public.product_relationships where id=p_id;
  insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
  values(p_actor,null,'RUBI_PRODUCT_RELATIONSHIP_DELETED','product_relationship',p_id,
   jsonb_build_object('product_id',old_relation.product_id,'related_product_id',old_relation.related_product_id,'type',old_relation.type::text),'{}'::jsonb);
  return jsonb_build_object('id',p_id,'success',true);
 end if;
 return '{}'::jsonb;
end;
$fn$;

revoke all on function public.rubi_manage_bundle_audited(text,uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.rubi_manage_bundle_audited(text,uuid,jsonb,uuid) to service_role;
comment on function public.rubi_manage_bundle_audited(text,uuid,jsonb,uuid)
 is 'Owner-gated atomic bundle and product relationship lifecycle with sanitized audit.';
revoke insert,update,delete on public.bundles from authenticated;
revoke insert,update,delete on public.bundle_products from authenticated;
revoke insert,update,delete on public.product_relationships from authenticated;
