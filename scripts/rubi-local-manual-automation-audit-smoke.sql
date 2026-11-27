\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

do $grants$
begin
  if not has_function_privilege('service_role','public.rubi_run_automation_action_audited(text,uuid)','EXECUTE')
     or has_function_privilege('anon','public.rubi_run_automation_action_audited(text,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.rubi_run_automation_action_audited(text,uuid)','EXECUTE') then
    raise exception 'Manual retention RPC grants are not least-privilege';
  end if;
end
$grants$;

set local role service_role;
do $owner$
begin
  begin
    perform public.rubi_run_automation_action_audited(
      'RUN_RETENTION_CHECK',current_setting('rubi.qa.non_owner_id')::uuid
    );
    raise exception 'Non-Owner manual retention unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Owner authorization required' then raise; end if;
  end;
end
$owner$;
reset role;

create function pg_temp.rubi_qa_reject_manual_retention_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.action_type = 'RUBI_AUTOMATION_RETENTION_EXECUTED' then
    raise exception 'RUBI_QA_FORCED_MANUAL_RETENTION_AUDIT_FAILURE';
  end if;
  return new;
end;
$trigger$;
create trigger rubi_qa_reject_manual_retention_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_manual_retention_audit();

set local role service_role;
do $rollback$
declare
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
begin
  begin
    perform public.rubi_run_automation_action_audited('RUN_RETENTION_CHECK',v_master);
    raise exception 'Expected forced audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_MANUAL_RETENTION_AUDIT_FAILURE' then raise; end if;
  end;
end
$rollback$;
reset role;

drop trigger rubi_qa_reject_manual_retention_audit on public.admin_audit_log;
drop function pg_temp.rubi_qa_reject_manual_retention_audit();

set local role service_role;
do $success$
declare
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_result jsonb;
  v_count integer;
begin
  v_result := public.rubi_run_automation_action_audited('RUN_RETENTION_CHECK',v_master);
  if coalesce((v_result->>'success')::boolean,false) is not true then
    raise exception 'Manual retention execution did not return success: %',v_result;
  end if;
  select count(*) into v_count from public.admin_audit_log
    where actor_user_id=v_master
      and action_type='RUBI_AUTOMATION_RETENTION_EXECUTED';
  if v_count <> 1 then raise exception 'Expected exactly one actor-attributed retention audit, found %',v_count; end if;
end
$success$;
reset role;
rollback;
