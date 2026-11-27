\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);
select set_config('rubi.qa.merchant_id', :'merchant_id', true);
select set_config('rubi.qa.partner_id', :'partner_id', true);
select set_config('rubi.qa.product_id', :'product_id', true);

do $grants$
begin
  if not has_function_privilege('service_role','public.rubi_prepare_telegram_send_audited(uuid,uuid,text,text,uuid)','EXECUTE')
     or has_function_privilege('anon','public.rubi_prepare_telegram_send_audited(uuid,uuid,text,text,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.rubi_prepare_telegram_send_audited(uuid,uuid,text,text,uuid)','EXECUTE')
     or not has_function_privilege('service_role','public.rubi_finalize_telegram_send_audited(uuid,text,text,text,uuid)','EXECUTE')
     or has_function_privilege('anon','public.rubi_finalize_telegram_send_audited(uuid,text,text,text,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.rubi_finalize_telegram_send_audited(uuid,text,text,text,uuid)','EXECUTE') then
    raise exception 'Telegram outbox RPC grants are not least-privilege';
  end if;
end
$grants$;

set local role service_role;
do $denials$
declare v_actor uuid;
begin
  foreach v_actor in array array[
    current_setting('rubi.qa.non_owner_id')::uuid,
    current_setting('rubi.qa.merchant_id')::uuid,
    current_setting('rubi.qa.partner_id')::uuid
  ] loop
    begin
      perform * from public.rubi_prepare_telegram_send_audited(
        '36200000-0000-4000-8000-000000000001',
        current_setting('rubi.qa.product_id')::uuid,
        'RUBI QA denied',
        'manual',
        v_actor
      );
      raise exception 'Non-Owner actor unexpectedly prepared Telegram send: %',v_actor;
    exception when others then
      if sqlerrm <> 'Owner authorization required' then raise; end if;
    end;
  end loop;
end
$denials$;

-- Toggleable trigger forces audit failures to prove both transaction boundaries.
select set_config('rubi.qa.reject_telegram_audit','true',true);
create function pg_temp.rubi_qa_reject_telegram_audit() returns trigger
language plpgsql as $trigger$
begin
  if current_setting('rubi.qa.reject_telegram_audit',true) = 'true'
     and new.action_type in ('TELEGRAM_MESSAGE_SEND_STARTED','TELEGRAM_MESSAGE_SEND_FINISHED') then
    raise exception 'RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE';
  end if;
  return new;
end
$trigger$;
create trigger rubi_qa_reject_telegram_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_telegram_audit();

do $rollback$
declare v_id uuid;
begin
  begin
    select message_id into v_id
      from public.rubi_prepare_telegram_send_audited(
        '36200000-0000-4000-8000-000000000002',
        current_setting('rubi.qa.product_id')::uuid,
        'RUBI QA forced rollback',
        'manual',
        current_setting('rubi.qa.master_id')::uuid
      );
    raise exception 'Expected Telegram audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE' then raise; end if;
  end;
  if exists(select 1 from public.telegram_messages where operation_key='36200000-0000-4000-8000-000000000002') then
    raise exception 'Outbox row survived failed start audit';
  end if;
end
$rollback$;

select set_config('rubi.qa.reject_telegram_audit','false',true);

do $prepare$
declare
  v_id uuid;
  v_status text;
  v_send boolean;
  v_retry_id uuid;
  v_retry_send boolean;
  v_audit_count integer;
begin
  select message_id,status,should_send into v_id,v_status,v_send
    from public.rubi_prepare_telegram_send_audited(
      '36200000-0000-4000-8000-000000000003',
      current_setting('rubi.qa.product_id')::uuid,
      'RUBI QA outbox success',
      'manual',
      current_setting('rubi.qa.master_id')::uuid
    );
  if v_status <> 'sending' or v_send is not true then raise exception 'First prepare did not create sendable outbox row'; end if;

  select message_id,should_send into v_retry_id,v_retry_send
    from public.rubi_prepare_telegram_send_audited(
      '36200000-0000-4000-8000-000000000003',
      current_setting('rubi.qa.product_id')::uuid,
      'RUBI QA outbox success',
      'manual',
      current_setting('rubi.qa.master_id')::uuid
    );
  if v_retry_id <> v_id or v_retry_send is not false then raise exception 'Idempotent retry did not suppress duplicate send'; end if;

  begin
    perform * from public.rubi_prepare_telegram_send_audited(
      '36200000-0000-4000-8000-000000000003',
      current_setting('rubi.qa.product_id')::uuid,
      'Different payload',
      'manual',
      current_setting('rubi.qa.master_id')::uuid
    );
    raise exception 'Idempotency key accepted a different payload';
  exception when others then
    if sqlerrm <> 'Telegram idempotency key payload mismatch' then raise; end if;
  end;

  -- Failed finalization must roll back if its audit insert fails.
  perform set_config('rubi.qa.reject_telegram_audit','true',true);
  begin
    perform public.rubi_finalize_telegram_send_audited(v_id,'sent','qa-provider-1',null,current_setting('rubi.qa.master_id')::uuid);
    raise exception 'Expected finalization audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE' then raise; end if;
  end;
  if (select status from public.telegram_messages where id=v_id) <> 'sending' then
    raise exception 'Telegram finalization survived failed audit';
  end if;
  perform set_config('rubi.qa.reject_telegram_audit','false',true);

  if public.rubi_finalize_telegram_send_audited(v_id,'sent','qa-provider-1',null,current_setting('rubi.qa.master_id')::uuid) <> 'sent' then
    raise exception 'Telegram send did not finalize';
  end if;
  if public.rubi_finalize_telegram_send_audited(v_id,'sent','qa-provider-1',null,current_setting('rubi.qa.master_id')::uuid) <> 'sent' then
    raise exception 'Idempotent finalization failed';
  end if;
  select count(*) into v_audit_count from public.admin_audit_log
    where actor_user_id=current_setting('rubi.qa.master_id')::uuid
      and entity_type='telegram_messages' and entity_id::text=v_id::text
      and action_type in ('TELEGRAM_MESSAGE_SEND_STARTED','TELEGRAM_MESSAGE_SEND_FINISHED');
  if v_audit_count <> 2 then raise exception 'Expected exactly two Telegram audit events, got %',v_audit_count; end if;
end
$prepare$;
reset role;
rollback;
\echo 'PASS: Telegram outbox Owner-only grants, non-owner denial, atomic audit rollback, idempotency, payload binding and finalization.'
