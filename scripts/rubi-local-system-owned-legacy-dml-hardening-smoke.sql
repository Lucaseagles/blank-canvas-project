\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.fixture_content_id', gen_random_uuid()::text, true);
select set_config('rubi.qa.fixture_queue_id', gen_random_uuid()::text, true);
insert into public.content_notification_queue(id,content_type,content_id)
values (current_setting('rubi.qa.fixture_queue_id')::uuid,'qa',current_setting('rubi.qa.fixture_content_id')::uuid);
insert into public.content_affinity_log(content_id,user_id,affinity_score,notified)
values (current_setting('rubi.qa.fixture_content_id')::uuid,:'master_id'::uuid,90,true);

do $grants$
declare
  v_table text;
  v_tables text[] := array['content_notification_queue','content_affinity_log'];
begin
  if to_regclass('public.support_ai_config') is not null then v_tables := array_append(v_tables,'support_ai_config'); end if;
  if to_regclass('public.offer_products') is not null then v_tables := array_append(v_tables,'offer_products'); end if;
  if to_regclass('public.recommendation_config') is not null then v_tables := array_append(v_tables,'recommendation_config'); end if;

  foreach v_table in array v_tables loop
    if has_table_privilege('anon',format('public.%I',v_table),'SELECT')
       or has_table_privilege('anon',format('public.%I',v_table),'INSERT')
       or has_table_privilege('anon',format('public.%I',v_table),'UPDATE')
       or has_table_privilege('anon',format('public.%I',v_table),'DELETE') then
      raise exception 'anon retains direct access to system/legacy table %',v_table;
    end if;
    if not has_table_privilege('authenticated',format('public.%I',v_table),'SELECT')
       or has_table_privilege('authenticated',format('public.%I',v_table),'INSERT')
       or has_table_privilege('authenticated',format('public.%I',v_table),'UPDATE')
       or has_table_privilege('authenticated',format('public.%I',v_table),'DELETE') then
      raise exception 'authenticated privileges do not match Owner-read-only contract on %',v_table;
    end if;
    if not has_table_privilege('service_role',format('public.%I',v_table),'INSERT')
       or not has_table_privilege('service_role',format('public.%I',v_table),'UPDATE')
       or not has_table_privilege('service_role',format('public.%I',v_table),'DELETE') then
      raise exception 'service_role lost system/legacy write privileges on %',v_table;
    end if;
    if not exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename=v_table and p.cmd='SELECT'
        and p.roles && array['authenticated']::name[]
        and (coalesce(p.qual,'') ilike '%owner%' or coalesce(p.qual,'') ilike '%is_admin%')
    ) then
      raise exception 'Owner SELECT policy missing on %',v_table;
    end if;
  end loop;

  if not has_function_privilege('service_role','public.calculate_content_affinity(uuid,text)','EXECUTE')
     or has_function_privilege('anon','public.calculate_content_affinity(uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.calculate_content_affinity(uuid,text)','EXECUTE')
     or not has_function_privilege('service_role','public.process_content_notification_queue(integer)','EXECUTE')
     or has_function_privilege('anon','public.process_content_notification_queue(integer)','EXECUTE')
     or has_function_privilege('authenticated','public.process_content_notification_queue(integer)','EXECUTE') then
    raise exception 'System worker function grants are not service-role-only';
  end if;
end
$grants$;

select set_config('request.jwt.claim.sub',current_setting('rubi.qa.master_id'),true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',current_setting('rubi.qa.master_id'),'role','authenticated')::text,true);
set local role authenticated;
do $owner_read$
begin
  if (select count(*) from public.content_notification_queue where id=current_setting('rubi.qa.fixture_queue_id')::uuid) <> 1 then
    raise exception 'Owner cannot read seeded content notification queue row';
  end if;
  if (select count(*) from public.content_affinity_log where content_id=current_setting('rubi.qa.fixture_content_id')::uuid) <> 1 then
    raise exception 'Owner cannot read seeded content affinity row';
  end if;
end
$owner_read$;
select set_config('request.jwt.claim.sub', :'non_owner_id', true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub', :'non_owner_id', 'role','authenticated')::text,true);
do $non_owner_read$
begin
  if (select count(*) from public.content_notification_queue where id=current_setting('rubi.qa.fixture_queue_id')::uuid) <> 0 then
    raise exception 'Non-Owner can read content notification queue row';
  end if;
  if (select count(*) from public.content_affinity_log where content_id=current_setting('rubi.qa.fixture_content_id')::uuid) <> 0 then
    raise exception 'Non-Owner can read content affinity row';
  end if;
end
$non_owner_read$;
select set_config('request.jwt.claim.sub', :'master_id', true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub', :'master_id', 'role','authenticated')::text,true);
do $owner_direct_dml$
declare
  v_table text;
  v_column text;
  v_tables text[] := array['content_notification_queue','content_affinity_log'];
begin
  if to_regclass('public.support_ai_config') is not null then v_tables := array_append(v_tables,'support_ai_config'); end if;
  if to_regclass('public.offer_products') is not null then v_tables := array_append(v_tables,'offer_products'); end if;
  if to_regclass('public.recommendation_config') is not null then v_tables := array_append(v_tables,'recommendation_config'); end if;

  foreach v_table in array v_tables loop
    begin
      execute format('insert into public.%I default values',v_table);
      raise exception 'RUBI_QA_EXPECTED_SYSTEM_LEGACY_INSERT_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;
    select a.attname into v_column
    from pg_attribute a
    where a.attrelid=format('public.%I',v_table)::regclass
      and a.attnum>0 and not a.attisdropped and a.attgenerated='' and a.attidentity=''
    order by a.attnum limit 1;
    if v_column is null then raise exception 'No updateable column found for %',v_table; end if;
    begin
      execute format('update public.%I set %I=%I where false',v_table,v_column,v_column);
      raise exception 'RUBI_QA_EXPECTED_SYSTEM_LEGACY_UPDATE_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('delete from public.%I where false',v_table);
      raise exception 'RUBI_QA_EXPECTED_SYSTEM_LEGACY_DELETE_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;
  end loop;
end
$owner_direct_dml$;
reset role;
rollback;

\echo 'PASS: system-owned queue/log and present legacy config tables deny direct API DML; trusted workers retain access.'
