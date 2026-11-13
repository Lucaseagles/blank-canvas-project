-- Sprint 178: transactionally audit creator-team membership and campaign assignment decisions.
-- Existing immutable membership/assignment event triggers remain active.
-- All functions are service-role-only and require the real authenticated Master as actor.

create or replace function public.rubi_set_team_membership_audited(
 p_actor uuid,p_team uuid,p_profile uuid,p_status text,p_expected_status text
) returns table(saved_id uuid,saved_status text)
language plpgsql security invoker set search_path=''
as $$
declare existing public.rubi_creator_team_members%rowtype;
        profile_status text;
        result_id uuid;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required'; end if;
 if p_status not in ('active','paused') then raise exception 'Invalid team status'; end if;
 perform 1 from public.rubi_creator_teams t where t.id=p_team for update;
 if not found then raise exception 'Team not found'; end if;
 select p.status into profile_status from public.commercial_profiles p
  where p.id=p_profile and p.audience='partner' for share;
 if not found or profile_status<>'approved' then raise exception 'Approved partner required'; end if;
 select m.* into existing from public.rubi_creator_team_members m
  where m.team_id=p_team and m.commercial_profile_id=p_profile for update;
 if found then
  if existing.status is distinct from p_expected_status then
   raise exception 'Membership changed; reload before saving'; end if;
  if existing.status=p_status then raise exception 'Membership already has requested status'; end if;
  update public.rubi_creator_team_members m set status=p_status,updated_at=now()
   where m.id=existing.id returning id into result_id;
 else
  if p_expected_status is not null then raise exception 'Membership not found; reload'; end if;
  insert into public.rubi_creator_team_members(team_id,commercial_profile_id,status,updated_at)
   values(p_team,p_profile,p_status,now()) returning id into result_id;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
  entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_TEAM_MEMBERSHIP_UPDATED','rubi_creator_team_member',result_id,
  case when existing.id is null then '{}'::jsonb
   else jsonb_build_object('status',existing.status) end,
  jsonb_build_object('status',p_status,'team_id',p_team,'commercial_profile_id',p_profile));
 return query select result_id,p_status;
end;
$$;
revoke all on function public.rubi_set_team_membership_audited(uuid,uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rubi_set_team_membership_audited(uuid,uuid,uuid,text,text) to service_role;

create or replace function public.rubi_create_team_campaign_assignment_audited(
 p_actor uuid,p_team uuid,p_plan uuid,p_movement uuid,p_variant uuid,p_notes text
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare plan_row public.rubi_master_campaign_plans%rowtype;
        movement_row public.rubi_movements%rowtype;
        variant_row public.rubi_movement_variants%rowtype;
        result_id uuid;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required'; end if;
 if p_notes is null or char_length(p_notes)>1000 then raise exception 'Invalid editorial notes'; end if;
 perform 1 from public.rubi_creator_teams t where t.id=p_team for share;
 if not found then raise exception 'Team not found'; end if;
 select * into plan_row from public.rubi_master_campaign_plans p where p.id=p_plan for share;
 select * into movement_row from public.rubi_movements m where m.id=p_movement for share;
 select * into variant_row from public.rubi_movement_variants v where v.id=p_variant for share;
 if plan_row.id is null or movement_row.id is null or variant_row.id is null
   or plan_row.mode<>'creator_team' or plan_row.product_id<>movement_row.product_id
   or variant_row.movement_id<>movement_row.id then
  raise exception 'Campaign, movement and variant do not belong to same team product'; end if;
 insert into public.rubi_creator_team_campaign_assignments(
  team_id,campaign_plan_id,movement_id,variant_id,editorial_notes,status)
 values(p_team,p_plan,p_movement,p_variant,p_notes,'planned')
 returning id into result_id;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
  entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_TEAM_CAMPAIGN_LINK_PLANNED','rubi_creator_team_campaign_assignment',
  result_id,'{}'::jsonb,jsonb_build_object('status','planned','team_id',p_team,
  'campaign_plan_id',p_plan,'variant_id',p_variant));
 return query select result_id;
end;
$$;
revoke all on function public.rubi_create_team_campaign_assignment_audited(uuid,uuid,uuid,uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.rubi_create_team_campaign_assignment_audited(uuid,uuid,uuid,uuid,uuid,text)
 to service_role;

create or replace function public.rubi_transition_team_campaign_assignment_audited(
 p_actor uuid,p_id uuid,p_status text,p_expected_status text
) returns table(saved_id uuid,saved_status text)
language plpgsql security invoker set search_path=''
as $$
declare previous public.rubi_creator_team_campaign_assignments%rowtype;
        team_stage text;
        plan_row public.rubi_master_campaign_plans%rowtype;
        movement_row public.rubi_movements%rowtype;
        variant_row public.rubi_movement_variants%rowtype;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required'; end if;
 if p_status not in ('ready','paused') then raise exception 'Invalid transition'; end if;
 select * into previous from public.rubi_creator_team_campaign_assignments a where a.id=p_id for update;
 if not found then raise exception 'Team campaign assignment not found'; end if;
 if previous.status is distinct from p_expected_status or previous.status=p_status then
  raise exception 'Assignment changed; reload before saving'; end if;
 if p_status='ready' then
  select t.stage into team_stage from public.rubi_creator_teams t where t.id=previous.team_id for share;
  select * into plan_row from public.rubi_master_campaign_plans p where p.id=previous.campaign_plan_id for share;
  select * into movement_row from public.rubi_movements m where m.id=previous.movement_id for share;
  select * into variant_row from public.rubi_movement_variants v where v.id=previous.variant_id for share;
  if team_stage is null or team_stage='paused' or plan_row.id is null or plan_row.status<>'approved'
     or plan_row.mode<>'creator_team' or movement_row.id is null or movement_row.status<>'review'
     or plan_row.product_id<>movement_row.product_id or variant_row.id is null
     or variant_row.movement_id<>movement_row.id or variant_row.status<>'review'
     or variant_row.media_rights_confirmed is distinct from true then
    raise exception 'Team campaign eligibility failed; revise assets first'; end if;
 end if;
 update public.rubi_creator_team_campaign_assignments a set status=p_status,updated_at=now()
  where a.id=p_id;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
  entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_TEAM_CAMPAIGN_STATUS_CHANGED','rubi_creator_team_campaign_assignment',
  p_id,jsonb_build_object('status',previous.status),
  jsonb_build_object('status',p_status,'team_id',previous.team_id,
    'campaign_plan_id',previous.campaign_plan_id));
 return query select p_id,p_status;
end;
$$;
revoke all on function public.rubi_transition_team_campaign_assignment_audited(uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rubi_transition_team_campaign_assignment_audited(uuid,uuid,text,text)
 to service_role;
