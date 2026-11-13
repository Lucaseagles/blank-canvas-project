-- RUBI Sprint 164: campaign lifecycle and named Master audit are atomic.
-- Existing rubi_master_campaign_plan_audit trigger remains active.
create or replace function public.rubi_transition_campaign_audited(
 p_id uuid,p_action text,p_expected_status text,p_note text,p_actor uuid
)
returns table(plan_id uuid,new_status text)
language plpgsql security invoker set search_path=''
as $$
declare
 current_plan public.rubi_master_campaign_plans%rowtype;
 next_state text;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r
   where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Only an authenticated Owner may audit campaign decisions';
 end if;
 if p_action not in ('submit','approve','pause') then
  raise exception 'Unsupported campaign transition';
 end if;
 if char_length(coalesce(p_note,''))>1000 then
  raise exception 'Decision note too long';
 end if;
 select c.* into current_plan
  from public.rubi_master_campaign_plans c
  where c.id=p_id for update;
 if not found then raise exception 'Campaign plan not found'; end if;
 if current_plan.status is distinct from p_expected_status then
  raise exception 'Campaign changed; reload before making a decision';
 end if;
 if (p_action='submit' and current_plan.status<>'draft')
  or (p_action='approve' and current_plan.status<>'ready_for_review')
  or (p_action='pause' and current_plan.status<>'approved') then
  raise exception 'Invalid campaign transition';
 end if;
 if p_action<>'pause' and char_length(trim(current_plan.claim_evidence))<10 then
  raise exception 'Claim evidence is required';
 end if;
 if p_action='approve' and char_length(trim(coalesce(p_note,'')))<10 then
  raise exception 'Approval requires a documented review note';
 end if;
 next_state:=case p_action when 'submit' then 'ready_for_review'
  when 'approve' then 'approved' else 'paused' end;
 update public.rubi_master_campaign_plans c
  set status=next_state,approval_note=coalesce(p_note,''),
   approved_at=case when p_action='approve' then now() else null end,
   updated_at=now()
  where c.id=p_id;
 -- If this insert fails, both the state change and trigger audit roll back.
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,
  case p_action when 'submit' then 'RUBI_CAMPAIGN_SUBMITTED'
   when 'approve' then 'RUBI_CAMPAIGN_APPROVED' else 'RUBI_CAMPAIGN_PAUSED' end,
  'rubi_master_campaign_plan',p_id,
  jsonb_build_object('status',current_plan.status),
  jsonb_build_object('status',next_state,'product_id',current_plan.product_id)
 );
 return query select p_id,next_state;
end;
$$;
revoke all on function public.rubi_transition_campaign_audited(uuid,text,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_transition_campaign_audited(uuid,text,text,text,uuid)
 to service_role;
comment on function public.rubi_transition_campaign_audited(uuid,text,text,text,uuid)
 is 'Owner-only campaign decision and sanitized administrative audit in one transaction; no publication or spending.';
