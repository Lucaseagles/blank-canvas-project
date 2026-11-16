-- RUBI Sprint 213: category highlights use single invoker transaction with Owner audit.
-- No generated paid attribution; ranking derives from existing product offer scores.
create or replace function public.rubi_manage_category_highlights_audited(
 p_action text, p_category_id uuid, p_product_id uuid, p_rank integer,
 p_highlight_id uuid, p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $rubi$
declare
 v_old public.category_highlights%rowtype;
 v_prod public.products%rowtype;
 v_category record;
 v_existing record;
 v_candidate record;
 v_slot integer;
 v_processed integer := 0;
 v_changed integer := 0;
 v_manual_ranks integer[];
 v_manual_products uuid[];
begin
 if p_actor is null or not exists (
   select 1 from public.user_roles u where u.user_id = p_actor and u.role = 'owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_action not in ('manual','delete','recalculate')
 then raise exception 'Invalid highlights action'; end if;
 -- Serialize all writes including recalculations to prevent rank conflicts/lost updates.
 perform pg_advisory_xact_lock(20261115,213);

 if p_action = 'manual' then
  if p_category_id is null or p_product_id is null or p_rank not between 1 and 3
  then raise exception 'Invalid highlight identifiers/rank'; end if;
  perform 1 from public.categories c where c.id=p_category_id and c.is_active=true for share;
  if not found then raise exception 'Active category not found'; end if;
  select * into v_prod from public.products p where p.id=p_product_id for share;
  if not found or v_prod.category_id is distinct from p_category_id
   or coalesce(v_prod.status,'') not in ('active','published')
  then raise exception 'Highlight must reference an active product in that category'; end if;
  -- A product must not occupy two slots of the same category.
  perform 1 from public.category_highlights h
   where h.category_id=p_category_id and h.product_id=p_product_id and h.rank<>p_rank;
  if found then raise exception 'Product already featured at another rank'; end if;
  select * into v_old from public.category_highlights h
   where h.category_id=p_category_id and h.rank=p_rank for update;
  insert into public.category_highlights(
   category_id,product_id,rank,offer_score,is_manual_override,calculated_at,updated_at
  ) values(
   p_category_id,p_product_id,p_rank,coalesce(v_prod.offer_score,0),true,now(),now()
  ) on conflict (category_id,rank) do update set
   product_id=excluded.product_id,offer_score=excluded.offer_score,
   is_manual_override=true,calculated_at=now(),updated_at=now();
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
   p_actor,null,'RUBI_CATEGORY_HIGHLIGHT_MANUAL','category_highlight',p_category_id,
   case when v_old.id is null then '{}'::jsonb else
     jsonb_build_object('rank',v_old.rank,'product_id',v_old.product_id,'manual',v_old.is_manual_override) end,
   jsonb_build_object('rank',p_rank,'product_id',p_product_id,'manual',true)
  );
  return jsonb_build_object('changed',1,'processed',0);
 end if;

 if p_action = 'delete' then
  if p_highlight_id is null then raise exception 'Highlight ID required'; end if;
  select * into v_old from public.category_highlights h
   where h.id=p_highlight_id for update;
  if not found then raise exception 'Highlight not found'; end if;
  delete from public.category_highlights h where h.id=p_highlight_id;
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
   p_actor,null,'RUBI_CATEGORY_HIGHLIGHT_DELETED','category_highlight',v_old.category_id,
   jsonb_build_object('rank',v_old.rank,'product_id',v_old.product_id,'manual',v_old.is_manual_override),
   '{}'::jsonb
  );
  return jsonb_build_object('changed',1,'processed',0);
 end if;

 -- Recaculate only auto slots while preserving the Owner's manual selections.
 -- Every affected row is audited. A failure rolls back the entire batch.
 for v_category in select c.id from public.categories c
  where c.is_active=true order by c.id
 loop
  v_processed:=v_processed+1;
  select coalesce(array_agg(h.rank),'{}'::integer[]),
         coalesce(array_agg(h.product_id),'{}'::uuid[])
   into v_manual_ranks,v_manual_products
   from public.category_highlights h
   where h.category_id=v_category.id and h.is_manual_override=true;

  -- Remove stale automatic placements, then replace from actual eligible products.
  for v_existing in select h.* from public.category_highlights h
   where h.category_id=v_category.id and h.is_manual_override=false order by h.rank for update
  loop
   delete from public.category_highlights h where h.id=v_existing.id;
   insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
   ) values (
    p_actor,null,'RUBI_CATEGORY_HIGHLIGHT_AUTO_REMOVED','category_highlight',v_category.id,
    jsonb_build_object('rank',v_existing.rank,'product_id',v_existing.product_id),
    '{}'::jsonb
   );
   v_changed:=v_changed+1;
  end loop;

  v_slot:=1;
  for v_candidate in select p.id,p.offer_score from public.products p
   where p.category_id=v_category.id and p.status in ('active','published')
    and not (p.id=any(v_manual_products))
   order by p.offer_score desc nulls last,p.id limit 3
  loop
   while v_slot<=3 and v_slot=any(v_manual_ranks) loop
    v_slot:=v_slot+1;
   end loop;
   if v_slot>3 then exit; end if;
   insert into public.category_highlights(
    category_id,product_id,rank,offer_score,is_manual_override,calculated_at,updated_at
   ) values(v_category.id,v_candidate.id,v_slot,coalesce(v_candidate.offer_score,0),
    false,now(),now());
   insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
   ) values (
    p_actor,null,'RUBI_CATEGORY_HIGHLIGHT_AUTO_ASSIGNED','category_highlight',v_category.id,
    '{}'::jsonb,jsonb_build_object('rank',v_slot,'product_id',v_candidate.id)
   );
   v_changed:=v_changed+1;
   v_slot:=v_slot+1;
  end loop;
 end loop;
 return jsonb_build_object('changed',v_changed,'processed',v_processed);
end;
$rubi$;
revoke all on function public.rubi_manage_category_highlights_audited(text,uuid,uuid,integer,uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_manage_category_highlights_audited(text,uuid,uuid,integer,uuid,uuid)
 to service_role;
-- Client writes to this table could bypass audited Owner decisions.
revoke insert,update,delete on public.category_highlights from public,anon,authenticated;
