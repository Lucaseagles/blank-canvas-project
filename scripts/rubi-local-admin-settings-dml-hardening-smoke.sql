\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

do $grants$
declare
  v_table text;
  v_tables text[] := array[
    'app_points_config','automation_rules','banners','compliance_rules',
    'feed_mix_config','personalization_weights','social_proof_config','telegram_config','whatsapp_config'
  ];
begin
  if to_regclass('public.feature_flags') is not null then
    v_tables := array_append(v_tables,'feature_flags');
  end if;
  foreach v_table in array v_tables loop
    if has_table_privilege('anon',format('public.%I',v_table),'INSERT')
       or has_table_privilege('anon',format('public.%I',v_table),'UPDATE')
       or has_table_privilege('anon',format('public.%I',v_table),'DELETE') then
      raise exception 'anon retains direct DML on %',v_table;
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
      raise exception 'service_role lost audited write privileges on %',v_table;
    end if;
  end loop;

  if not has_table_privilege('anon','public.banners','SELECT') then
    raise exception 'Public active-banner read grant was not preserved';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='banners'
      and policyname='Allow public read-only access to active banners' and cmd='SELECT'
  ) then
    raise exception 'Public active-banner RLS policy was not preserved';
  end if;
end
$grants$;

set local role service_role;
insert into public.app_points_config(action_key,points,description)
values ('rubi_qa_admin_settings_dml_hardening',0,'Disposable admin settings DML hardening fixture')
on conflict (action_key) do nothing;
reset role;

select set_config('request.jwt.claim.sub', current_setting('rubi.qa.master_id'), true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',current_setting('rubi.qa.master_id'),'role','authenticated')::text, true);
set local role authenticated;
do $owner_read_and_direct_dml$
declare
  v_table text;
  v_column text;
  v_tables text[] := array[
    'app_points_config','automation_rules','banners','compliance_rules',
    'feed_mix_config','personalization_weights','social_proof_config','telegram_config','whatsapp_config'
  ];
  v_count bigint;
begin
  if to_regclass('public.feature_flags') is not null then
    v_tables := array_append(v_tables,'feature_flags');
  end if;
  select count(*) into v_count from public.app_points_config
   where action_key='rubi_qa_admin_settings_dml_hardening';
  if v_count <> 1 then raise exception 'Owner cannot read the admin settings fixture'; end if;

  foreach v_table in array v_tables loop
    begin
      execute format('insert into public.%I default values',v_table);
      raise exception 'RUBI_QA_EXPECTED_ADMIN_SETTINGS_INSERT_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;

    select a.attname into v_column
    from pg_attribute a
    where a.attrelid=format('public.%I',v_table)::regclass
      and a.attnum>0 and not a.attisdropped
      and a.attgenerated='' and a.attidentity=''
    order by a.attnum limit 1;
    if v_column is null then raise exception 'No updateable column found for %',v_table; end if;

    begin
      execute format('update public.%I set %I=%I where false',v_table,v_column,v_column);
      raise exception 'RUBI_QA_EXPECTED_ADMIN_SETTINGS_UPDATE_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;

    begin
      execute format('delete from public.%I where false',v_table);
      raise exception 'RUBI_QA_EXPECTED_ADMIN_SETTINGS_DELETE_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub',current_setting('rubi.qa.non_owner_id'),true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub',current_setting('rubi.qa.non_owner_id'),'role','authenticated')::text,true);
  select count(*) into v_count from public.app_points_config
   where action_key='rubi_qa_admin_settings_dml_hardening';
  if v_count <> 0 then raise exception 'Non-Owner can read Owner-only app points configuration'; end if;
end
$owner_read_and_direct_dml$;
reset role;
rollback;
\echo 'PASS: Admin Settings Owner-only reads, public banner read preserved, direct DML denied for 10 settings tables, service-role audited writes retained.'
