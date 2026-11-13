-- Owner-only, audited movement lifecycle. Service-role server validates complete editorial content.
-- An audit failure aborts the mutation in the same PostgreSQL transaction.
create or replace function public.rubi_mutate_movement_audited(
 p_action text,p_id uuid,p_product_id uuid,p_expected_revision integer,
 p_values jsonb,p_actor uuid
)
returns table(id uuid,revision integer)
language plpgsql security invoker set search_path=''
as $$
declare
 old_row public.rubi_movements%rowtype;
 current_id uuid;
 current_revision integer;
 next_status text;
begin
 if p_actor is null or not exists(select 1 from public.user_roles
   where user_id=p_actor and role='owner') then
  raise exception 'Owner role required';
 end if;
 if p_action not in ('create','update','archive') then
  raise exception 'Unsupported movement operation';
 end if;
 if p_action='create' then
  if p_id is not null then raise exception 'Creation ID must be empty'; end if;
  if not exists(select 1 from public.hub_products where id=p_product_id) then
   raise exception 'Product not found';
  end if;
  next_status:=p_values->>'status';
  if next_status not in ('draft','review') then raise exception 'Invalid movement status'; end if;
  insert into public.rubi_movements(
   product_id,name,audience,buyer_persona,problem,desired_outcome,
   truthful_promise,differentiator,narrative,evidence_notes,status
  ) values(
   p_product_id,p_values->>'name',p_values->>'audience',
   p_values->>'buyer_persona',p_values->>'problem',
   p_values->>'desired_outcome',p_values->>'truthful_promise',
   p_values->>'differentiator',p_values->>'narrative',
   p_values->>'evidence_notes',next_status
  ) returning rubi_movements.id,rubi_movements.revision into current_id,current_revision;
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values(p_actor,null,'RUBI_MOVEMENT_CREATED','rubi_movement',current_id,'{}'::jsonb,
   jsonb_build_object('revision',current_revision,'status',next_status,'product_id',p_product_id));
 elsif p_action='update' then
  select * into old_row from public.rubi_movements
   where rubi_movements.id=p_id and product_id=p_product_id for update;
  if not found or old_row.revision is distinct from p_expected_revision then
   raise exception 'Movement changed; reload before update';
  end if;
  next_status:=p_values->>'status';
  if next_status not in ('draft','review') then raise exception 'Invalid movement status'; end if;
  update public.rubi_movements set
   name=p_values->>'name',audience=p_values->>'audience',
   buyer_persona=p_values->>'buyer_persona',problem=p_values->>'problem',
   desired_outcome=p_values->>'desired_outcome',truthful_promise=p_values->>'truthful_promise',
   differentiator=p_values->>'differentiator',narrative=p_values->>'narrative',
   evidence_notes=p_values->>'evidence_notes',status=next_status,
   revision=old_row.revision+1,updated_at=now()
  where rubi_movements.id=old_row.id;
  current_id:=old_row.id;
  current_revision:=old_row.revision+1;
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values(p_actor,null,'RUBI_MOVEMENT_UPDATED','rubi_movement',current_id,
   jsonb_build_object('revision',old_row.revision,'status',old_row.status),
   jsonb_build_object('revision',current_revision,'status',next_status,'product_id',p_product_id));
 else
  select * into old_row from public.rubi_movements
   where rubi_movements.id=p_id and product_id=p_product_id for update;
  if not found or old_row.revision is distinct from p_expected_revision then
   raise exception 'Movement changed; reload before archive';
  end if;
  -- An archived movement may have dependent foreign keys. Let RESTRICT prevent deleting it.
  delete from public.rubi_movements where rubi_movements.id=old_row.id;
  current_id:=old_row.id;
  current_revision:=old_row.revision;
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values(p_actor,null,'RUBI_MOVEMENT_ARCHIVED','rubi_movement',current_id,
   jsonb_build_object('revision',old_row.revision,'status',old_row.status,'product_id',p_product_id),
   jsonb_build_object('archived',true));
 end if;
 return query select current_id,current_revision;
end;
$$;
revoke all on function public.rubi_mutate_movement_audited(text,uuid,uuid,integer,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_mutate_movement_audited(text,uuid,uuid,integer,jsonb,uuid)
 to service_role;
comment on function public.rubi_mutate_movement_audited(text,uuid,uuid,integer,jsonb,uuid)
 is 'Atomic owner movement create/edit/archive plus privacy-minimized admin audit entry.';
