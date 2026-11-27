\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

-- Auth fixtures create commercial_profiles, but this legacy admin RPC mutates
-- public.profiles. Ensure the disposable consumer has the exact target row.
insert into public.profiles (user_id, display_name, is_banned)
values (:'non_owner_id'::uuid, 'RUBI QA Consumidor', false)
on conflict (user_id) do nothing;

do $grants$
begin
  if not has_function_privilege('service_role','public.admin_set_profile_banned(uuid,boolean,uuid)','EXECUTE')
     or has_function_privilege('anon','public.admin_set_profile_banned(uuid,boolean,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.admin_set_profile_banned(uuid,boolean,uuid)','EXECUTE') then
    raise exception 'User ban RPC grants are not least-privilege';
  end if;
end
$grants$;

set local role service_role;
do $owner$
begin
  begin
    perform public.admin_set_profile_banned(
      current_setting('rubi.qa.master_id')::uuid, true,
      current_setting('rubi.qa.non_owner_id')::uuid
    );
    raise exception 'Non-Owner actor unexpectedly changed a user ban';
  exception when others then
    if sqlerrm <> 'Owner authorization required' then raise; end if;
  end;
end
$owner$;
reset role;

create function pg_temp.rubi_qa_reject_user_ban_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.action_type = 'USER_BAN_STATUS_CHANGED' then
    raise exception 'RUBI_QA_FORCED_USER_BAN_AUDIT_FAILURE';
  end if;
  return new;
end
$trigger$;
create trigger rubi_qa_reject_user_ban_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_user_ban_audit();

set local role service_role;
do $rollback$
declare
  v_user uuid := current_setting('rubi.qa.non_owner_id')::uuid;
  v_before boolean;
begin
  select is_banned into strict v_before from public.profiles where user_id=v_user;
  begin
    perform public.admin_set_profile_banned(v_user,not v_before,current_setting('rubi.qa.master_id')::uuid);
    raise exception 'Expected forced audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_USER_BAN_AUDIT_FAILURE' then raise; end if;
  end;
  if (select is_banned from public.profiles where user_id=v_user) is distinct from v_before then
    raise exception 'User ban mutation survived failed audit insert';
  end if;
end
$rollback$;
reset role;

drop trigger rubi_qa_reject_user_ban_audit on public.admin_audit_log;
drop function pg_temp.rubi_qa_reject_user_ban_audit();

set local role service_role;
do $success$
declare
  v_user uuid := current_setting('rubi.qa.non_owner_id')::uuid;
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_before boolean;
  v_count integer;
begin
  select is_banned into strict v_before from public.profiles where user_id=v_user;
  if public.admin_set_profile_banned(v_user,not v_before,v_master) is not true then
    raise exception 'Owner ban mutation was not confirmed';
  end if;
  select count(*) into v_count from public.admin_audit_log
    where actor_user_id=v_master and action_type='USER_BAN_STATUS_CHANGED'
      and entity_type='profiles' and entity_id=v_user::text;
  if v_count <> 1 then raise exception 'Expected exactly one audit event, got %',v_count; end if;

  -- Repeating the same desired state is idempotent and must not duplicate the audit row.
  if public.admin_set_profile_banned(v_user,not v_before,v_master) is not true then
    raise exception 'Idempotent retry was not accepted';
  end if;
  if (select count(*) from public.admin_audit_log
      where actor_user_id=v_master and action_type='USER_BAN_STATUS_CHANGED'
        and entity_type='profiles' and entity_id=v_user::text) <> 1 then
    raise exception 'Idempotent retry created a duplicate audit event';
  end if;
end
$success$;
reset role;
rollback;
\echo 'PASS: user ban Owner verification, least-privilege grants, atomic rollback, row serialization and idempotent audit.'
