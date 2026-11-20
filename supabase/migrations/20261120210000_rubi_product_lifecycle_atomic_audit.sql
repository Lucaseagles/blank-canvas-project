-- Sprint 298: legacy admin product create/edit/duplicate paths now share an atomic Owner audit boundary.
-- Existing reads and public catalog visibility are unchanged.
create or replace function public.rubi_manage_catalog_product_audited(
 p_action text,
 p_product_id uuid,
 p_payload jsonb,
 p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
 old_row public.products%rowtype;
 new_row public.products%rowtype;
 new_id uuid;
 new_slug text;
 v_title text;
 v_status text;
 v_category uuid;
 v_marketplace uuid;
 v_price numeric;
 v_previous numeric;
 v_discount numeric;
 v_rating numeric;
 v_reviews integer;
 v_images text[];
 v_payload jsonb;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action is null or p_action not in ('save','duplicate') then raise exception 'Invalid product action'; end if;
 if p_action='save' then
  if jsonb_typeof(p_payload) is distinct from 'object'
   or length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 300
   or length(coalesce(p_payload->>'description',''))>10000
   or coalesce(p_payload->>'affiliate_url','') !~* '^https://[^[:space:]]+$'
   or coalesce(p_payload->>'current_price','') !~ '^[0-9]+([.][0-9]{1,2})?$'
   or (p_payload->>'current_price')::numeric<=0
   or (p_payload->>'current_price')::numeric>10000000
   or coalesce(p_payload->>'status','') not in ('draft','published','archived','active')
   or jsonb_typeof(p_payload->'images') is distinct from 'array'
   or jsonb_typeof(p_payload->'free_shipping') is distinct from 'boolean'
  then raise exception 'Invalid product data'; end if;
  v_title:=btrim(p_payload->>'title');
  v_status:=p_payload->>'status';
  v_category:=nullif(p_payload->>'category_id','')::uuid;
  v_marketplace:=nullif(p_payload->>'marketplace_id','')::uuid;
  v_price:=(p_payload->>'current_price')::numeric;
  v_previous:=nullif(p_payload->>'previous_price','')::numeric;
  v_discount:=nullif(p_payload->>'discount','')::numeric;
  v_rating:=nullif(p_payload->>'rating','')::numeric;
  v_reviews:=nullif(p_payload->>'review_count','')::integer;
  select coalesce(array_agg(value),array[]::text[]) into v_images
   from jsonb_array_elements_text(p_payload->'images') as image(value);
  if v_previous is not null and (v_previous<0 or v_previous>10000000)
   or v_discount is not null and (v_discount<0 or v_discount>100)
   or v_rating is not null and (v_rating<0 or v_rating>5)
   or v_reviews is not null and v_reviews<0
  then raise exception 'Product numeric field is out of range'; end if;
  if v_category is not null and not exists(select 1 from public.categories c where c.id=v_category and c.is_active=true)
   then raise exception 'Category must be active'; end if;
  if v_marketplace is not null and not exists(select 1 from public.marketplaces m where m.id=v_marketplace)
   then raise exception 'Marketplace not found'; end if;
  if v_status='published' and (
   v_category is null or v_marketplace is null
   or nullif(btrim(coalesce(p_payload->>'description','')),'') is null
   or cardinality(v_images)=0
  ) then raise exception 'Published product is missing required catalog data'; end if;
  if p_product_id is null then
   new_id:=gen_random_uuid();
   new_slug:=left(trim(both '-' from regexp_replace(lower(v_title),'[^a-z0-9]+','-','g')),120);
   new_slug:=coalesce(nullif(new_slug,''),'produto')||'-'||left(new_id::text,8);
   insert into public.products(
    id,slug,title,description,images,category_id,marketplace_id,external_product_id,
    affiliate_url,current_price,previous_price,discount,rating,review_count,status,
    free_shipping,created_at,updated_at
   ) values(
    new_id,new_slug,v_title,nullif(btrim(p_payload->>'description'),''),v_images,
    v_category,v_marketplace,nullif(btrim(p_payload->>'external_product_id'),''),
    btrim(p_payload->>'affiliate_url'),v_price,v_previous,v_discount,v_rating,v_reviews,
    v_status,(p_payload->>'free_shipping')::boolean,now(),now()
   ) returning * into new_row;
   insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,null,'RUBI_PRODUCT_CREATED','product',new_id,'{}'::jsonb,
    jsonb_build_object('title',new_row.title,'slug',new_row.slug,'description',new_row.description,
     'status',new_row.status,'current_price',new_row.current_price,'previous_price',new_row.previous_price,
     'discount',new_row.discount,'rating',new_row.rating,'review_count',new_row.review_count,
     'category_id',new_row.category_id,'marketplace_id',new_row.marketplace_id,
     'image_count',cardinality(new_row.images),'free_shipping',new_row.free_shipping,
     'affiliate_host',split_part(coalesce(new_row.affiliate_url,''),'/',3)));
  else
   select * into old_row from public.products p where p.id=p_product_id for update;
   if not found then raise exception 'Product not found'; end if;
   update public.products p set
    title=v_title,description=nullif(btrim(p_payload->>'description'),''),
    images=v_images,category_id=v_category,marketplace_id=v_marketplace,
    external_product_id=nullif(btrim(p_payload->>'external_product_id'),''),
    affiliate_url=btrim(p_payload->>'affiliate_url'),current_price=v_price,
    previous_price=v_previous,discount=v_discount,rating=v_rating,
    review_count=v_reviews,status=v_status,free_shipping=(p_payload->>'free_shipping')::boolean,
    updated_at=now()
   where p.id=p_product_id returning * into new_row;
   insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
   values(p_actor,null,'RUBI_PRODUCT_UPDATED','product',p_product_id,
    jsonb_build_object('title',old_row.title,'description',old_row.description,'status',old_row.status,
     'current_price',old_row.current_price,'previous_price',old_row.previous_price,
     'discount',old_row.discount,'rating',old_row.rating,'review_count',old_row.review_count,
     'category_id',old_row.category_id,'marketplace_id',old_row.marketplace_id,
     'image_count',cardinality(old_row.images),'free_shipping',old_row.free_shipping,
     'affiliate_host',split_part(coalesce(old_row.affiliate_url,''),'/',3)),
    jsonb_build_object('title',new_row.title,'description',new_row.description,'status',new_row.status,
     'current_price',new_row.current_price,'previous_price',new_row.previous_price,
     'discount',new_row.discount,'rating',new_row.rating,'review_count',new_row.review_count,
     'category_id',new_row.category_id,'marketplace_id',new_row.marketplace_id,
     'image_count',cardinality(new_row.images),'free_shipping',new_row.free_shipping,
     'affiliate_host',split_part(coalesce(new_row.affiliate_url,''),'/',3)));
  end if;
  return to_jsonb(new_row);
 end if;

 if p_product_id is null then raise exception 'Source product ID required'; end if;
 select * into old_row from public.products p where p.id=p_product_id for share;
 if not found then raise exception 'Source product not found'; end if;
 new_id:=gen_random_uuid();
 new_slug:=left(trim(both '-' from regexp_replace(lower(old_row.title),'[^a-z0-9]+','-','g')),120);
 new_slug:=coalesce(nullif(new_slug,''),'produto')||'-'||left(new_id::text,8);
 insert into public.products(
  id,slug,title,description,images,category_id,marketplace_id,external_product_id,
  affiliate_url,current_price,previous_price,discount,rating,review_count,status,
  free_shipping,created_at,updated_at
 ) values(
  new_id,new_slug,left(old_row.title||' (cópia)',300),old_row.description,old_row.images,
  old_row.category_id,old_row.marketplace_id,old_row.external_product_id,
  old_row.affiliate_url,old_row.current_price,old_row.previous_price,old_row.discount,
  old_row.rating,old_row.review_count,'draft',old_row.free_shipping,now(),now()
 ) returning * into new_row;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_PRODUCT_DUPLICATED','product',new_id,
  jsonb_build_object('source_product_id',p_product_id,'source_title',old_row.title),
  jsonb_build_object('title',new_row.title,'slug',new_row.slug,'description',new_row.description,
   'current_price',new_row.current_price,'status','draft','category_id',new_row.category_id,
   'marketplace_id',new_row.marketplace_id,'image_count',cardinality(new_row.images),
   'free_shipping',new_row.free_shipping));
 return to_jsonb(new_row);
end;
$fn$;

revoke all on function public.rubi_manage_catalog_product_audited(text,uuid,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_catalog_product_audited(text,uuid,jsonb,uuid)
 to service_role;
comment on function public.rubi_manage_catalog_product_audited(text,uuid,jsonb,uuid)
 is 'Owner-gated atomic product create/update/duplicate with sanitized admin audit; preserves public catalog reads.';
