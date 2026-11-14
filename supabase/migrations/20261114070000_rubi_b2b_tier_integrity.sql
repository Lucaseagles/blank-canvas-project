-- RUBI Sprint 190: preserve profitable, descending B2B price tiers.
-- Existing stock is zero at rollout; no orders or offers are fabricated.
create or replace function public.rubi_save_b2b_tier_audited(
 p_product_id uuid,p_min_quantity integer,p_unit_price numeric,p_actor uuid
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare
 current_product public.hub_products%rowtype;
 old_tier public.hub_b2b_tiers%rowtype;
 lower_price numeric;
 upper_price numeric;
 result_id uuid;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
   where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_min_quantity is null or p_min_quantity<1 or p_min_quantity>100000
  or p_unit_price is null or p_unit_price<=0 or p_unit_price>100000
  or p_unit_price<>round(p_unit_price,2)
 then raise exception 'Invalid quantity or monetary precision'; end if;
 -- Product lock serializes all B2B tier edits for this SKU.
 select p.* into current_product from public.hub_products p
  where p.id=p_product_id for update;
 if not found then raise exception 'Product not found'; end if;
 if current_product.b2b_base_price is null or current_product.b2b_base_price<=0
  or current_product.b2b_base_price<=current_product.supplier_cost
  or p_min_quantity<current_product.min_b2b_quantity
  or p_min_quantity>100000
 then raise exception 'Valid base B2B price and minimum quantity required'; end if;
 if p_unit_price<=current_product.supplier_cost then
   raise exception 'Price must exceed supplier cost; additional charges still require review'; end if;
 select t.* into old_tier from public.hub_b2b_tiers t
   where t.product_id=p_product_id and t.min_quantity=p_min_quantity for update;
 -- Find the immediately adjacent tiers, not merely the currently active quote tier.
 select t.unit_price into lower_price from public.hub_b2b_tiers t
  where t.product_id=p_product_id and t.min_quantity<p_min_quantity
  order by t.min_quantity desc limit 1;
 select t.unit_price into upper_price from public.hub_b2b_tiers t
  where t.product_id=p_product_id and t.min_quantity>p_min_quantity
  order by t.min_quantity asc limit 1;
 if p_unit_price>=coalesce(lower_price,current_product.b2b_base_price)
   or (upper_price is not null and p_unit_price<=upper_price)
 then raise exception 'Tiers must strictly reduce unit price as quantity increases'; end if;
 if old_tier.id is not null and old_tier.unit_price=p_unit_price
 then raise exception 'No price change requested'; end if;
 if old_tier.id is not null then
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
 jsonb_build_object('product_id',p_product_id,'min_quantity',p_min_quantity,
  'unit_price',p_unit_price,'supplier_cost_checked',true,'strict_decrease_checked',true));
 return query select result_id;
end;
$$;
revoke all on function public.rubi_save_b2b_tier_audited(uuid,integer,numeric,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_b2b_tier_audited(uuid,integer,numeric,uuid)
 to service_role;
