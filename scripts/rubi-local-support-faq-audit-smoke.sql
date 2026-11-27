\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

do $$
begin
  if has_function_privilege('authenticated','public.rubi_manage_support_faq_audited(text,uuid,jsonb,uuid,timestamptz)','EXECUTE')
     or has_function_privilege('anon','public.rubi_manage_support_faq_audited(text,uuid,jsonb,uuid,timestamptz)','EXECUTE')
     or not has_function_privilege('service_role','public.rubi_manage_support_faq_audited(text,uuid,jsonb,uuid,timestamptz)','EXECUTE') then
    raise exception 'Support FAQ RPC grants are not least-privilege';
  end if;
  if not has_table_privilege('anon','public.support_faq','SELECT')
     or not has_table_privilege('authenticated','public.support_faq','SELECT')
     or has_table_privilege('anon','public.support_faq','INSERT')
     or has_table_privilege('anon','public.support_faq','UPDATE')
     or has_table_privilege('anon','public.support_faq','DELETE')
     or has_table_privilege('authenticated','public.support_faq','INSERT')
     or has_table_privilege('authenticated','public.support_faq','UPDATE')
     or has_table_privilege('authenticated','public.support_faq','DELETE') then
    raise exception 'Public FAQ read must remain while browser DML is denied';
  end if;
end $$;

create function pg_temp.rubi_qa_reject_support_faq_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.action_type like 'RUBI_SUPPORT_FAQ_%' then
    raise exception 'RUBI_QA_FORCED_SUPPORT_FAQ_AUDIT_FAILURE';
  end if;
  return new;
end;
$trigger$;
create trigger rubi_qa_reject_support_faq_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_support_faq_audit();

set local role service_role;
do $$
declare
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_count integer;
begin
  begin
    perform public.rubi_manage_support_faq_audited(
      'create', null,
      jsonb_build_object('question','RUBI QA rollback question','answer','Disposable rollback probe','keywords',jsonb_build_array('qa'),'priority',1,'is_active',true),
      v_master, null
    );
    raise exception 'Expected forced audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_SUPPORT_FAQ_AUDIT_FAILURE' then raise; end if;
  end;
  select count(*) into v_count from public.support_faq where question='RUBI QA rollback question';
  if v_count <> 0 then raise exception 'FAQ mutation survived failed audit insert'; end if;
end $$;
reset role;
drop trigger rubi_qa_reject_support_faq_audit on public.admin_audit_log;

set local role service_role;
do $$
declare
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_non_owner uuid := current_setting('rubi.qa.non_owner_id')::uuid;
  v_result jsonb;
  v_id uuid;
  v_updated timestamptz;
  v_count integer;
begin
  begin
    perform public.rubi_manage_support_faq_audited(
      'create', null,
      jsonb_build_object('question','RUBI QA non-owner question','answer','Should be denied','keywords',jsonb_build_array('qa'),'priority',1,'is_active',true),
      v_non_owner, null
    );
    raise exception 'Non-Owner mutation unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Owner access required' then raise; end if;
  end;

  v_result := public.rubi_manage_support_faq_audited(
    'create', null,
    jsonb_build_object('question','RUBI QA support FAQ question','answer','Disposable support FAQ answer','keywords',jsonb_build_array('qa','categoria:geral'),'priority',7,'is_active',true),
    v_master, null
  );
  v_id := (v_result->>'id')::uuid;
  select updated_at into v_updated from public.support_faq where id=v_id;

  v_result := public.rubi_manage_support_faq_audited(
    'update', v_id,
    jsonb_build_object('question','RUBI QA support FAQ revised','answer','Revised disposable answer','keywords',jsonb_build_array('qa'),'priority',9,'is_active',true),
    v_master, v_updated
  );
  select updated_at into v_updated from public.support_faq where id=v_id;

  v_result := public.rubi_manage_support_faq_audited('toggle',v_id,
    jsonb_build_object('is_active',false),v_master,v_updated);
  if coalesce((v_result->'row'->>'is_active')::boolean,true) then raise exception 'FAQ toggle did not persist'; end if;

  begin
    perform public.rubi_manage_support_faq_audited('delete',v_id,'{}'::jsonb,v_master,now()-interval '1 day');
    raise exception 'Stale FAQ revision unexpectedly succeeded';
  exception when others then
    if sqlerrm not like 'Support FAQ article changed%' then raise; end if;
  end;

  select updated_at into v_updated from public.support_faq where id=v_id;
  perform public.rubi_manage_support_faq_audited('delete',v_id,'{}'::jsonb,v_master,v_updated);

  select count(*) into v_count from public.admin_audit_log
    where entity_type='support_faq' and entity_id=v_id::text
      and action_type in ('RUBI_SUPPORT_FAQ_CREATED','RUBI_SUPPORT_FAQ_UPDATED','RUBI_SUPPORT_FAQ_STATUS_CHANGED','RUBI_SUPPORT_FAQ_DELETED');
  if v_count <> 4 then raise exception 'Expected four FAQ audit events, found %',v_count; end if;
end $$;
reset role;
rollback;
