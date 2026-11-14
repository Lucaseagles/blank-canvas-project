-- Sprint 200: atomic status changes and admin audit for the consumer/marketplace catalogue.
create or replace function public.rubi_bulk_product_status_audited(
 p_product_ids uuid[], p_status text, p_actor uuid
) returns integer language plpgsql security invoker set search_path=''
as $fn$
declare
 target_count integer;
 locked_count integer;
 changed_count integer;
 item record;
begin
 if p_actor is null or not exists(
   select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 target_count:=coalesce(array_length(p_product_ids,1),0);
 if target_count<1 or target_count>100 or array_position(p_product_ids,null) is not null
   or (select count(distinct x) from unnest(p_product_ids) as x)<>target_count
 then raise exception 'Invalid or duplicate product IDs'; end if;
 if p_status not in ('published','draft','archived') then raise exception 'Invalid product status'; end if;
 -- Row locks keep the validation snapshot stable and serialize concurrent status updates.
 perform 1 from public.products p where p.id=any(p_product_ids) order by p.id for update;
 select count(*) into locked_count from public.products p where p.id=any(p_product_ids);
 if locked_count<>target_count then raise exception 'One or more products do not exist'; end if;
 if p_status='published' and exists (
  select 1 from public.products p where p.id=any(p_product_ids) and (
    nullif(btrim(coalesce(p.title,'')),'') is null
    or p.current_price is null or p.current_price<=0
    or p.category_id is null or p.marketplace_id is null
    or nullif(btrim(coalesce(p.description,'')),'') is null
    or p.images is null or jsonb_array_length(to_jsonb(p.images))=0
  )
 ) then raise exception 'A product is missing required publication data'; end if;
 for item in select p.id,p.status from public.products p
  where p.id=any(p_product_ids) order by p.id
 loop
   update public.products p set status=p_status, updated_at=now() where p.id=item.id;
   insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
   ) values(p_actor,null,'RUBI_PRODUCT_BULK_STATUS_UPDATED','product',item.id,
     jsonb_build_object('status',item.status),jsonb_build_object('status',p_status));
 end loop;
 return target_count;
end;
$fn$;
revoke all on function public.rubi_bulk_product_status_audited(uuid[],text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_bulk_product_status_audited(uuid[],text,uuid)
 to service_role;
