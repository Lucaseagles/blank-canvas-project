-- Sprint 360: make manual automation execution and the Master audit one transaction.
-- The caller is an Owner-guarded server function; the database verifies the actor again.
create or replace function public.rubi_run_automation_action_audited(
  p_action text,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_rule public.automation_rules%rowtype;
  v_processed integer := 0;
  v_entity text;
  v_result jsonb;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id=p_actor and r.role::text='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  if p_action not in ('RECALCULATE_TRENDING','RUN_RETENTION_CHECK') then
    raise exception 'Unsupported manual automation action';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rubi:manual-automation:' || p_action, 0)
  );

  if p_action='RECALCULATE_TRENDING' then
    select * into v_rule
    from public.automation_rules
    where action_type::text='RECALCULATE_TRENDING'
    order by created_at,id
    limit 1
    for update;
  else
    select * into v_rule
    from public.automation_rules
    where trigger_type::text='USER_INACTIVE'
    order by created_at,id
    limit 1
    for update;
  end if;

  if not found then
    return jsonb_build_object('success',false,'processed',0,'error','Automation rule not found');
  end if;
  if not v_rule.is_active then
    return jsonb_build_object('success',false,'processed',0,'error','Automation rule is disabled');
  end if;

  if p_action='RECALCULATE_TRENDING' then
    perform public.refresh_demand_and_trend_scores();
    select count(*)::integer into v_processed from public.products;
    v_entity := 'products';
    v_result := jsonb_build_object('success',true,'processed',v_processed);
  else
    v_processed := public.run_retention_engine(3);
    v_entity := 'retention_notifications';
    v_result := jsonb_build_object('success',true,'notifications_queued',v_processed);
  end if;

  -- The business operation and actor-attributed audit commit or roll back together.
  insert into public.admin_audit_log(
    actor_user_id,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,
    case when p_action='RECALCULATE_TRENDING'
      then 'RUBI_AUTOMATION_TRENDING_RECALCULATED'
      else 'RUBI_AUTOMATION_RETENTION_EXECUTED' end,
    v_entity,
    v_rule.id::text,
    jsonb_build_object('rule_id',v_rule.id,'active',v_rule.is_active),
    jsonb_build_object('processed',v_processed,'action',p_action)
  );

  return v_result;
end;
$fn$;

revoke all on function public.rubi_run_automation_action_audited(text,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_run_automation_action_audited(text,uuid)
  to service_role;
comment on function public.rubi_run_automation_action_audited(text,uuid)
  is 'Owner-verified manual automation execution with serialized operation and actor-attributed admin audit in the same transaction.';
