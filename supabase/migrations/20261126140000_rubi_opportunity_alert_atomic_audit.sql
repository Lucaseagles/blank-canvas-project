-- Atomic Owner-only status transitions for Opportunity Engine alerts.
create or replace function public.rubi_update_opportunity_alert_status_audited(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_status text,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_before public.opportunity_alerts%rowtype;
  v_after public.opportunity_alerts%rowtype;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id=p_actor and r.role::text='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;
  if p_id is null or p_expected_updated_at is null
     or p_status not in ('open','dismissed','actioned') then
    raise exception 'Invalid opportunity alert transition';
  end if;

  select a.* into v_before
  from public.opportunity_alerts a
  where a.id=p_id
  for update;
  if not found then raise exception 'Opportunity alert not found'; end if;
  if v_before.updated_at is distinct from p_expected_updated_at then
    raise exception 'Opportunity alert changed; reload before saving';
  end if;
  if v_before.status=p_status then
    return jsonb_build_object('id',v_before.id,'status',v_before.status,'updated_at',v_before.updated_at,'unchanged',true);
  end if;

  update public.opportunity_alerts a
  set status=p_status,updated_at=clock_timestamp()
  where a.id=p_id
  returning a.* into v_after;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,'RUBI_OPPORTUNITY_ALERT_STATUS_UPDATED','opportunity_alerts',p_id::text,
    jsonb_build_object('status',v_before.status,'opportunity_type',v_before.opportunity_type),
    jsonb_build_object('status',v_after.status,'opportunity_type',v_after.opportunity_type)
  );

  return jsonb_build_object('id',v_after.id,'status',v_after.status,'updated_at',v_after.updated_at,'unchanged',false);
end;
$fn$;

revoke all on function public.rubi_update_opportunity_alert_status_audited(uuid,timestamptz,text,uuid) from public,anon,authenticated;
grant execute on function public.rubi_update_opportunity_alert_status_audited(uuid,timestamptz,text,uuid) to service_role;
-- Retire the legacy RPC: the server now supplies the verified Owner actor to the audited replacement.
revoke all on function public.update_opportunity_alert_status(uuid,text) from public,anon,authenticated,service_role;
comment on function public.rubi_update_opportunity_alert_status_audited(uuid,timestamptz,text,uuid)
  is 'Owner-only opportunity alert status transition with optimistic concurrency and atomic sanitized audit.';
