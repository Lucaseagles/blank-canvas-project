\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

do $grants$
begin
  if not has_function_privilege('service_role','public.rubi_recalculate_trending_audited(uuid)','EXECUTE')
     or has_function_privilege('anon','public.rubi_recalculate_trending_audited(uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.rubi_recalculate_trending_audited(uuid)','EXECUTE') then
    raise exception 'Trending audit RPC grants are not least-privilege';
  end if;
  if to_regprocedure('public.refresh_demand_and_trend_scores()') is null then
    raise exception 'Reproducible trending refresh function is missing';
  end if;
  if not has_function_privilege('service_role','public.refresh_demand_and_trend_scores()','EXECUTE')
     or has_function_privilege('anon','public.refresh_demand_and_trend_scores()','EXECUTE')
     or has_function_privilege('authenticated','public.refresh_demand_and_trend_scores()','EXECUTE') then
    raise exception 'Internal trending refresh grants are not least-privilege';
  end if;
end
$grants$;

set local role service_role;
do $owner$
begin
  begin
    perform public.rubi_recalculate_trending_audited(
      current_setting('rubi.qa.non_owner_id')::uuid
    );
    raise exception 'Non-Owner actor unexpectedly recalculated trending';
  exception when others then
    if sqlerrm <> 'Owner authorization required' then raise; end if;
  end;
end
$owner$;
reset role;

set local role service_role;
do $success$
declare
  v_actor uuid := current_setting('rubi.qa.master_id')::uuid;
  v_result jsonb;
  v_rule uuid;
  v_count integer;
begin
  select id into strict v_rule
    from public.automation_rules
   where action_type::text='RECALCULATE_TRENDING'
     and is_active=true
   order by created_at,id
   limit 1;

  v_result := public.rubi_recalculate_trending_audited(v_actor);
  if coalesce((v_result->>'success')::boolean,false) is not true then
    raise exception 'Trending recalculation failed: %',v_result->>'error';
  end if;

  select count(*) into v_count
    from public.admin_audit_log
   where actor_user_id=v_actor
     and action_type='RUBI_AUTOMATION_TRENDING_RECALCULATED'
     and entity_type='automation_rules'
     and entity_id=v_rule::text;
  if v_count <> 1 then
    raise exception 'Expected exactly one successful trending audit event, got %',v_count;
  end if;

  if not exists (
    select 1 from public.automation_logs
     where rule_id=v_rule
       and status='success'
       and context->>'actor_user_id'=v_actor::text
       and context->>'triggered_by'='admin_manual'
  ) then
    raise exception 'Successful automation log with actor attribution is missing';
  end if;
end
$success$;
reset role;

-- Force only the success audit to fail. The RPC must roll back product changes
-- and the success log, then persist a separate failed-attempt log and audit.
create function pg_temp.rubi_qa_reject_trending_success_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.action_type='RUBI_AUTOMATION_TRENDING_RECALCULATED' then
    raise exception 'RUBI_QA_FORCED_TRENDING_AUDIT_FAILURE';
  end if;
  return new;
end
$trigger$;
create trigger rubi_qa_reject_trending_success_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_trending_success_audit();

set local role service_role;
do $rollback$
declare
  v_actor uuid := current_setting('rubi.qa.master_id')::uuid;
  v_result jsonb;
  v_rule uuid;
  v_before text;
  v_after text;
  v_count integer;
begin
  select id into strict v_rule
    from public.automation_rules
   where action_type::text='RECALCULATE_TRENDING'
     and is_active=true
   order by created_at,id
   limit 1;

  select coalesce(string_agg(
    id::text||':'||coalesce(demand_score::text,'NULL')||':'||coalesce(trend_velocity::text,'NULL'),
    '|' order by id
  ),'') into v_before from public.products;

  v_result := public.rubi_recalculate_trending_audited(v_actor);
  if coalesce((v_result->>'success')::boolean,true) is not false then
    raise exception 'Forced success-audit failure was not reported';
  end if;

  select coalesce(string_agg(
    id::text||':'||coalesce(demand_score::text,'NULL')||':'||coalesce(trend_velocity::text,'NULL'),
    '|' order by id
  ),'') into v_after from public.products;
  if v_after is distinct from v_before then
    raise exception 'Trending product updates survived failed audit insertion';
  end if;

  select count(*) into v_count
    from public.admin_audit_log
   where actor_user_id=v_actor
     and action_type='RUBI_AUTOMATION_TRENDING_RECALCULATION_FAILED'
     and entity_id=v_rule::text;
  if v_count <> 1 then
    raise exception 'Expected one failure audit event, got %',v_count;
  end if;

  if exists (
    select 1 from public.automation_logs
     where rule_id=v_rule
       and status='success'
       and context->>'actor_user_id'=v_actor::text
       and context->>'triggered_by'='admin_manual'
  ) then
    -- The first successful execution above is expected; ensure there is no
    -- additional success log from the forced-failure attempt by comparing count.
    select count(*) into v_count from public.automation_logs
     where rule_id=v_rule and status='success'
       and context->>'actor_user_id'=v_actor::text
       and context->>'triggered_by'='admin_manual';
    if v_count <> 1 then
      raise exception 'Failed attempt left an extra success automation log';
    end if;
  end if;
end
$rollback$;
reset role;

drop trigger rubi_qa_reject_trending_success_audit on public.admin_audit_log;
drop function pg_temp.rubi_qa_reject_trending_success_audit();

rollback;
\echo 'PASS: trending Owner gate, least-privilege grants, success audit, failure rollback and sanitized failure evidence.'
