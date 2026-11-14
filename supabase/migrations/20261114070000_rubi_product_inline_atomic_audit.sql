-- Sprint 199. Inline edits must not succeed when the audit insert fails.
-- The function uses invoker permissions and is callable only by the server-side service role.
create or replace function public.rubi_update_product_inline_audited(
 p_product_id uuid,p_field text,p_value text,p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $fn$
declare
 product_row public.products%rowtype;
 selected_category uuid;
 selected_price numeric;
 saved jsonb;
begin
 if p_actor is null or not exists(
   select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_field not in ('current_price','category_id') then raise exception 'Field is not eligible for inline edit'; end if;
 select p.* into product_row from public.products p where p.id=p_product_id for update;
 if not found then raise exception 'Product not found'; end if;
 if p_field='current_price' then
   selected_price:=p_value::numeric;
   if selected_price is null or selected_price<=0 or selected_price>10000000
     or round(selected_price,2)<>selected_price then raise exception 'Invalid product price'; end if;
   update public.products p set current_price=selected_price,updated_at=now()
     where p.id=p_product_id returning jsonb_build_object('id',p.id,'current_price',p.current_price,'category_id',p.category_id) into saved;
 else
   selected_category:=p_value::uuid;
   if not exists(select 1 from public.categories c where c.id=selected_category and c.is_active=true)
     then raise exception 'Category must be active'; end if;
   update public.products p set category_id=selected_category,updated_at=now()
     where p.id=p_product_id returning jsonb_build_object('id',p.id,'current_price',p.current_price,'category_id',p.category_id) into saved;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,'RUBI_PRODUCT_INLINE_UPDATED','product',p_product_id,
  case when p_field='current_price'
   then jsonb_build_object('field',p_field,'value',product_row.current_price)
   else jsonb_build_object('field',p_field,'value',product_row.category_id) end,
  jsonb_build_object('field',p_field,'value',case when p_field='current_price'
   then to_jsonb(selected_price) else to_jsonb(selected_category) end)
 );
 return saved;
end;
$fn$;
revoke all on function public.rubi_update_product_inline_audited(uuid,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_update_product_inline_audited(uuid,text,text,uuid)
 to service_role;
