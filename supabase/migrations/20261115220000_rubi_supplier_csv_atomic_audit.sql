-- Sprint 217 — Supplier CSV imports: one Owner-authorized transaction for
-- products and the Master audit trail. No external checkout, sale or payment is created.
create or replace function public.rubi_import_supplier_drafts_audited(
 p_supplier_id uuid, p_rows jsonb, p_actor uuid
) returns integer
language plpgsql security invoker set search_path=''
as $rubi$
declare
 row_data jsonb;
 product_id uuid;
 supplier_sku text;
 name_value text;
 description_value text;
 category_value text;
 image_value text;
 retail_value numeric;
 cost_value numeric;
 inserted integer := 0;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_supplier_id is null or jsonb_typeof(p_rows) is distinct from 'array'
   or jsonb_array_length(p_rows) not between 1 and 50
 then raise exception 'Invalid supplier CSV batch'; end if;

 -- Serialize imports to close case-insensitive and concurrent duplicate SKU races.
 -- Existing UNIQUE(sku) remains the database backstop.
 perform pg_advisory_xact_lock(20261115, 217);
 perform 1 from public.hub_suppliers s
  where s.id=p_supplier_id and s.active=true for share;
 if not found then raise exception 'Supplier not found or inactive'; end if;

 for row_data in select value from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(row_data) is distinct from 'object' then
   raise exception 'Invalid supplier row'; end if;

  name_value:=btrim(coalesce(row_data->>'title',''));
  description_value:=nullif(btrim(coalesce(row_data->>'description','')),'');
  category_value:=nullif(btrim(coalesce(row_data->>'category','')),'');
  supplier_sku:=nullif(btrim(coalesce(row_data->>'sku','')),'');
  image_value:=nullif(btrim(coalesce(row_data->>'image_url','')),'');
  retail_value:=nullif(row_data->>'retail_price','')::numeric;
  cost_value:=nullif(row_data->>'supplier_cost','')::numeric;

  if length(name_value) not between 3 and 180
   or length(coalesce(description_value,''))>2000
   or length(coalesce(category_value,''))>80
   or length(coalesce(supplier_sku,''))>80
   or length(coalesce(image_value,''))>2000
   or retail_value is null or retail_value<=0 or retail_value>99999999.99
   or retail_value<>round(retail_value,2)
   or cost_value is null or cost_value<0 or cost_value>99999999.99
   or cost_value<>round(cost_value,2)
  then raise exception 'Invalid supplier draft fields'; end if;

  if image_value is not null and (
    image_value !~* '^https://[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([:/?#]|$)'
    or image_value ~ '@'
  ) then raise exception 'Image URL must be external HTTPS without credentials'; end if;

  -- hub_products has a GLOBAL unique SKU, not supplier-specific.
  if supplier_sku is not null and exists (
   select 1 from public.hub_products p
   where lower(btrim(p.sku))=lower(supplier_sku)
  ) then raise exception 'SKU already exists'; end if;

  insert into public.hub_products(
   supplier_id,title,description,category,sku,image_url,
   retail_price,supplier_cost,b2b_base_price,min_b2b_quantity,
   active,checkout_verified,checkout_url
  ) values (
   p_supplier_id,name_value,description_value,category_value,supplier_sku,image_value,
   retail_value,cost_value,null,1,false,false,null
  ) returning id into product_id;

  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
   p_actor,null,'RUBI_SUPPLIER_CSV_DRAFT_IMPORTED','hub_product',product_id,
   '{}'::jsonb,jsonb_build_object(
    'supplier_id',p_supplier_id,'sku',supplier_sku,
    'active',false,'checkout_verified',false
   )
  );
  inserted:=inserted+1;
 end loop;
 return inserted;
end;
$rubi$;
revoke all on function public.rubi_import_supplier_drafts_audited(uuid,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_import_supplier_drafts_audited(uuid,jsonb,uuid)
 to service_role;
comment on function public.rubi_import_supplier_drafts_audited(uuid,jsonb,uuid)
 is 'Owner-audited supplier CSV draft import; atomic all-or-nothing and deliberately no checkout or paid sales.';
