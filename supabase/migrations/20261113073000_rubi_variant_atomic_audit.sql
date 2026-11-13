-- RUBI Sprint 165: variant edits and named Owner audit form one transaction.
create or replace function public.rubi_mutate_variant_audited(
 p_action text,p_id uuid,p_movement_id uuid,p_expected_revision integer,
 p_values jsonb,p_actor uuid
)
returns table(variant_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare
 current_variant public.rubi_movement_variants%rowtype;
 current_movement public.rubi_movements%rowtype;
 saved_id uuid;
 saved_revision integer;
 new_state text;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner required'; end if;
 if p_action not in ('create','update','delete') then
  raise exception 'Unsupported variant operation'; end if;
 select m.* into current_movement from public.rubi_movements m
  where m.id=p_movement_id for share;
 if not found then raise exception 'Movement not found'; end if;
 if p_action<>'delete' then
  new_state:=p_values->>'status';
  if new_state not in ('draft','review') then raise exception 'Invalid variant status'; end if;
  if new_state='review' and current_movement.status<>'review' then
   raise exception 'Movement must be reviewed'; end if;
  if new_state='review' and coalesce((p_values->>'media_rights_confirmed')::boolean,false) is not true then
   raise exception 'Media rights must be confirmed'; end if;
 end if;
 if p_action='create' then
  if p_id is not null then raise exception 'Creation identifier must be empty'; end if;
  insert into public.rubi_movement_variants(
   movement_id,name,format,creative_hook,creative_script,page_headline,page_body,
   call_to_action,media_notes,proof_notes,media_rights_confirmed,status
  ) values(
   p_movement_id,p_values->>'name',p_values->>'format',p_values->>'creative_hook',
   p_values->>'creative_script',p_values->>'page_headline',p_values->>'page_body',
   p_values->>'call_to_action',p_values->>'media_notes',p_values->>'proof_notes',
   coalesce((p_values->>'media_rights_confirmed')::boolean,false),new_state
  ) returning id,revision into saved_id,saved_revision;
 elsif p_action='update' then
  select v.* into current_variant from public.rubi_movement_variants v
   where v.id=p_id and v.movement_id=p_movement_id for update;
  if not found or current_variant.revision is distinct from p_expected_revision then
   raise exception 'Variant changed; reload before editing'; end if;
  update public.rubi_movement_variants v set
   name=p_values->>'name',format=p_values->>'format',
   creative_hook=p_values->>'creative_hook',creative_script=p_values->>'creative_script',
   page_headline=p_values->>'page_headline',page_body=p_values->>'page_body',
   call_to_action=p_values->>'call_to_action',media_notes=p_values->>'media_notes',
   proof_notes=p_values->>'proof_notes',
   media_rights_confirmed=coalesce((p_values->>'media_rights_confirmed')::boolean,false),
   status=new_state,revision=current_variant.revision+1,updated_at=now()
   where v.id=p_id and v.movement_id=p_movement_id;
  saved_id:=current_variant.id;
  saved_revision:=current_variant.revision+1;
 else
  select v.* into current_variant from public.rubi_movement_variants v
   where v.id=p_id and v.movement_id=p_movement_id for update;
  if not found or current_variant.revision is distinct from p_expected_revision then
   raise exception 'Variant changed; reload before deletion'; end if;
  delete from public.rubi_movement_variants v where v.id=p_id;
  saved_id:=current_variant.id;
  saved_revision:=current_variant.revision;
 end if;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,
  case p_action when 'create' then 'RUBI_VARIANT_CREATED'
   when 'update' then 'RUBI_VARIANT_UPDATED' else 'RUBI_VARIANT_DELETED' end,
  'rubi_movement_variant',saved_id,
  case when p_action='create' then '{}'::jsonb else
   jsonb_build_object('revision',current_variant.revision,'status',current_variant.status)
  end,
  case when p_action='delete' then jsonb_build_object('deleted',true) else
   jsonb_build_object('revision',saved_revision,'status',new_state,'movement_id',p_movement_id)
  end
 );
 return query select saved_id,saved_revision;
end;
$$;
revoke all on function public.rubi_mutate_variant_audited(text,uuid,uuid,integer,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_mutate_variant_audited(text,uuid,uuid,integer,jsonb,uuid)
 to service_role;
comment on function public.rubi_mutate_variant_audited(text,uuid,uuid,integer,jsonb,uuid)
 is 'Owner-only variant write and sanitized audit entry in one transaction; review eligibility also validated by server.';
