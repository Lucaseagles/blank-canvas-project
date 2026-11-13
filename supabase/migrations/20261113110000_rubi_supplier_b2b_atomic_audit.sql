-- Sprint 170: audited supplier identity/checkout host and B2B price tiers.
alter table public.hub_suppliers
 add column if not exists revision integer not null default 1 check(revision>0);

create or replace function public.rubi_save_supplier_audited(
 p_id uuid,p_revision integer,p_name text,p_mode text,p_active boolean,p_host text,p_actor uuid
) returns table(saved_id uuid,saved_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare
 old_supplier public.hub_suppliers%rowtype;
 result_id uuid;
 result_revision integer;
 before_data jsonb;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if char_length(btrim(coalesce(p_name,'')))<2 or char_length(p_name)>160
    or p_mode not in ('supplier','hub') then raise exception 'Invalid supplier fields'; end if;
 if p_host is not null and (
  p_host<>lower(p_host) or p_host like '%/%' or p_host like '%:%'
  or char_length(p_host)>253 or p_host !~ '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
 ) then raise exception 'Invalid checkout host'; end if;
 if p_id is null then
  if p_revision is not null then raise exception 'Unexpected supplier revision'; end if;
  insert into public.hub_suppliers(name,fulfillment_mode,active,checkout_host)
   values(p_name,p_mode,p_active,p_host)
   returning id,revision into result_id,result_revision;
  before_data:='{}'::jsonb;
 else
  select s.* into old_supplier from public.hub_suppliers s where s.id=p_id for update;
  if not found or old_supplier.revision is distinct from p_revision then
   raise exception 'Supplier changed; reload before saving';
  end if;
  if old_supplier.checkout_host is distinct from p_host then
   if exists(select 1 from public.hub_products p where p.supplier_id=p_id
     and (p.active or p.checkout_verified)) then
    raise exception 'Unpublish and unverify associated products before changing supplier host';
   end if;
  end if;
  before_data:=jsonb_build_object('revision',old_supplier.revision,
   'active',old_supplier.active,'fulfillment_mode',old_supplier.fulfillment_mode,
   'host_changed',old_supplier.checkout_host is distinct from p_host);
  update public.hub_suppliers s
   set name=p_name,fulfillment_mode=p_mode,active=p_active,checkout_host=p_host,
    revision=old_supplier.revision+1
   where s.id=p_id returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(
 actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,
 case when p_id is null then 'RUBI_SUPPLIER_CREATED' else 'RUBI_SUPPLIER_UPDATED' end,
 'hub_supplier',result_id,before_data,
 jsonb_build_object('revision',result_revision,'active',p_active,'fulfillment_mode',p_mode,
  'host_configured',p_host is not null));
 return query select result_id,result_revision;
end;
$$;
revoke all on function public.rubi_save_supplier_audited(uuid,integer,text,text,boolean,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_supplier_audited(uuid,integer,text,text,boolean,text,uuid)
 to service_role;

create or replace function public.rubi_save_b2b_tier_audited(
 p_product_id uuid,p_min_quantity integer,p_unit_price numeric,p_actor uuid
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare
 current_product public.hub_products%rowtype;
 old_tier public.hub_b2b_tiers%rowtype;
 result_id uuid;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
   where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_min_quantity is null or p_min_quantity<1 or p_min_quantity>10000000
   or p_unit_price is null or p_unit_price<=0 then
  raise exception 'Invalid B2B tier'; end if;
 select p.* into current_product from public.hub_products p
  where p.id=p_product_id for update;
 if not found then raise exception 'Product not found'; end if;
 if current_product.b2b_base_price is null or current_product.b2b_base_price<=0
  or p_min_quantity<current_product.min_b2b_quantity then
  raise exception 'B2B price and minimum quantity must be configured'; end if;
 select t.* into old_tier from public.hub_b2b_tiers t
  where t.product_id=p_product_id and t.min_quantity=p_min_quantity for update;
 if found then
  update public.hub_b2b_tiers t set unit_price=p_unit_price
   where t.id=old_tier.id returning id into result_id;
 else
  insert into public.hub_b2b_tiers(product_id,min_quantity,unit_price)
   values(p_product_id,p_min_quantity,p_unit_price) returning id into result_id;
 end if;
 insert into public.admin_audit_log(
 actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,
 case when old_tier.id is null then 'RUBI_B2B_TIER_CREATED' else 'RUBI_B2B_TIER_UPDATED' end,
 'hub_b2b_tier',result_id,
 case when old_tier.id is null then '{}'::jsonb
  else jsonb_build_object('min_quantity',old_tier.min_quantity,'unit_price',old_tier.unit_price) end,
 jsonb_build_object('product_id',p_product_id,'min_quantity',p_min_quantity,'unit_price',p_unit_price));
 return query select result_id;
end;
$$;
revoke all on function public.rubi_save_b2b_tier_audited(uuid,integer,numeric,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_b2b_tier_audited(uuid,integer,numeric,uuid)
 to service_role;
