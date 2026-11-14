-- Sprint 181: candidate proposals do not confer privileges; decisions must be attributable to a Master.
create or replace function public.rubi_decide_master_candidate_audited(
 p_actor uuid,p_email text,p_action text
) returns table(saved_status text)
language plpgsql security invoker set search_path=''
as $$
declare previous public.rubi_master_delegations%rowtype;
 next_status text;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner required'; end if;
 if p_email is null or p_email<>lower(btrim(p_email))
  or char_length(p_email) not between 6 and 254
  or p_email !~ '^[^ @[:space:]]+@[^ @[:space:]]+[.][^ @[:space:]]+$'
  or p_action not in ('propose','cancel')
 then raise exception 'Invalid candidate request'; end if;
 -- Serialize even first-time proposals for a specific email.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email,177));
 select * into previous from public.rubi_master_delegations d where d.email=p_email for update;
 if p_action='propose' then
  if found and previous.status='pending' then raise exception 'Already pending'; end if;
  if previous.email is null then
   insert into public.rubi_master_delegations(email,requested_by,status)
    values(p_email,p_actor,'pending');
  else
   update public.rubi_master_delegations d set requested_by=p_actor,status='pending',updated_at=now()
    where d.email=p_email;
  end if;
  next_status:='pending';
 else
  if previous.email is null or previous.status<>'pending' then
   raise exception 'Pending candidate not found'; end if;
  update public.rubi_master_delegations d set status='cancelled',updated_at=now()
   where d.email=p_email;
  next_status:='cancelled';
 end if;
 insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,
   case when p_action='propose' then 'RUBI_MASTER_CANDIDATE_PROPOSED' else 'RUBI_MASTER_CANDIDATE_CANCELLED' end,
   'rubi_master_candidate',null,
   case when previous.email is null then '{}'::jsonb
        else jsonb_build_object('status',previous.status) end,
   jsonb_build_object('status',next_status,'access_granted',false));
 return query select next_status;
end;
$$;
revoke all on function public.rubi_decide_master_candidate_audited(uuid,text,text) from public,anon,authenticated;
grant execute on function public.rubi_decide_master_candidate_audited(uuid,text,text) to service_role;
