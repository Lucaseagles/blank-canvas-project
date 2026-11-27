-- Sprint 360: make manual retention execution and the Master audit one transaction.
-- Trending is intentionally excluded: its historical RPC has no reproducible migration
-- in a clean local bootstrap, so it must not be called by this new audited wrapper.
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
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id=p_actor and r.role::text='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  if p_action <> 'RUN_RETENTION_CHECK' then
    raise exception 'Unsupported manual automation action';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rubi:manual-automation:' || p_action, 0)
  );

  -- Match the exact rule selector used by run_retention_engine. If no active
  -- rule exists, the engine safely returns zero; the manual attempt is still audited.
  select * into v_rule
  from public.automation_rules
  where name='Retention Sentinel'
    and is_active=true
  order by created_at,id
  limit 1
  for update;

  v_processed := public.run_retention_engine(3);

  -- run_retention_engine's automation log and the Master audit share this transaction.
  insert into public.admin_audit_log(
    actor_user_id,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,
    'RUBI_AUTOMATION_RETENTION_EXECUTED',
    'retention_notifications',
    v_rule.id::text,
    jsonb_build_object('rule_id',v_rule.id,'active',v_rule.is_active),
    jsonb_build_object('processed',v_processed,'action',p_action)
  );

  return jsonb_build_object('success',true,'notifications_queued',v_processed);
end;
$fn$;

revoke all on function public.rubi_run_automation_action_audited(text,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_run_automation_action_audited(text,uuid)
  to service_role;
comment on function public.rubi_run_automation_action_audited(text,uuid)
  is 'Owner-verified manual retention execution with serialized operation and actor-attributed admin audit in the same transaction.';
