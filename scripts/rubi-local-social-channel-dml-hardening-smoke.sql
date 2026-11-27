\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.consumer_id', :'consumer_id', true);
select set_config('rubi.qa.merchant_id', :'merchant_id', true);
select set_config('rubi.qa.partner_id', :'partner_id', true);

do $grants$
begin
  if not has_function_privilege('service_role','public.rubi_manage_social_channel_audited(text,uuid,jsonb,uuid)','EXECUTE')
     or has_function_privilege('anon','public.rubi_manage_social_channel_audited(text,uuid,jsonb,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.rubi_manage_social_channel_audited(text,uuid,jsonb,uuid)','EXECUTE') then
    raise exception 'Social channel RPC grants are not least-privilege';
  end if;
  if has_table_privilege('anon','public.social_channels','INSERT')
     or has_table_privilege('anon','public.social_channels','UPDATE')
     or has_table_privilege('anon','public.social_channels','DELETE')
     or has_table_privilege('authenticated','public.social_channels','INSERT')
     or has_table_privilege('authenticated','public.social_channels','UPDATE')
     or has_table_privilege('authenticated','public.social_channels','DELETE') then
    raise exception 'Browser role retains direct social channel DML';
  end if;
  if not has_table_privilege('service_role','public.social_channels','INSERT')
     or not has_table_privilege('service_role','public.social_channels','UPDATE')
     or not has_table_privilege('service_role','public.social_channels','DELETE') then
    raise exception 'service_role lost social channel mutation privileges';
  end if;
end
$grants$;

set local role service_role;
do $denials$
declare v_actor uuid;
begin
  foreach v_actor in array array[
    current_setting('rubi.qa.consumer_id')::uuid,
    current_setting('rubi.qa.merchant_id')::uuid,
    current_setting('rubi.qa.partner_id')::uuid
  ] loop
    begin
      perform public.rubi_manage_social_channel_audited(
        'save',null,
        jsonb_build_object('platform','telegram','channel_name','RUBI QA denied',
          'channel_url','https://example.invalid/denied','icon','telegram','is_active',true),
        v_actor
      );
      raise exception 'Non-Owner actor unexpectedly changed social channels: %',v_actor;
    exception when others then
      if sqlerrm <> 'Owner authorization required' then raise; end if;
    end;
  end loop;
end
$denials$;
reset role;

create function pg_temp.rubi_qa_reject_social_channel_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.entity_type='social_channel'
     and new.action_type in ('RUBI_SOCIAL_CHANNEL_CREATED','RUBI_SOCIAL_CHANNEL_UPDATED','RUBI_SOCIAL_CHANNEL_DELETED') then
    raise exception 'RUBI_QA_FORCED_SOCIAL_CHANNEL_AUDIT_FAILURE';
  end if;
  return new;
end
$trigger$;
create trigger rubi_qa_reject_social_channel_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_social_channel_audit();

set local role service_role;
do $rollback$
declare v_name text := 'RUBI QA rollback '||replace(gen_random_uuid()::text,'-','');
begin
  begin
    perform public.rubi_manage_social_channel_audited(
      'save',null,
      jsonb_build_object('platform','telegram','channel_name',v_name,
        'channel_url','https://example.invalid/rollback','icon','telegram','is_active',true),
      current_setting('rubi.qa.master_id')::uuid
    );
    raise exception 'RUBI_QA_EXPECTED_SOCIAL_CHANNEL_AUDIT_FAILURE_NOT_RAISED';
  exception when others then
    if sqlerrm not like '%RUBI_QA_FORCED_SOCIAL_CHANNEL_AUDIT_FAILURE%' then raise; end if;
  end;
  if exists(select 1 from public.social_channels where channel_name=v_name) then
    raise exception 'Social channel survived failed audit insert';
  end if;
end
$rollback$;
reset role;
drop trigger rubi_qa_reject_social_channel_audit on public.admin_audit_log;
drop function pg_temp.rubi_qa_reject_social_channel_audit();

set local role service_role;
do $lifecycle$
declare
  v_created jsonb;
  v_updated jsonb;
  v_deleted jsonb;
  v_id uuid;
  v_name text := 'RUBI QA channel '||replace(gen_random_uuid()::text,'-','');
begin
  v_created:=public.rubi_manage_social_channel_audited(
    'save',null,
    jsonb_build_object('platform','telegram','channel_name',v_name,
      'channel_url','https://example.invalid/private-path?token=not-for-audit','icon','telegram','is_active',true),
    current_setting('rubi.qa.master_id')::uuid
  );
  v_id:=(v_created->>'id')::uuid;

  v_updated:=public.rubi_manage_social_channel_audited(
    'save',v_id,
    jsonb_build_object('platform','telegram','channel_name',v_name||' updated',
      'channel_url','https://example.invalid/updated','icon','telegram','is_active',false),
    current_setting('rubi.qa.master_id')::uuid
  );
  if v_updated->>'id' is distinct from v_id::text then
    raise exception 'Social channel update returned a different identity';
  end if;

  v_deleted:=public.rubi_manage_social_channel_audited(
    'delete',v_id,null,current_setting('rubi.qa.master_id')::uuid
  );
  if v_deleted->>'id' is distinct from v_id::text then
    raise exception 'Social channel delete returned a different identity';
  end if;
  if exists(select 1 from public.social_channels where id=v_id) then
    raise exception 'Social channel delete did not persist';
  end if;
  if (select count(*) from public.admin_audit_log
      where entity_type='social_channel' and entity_id::text=v_id::text
      and action_type in ('RUBI_SOCIAL_CHANNEL_CREATED','RUBI_SOCIAL_CHANNEL_UPDATED','RUBI_SOCIAL_CHANNEL_DELETED')) <> 3 then
    raise exception 'Social channel lifecycle must produce exactly three audit events';
  end if;
  if exists(select 1 from public.admin_audit_log
      where entity_type='social_channel' and entity_id::text=v_id::text
      and coalesce(previous_value,'{}'::jsonb)::text||coalesce(new_value,'{}'::jsonb)::text like '%private-path%') then
    raise exception 'Social channel audit unexpectedly stored a private URL path';
  end if;
end
$lifecycle$;
reset role;
rollback;
\echo 'PASS: social channel direct DML revoked, Owner-only RPC, non-Owner denial, atomic rollback, lifecycle audit and URL redaction.'
