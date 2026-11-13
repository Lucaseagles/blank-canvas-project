-- Sprint 169: product creation/editing and audit are a single transaction.
-- Every change to price, supplier, checkout and publication has an identified Owner.
alter table public.hub_products
 add column if not exists revision integer not null default 1 check (revision>0);

create or replace function public.rubi_save_hub_product_audited(
 p_id uuid,p_expected_revision integer,p_values jsonb,p_actor uuid
)
returns table(product_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare
 old_product public.hub_products%rowtype;
 supplier public.hub_suppliers%rowtype;
 saved_id uuid;
 saved_revision integer;
 changes jsonb;
 old_snapshot jsonb;
 new_snapshot jsonb;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then
  raise exception 'Owner authorization required';
 end if;
 if p_id is null and p_expected_revision is not null then raise exception 'Unexpected revision for new product'; end if;
 select s.* into supplier from public.hub_suppliers s
  where s.id=(p_values->>'supplier_id')::uuid for share;
 if not found then raise exception 'Supplier not found'; end if;
 if coalesce((p_values->>'active')::boolean,false) and not supplier.active then
  raise exception 'Supplier inactive';
 end if;
 if coalesce((p_values->>'checkout_verified')::boolean,false) and (
    lower(left(coalesce(p_values->>'checkout_url',''),8)) <> 'https://' or
    lower(split_part(split_part(p_values->>'checkout_url','/',3),':',1))
      is distinct from lower(supplier.checkout_host)
  ) then raise exception 'Verified checkout must match active supplier HTTPS host';
 end if;
 if (p_values->>'retail_price')::numeric < 0 or (p_values->>'supplier_cost')::numeric < 0 or
    nullif(p_values->>'b2b_base_price','')::numeric < 0 or
    (p_values->>'min_b2b_quantity')::integer < 1 then
  raise exception 'Invalid commercial values';
 end if;
 if coalesce((p_values->>'active')::boolean,false) and
   (coalesce((p_values->>'retail_price')::numeric,0)<=0 or
    not coalesce((p_values->>'checkout_verified')::boolean,false) or
    nullif(p_values->>'checkout_url','') is null) then
   raise exception 'An active product requires positive price and verified checkout';
 end if;
 if p_id is not null then
  select p.* into old_product from public.hub_products p where p.id=p_id for update;
  if not found or old_product.revision is distinct from p_expected_revision then
    raise exception 'Product changed; reload before saving';
  end if;
  changes:=jsonb_build_object(
   'supplier_id',old_product.supplier_id,'title',old_product.title,'sku',old_product.sku,
   'retail_price',old_product.retail_price,'supplier_cost',old_product.supplier_cost,
   'checkout_url',old_product.checkout_url);
  if (changes->>'supplier_id') is distinct from p_values->>'supplier_id' or
     (changes->>'title') is distinct from p_values->>'title' or
     coalesce(changes->>'sku','') is distinct from coalesce(p_values->>'sku','') or
     old_product.retail_price is distinct from (p_values->>'retail_price')::numeric or
     old_product.supplier_cost is distinct from (p_values->>'supplier_cost')::numeric or
     coalesce(changes->>'checkout_url','') is distinct from coalesce(p_values->>'checkout_url','') then
    if coalesce((p_values->>'active')::boolean,false) then
      raise exception 'Unpublish commercial changes before saving';
    end if;
    if coalesce((p_values->>'checkout_verified')::boolean,false) then
      raise exception 'Reverify checkout after commercial changes';
    end if;
  end if;
  old_snapshot:=jsonb_build_object('revision',old_product.revision,'active',old_product.active,
    'retail_price',old_product.retail_price,'supplier_cost',old_product.supplier_cost,
    'b2b_base_price',old_product.b2b_base_price,'min_b2b_quantity',old_product.min_b2b_quantity,
    'checkout_verified',old_product.checkout_verified,'supplier_id',old_product.supplier_id);
  update public.hub_products p set
   supplier_id=(p_values->>'supplier_id')::uuid,title=p_values->>'title',
   description=p_values->>'description',image_url=nullif(p_values->>'image_url',''),
   category=p_values->>'category',sku=nullif(p_values->>'sku',''),
   retail_price=(p_values->>'retail_price')::numeric,
   supplier_cost=(p_values->>'supplier_cost')::numeric,
   b2b_base_price=nullif(p_values->>'b2b_base_price','')::numeric,
   min_b2b_quantity=(p_values->>'min_b2b_quantity')::integer,
   active=(p_values->>'active')::boolean,
   checkout_url=nullif(p_values->>'checkout_url',''),
   checkout_verified=(p_values->>'checkout_verified')::boolean,
   revision=old_product.revision+1 where p.id=p_id
  returning p.id,p.revision into saved_id,saved_revision;
 else
  old_snapshot:='{}'::jsonb;
  insert into public.hub_products
   (supplier_id,title,description,image_url,category,sku,retail_price,supplier_cost,b2b_base_price,
    min_b2b_quantity,active,checkout_url,checkout_verified)
  values(
   (p_values->>'supplier_id')::uuid,p_values->>'title',p_values->>'description',
   nullif(p_values->>'image_url',''),p_values->>'category',nullif(p_values->>'sku',''),
   (p_values->>'retail_price')::numeric,(p_values->>'supplier_cost')::numeric,
   nullif(p_values->>'b2b_base_price','')::numeric,(p_values->>'min_b2b_quantity')::integer,
   (p_values->>'active')::boolean,nullif(p_values->>'checkout_url',''),
   (p_values->>'checkout_verified')::boolean)
  returning id,revision into saved_id,saved_revision;
 end if;
 new_snapshot:=jsonb_build_object('revision',saved_revision,
   'supplier_id',p_values->>'supplier_id',
   'retail_price',(p_values->>'retail_price')::numeric,
   'supplier_cost',(p_values->>'supplier_cost')::numeric,
   'b2b_base_price',nullif(p_values->>'b2b_base_price','')::numeric,
   'min_b2b_quantity',(p_values->>'min_b2b_quantity')::integer,
   'active',(p_values->>'active')::boolean,
   'checkout_verified',(p_values->>'checkout_verified')::boolean);
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,
  case when p_id is null then 'RUBI_PRODUCT_CREATED' else 'RUBI_PRODUCT_UPDATED' end,
  'hub_product',saved_id,old_snapshot,new_snapshot);
 return query select saved_id,saved_revision;
end;
$$;
revoke all on function public.rubi_save_hub_product_audited(uuid,integer,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.rubi_save_hub_product_audited(uuid,integer,jsonb,uuid) to service_role;
comment on function public.rubi_save_hub_product_audited(uuid,integer,jsonb,uuid) is
 'Owner-only transactional hub product create/update and sanitized Master audit; server additionally verifies HTTPS checkout host.';
