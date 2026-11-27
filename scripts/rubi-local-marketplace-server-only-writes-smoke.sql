\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

do $grants$
begin
  if not has_column_privilege('anon','public.marketplaces','id','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','id','SELECT')
    or not has_column_privilege('anon','public.marketplaces','name','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','name','SELECT')
    or not has_column_privilege('anon','public.marketplaces','slug','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','slug','SELECT')
    or not has_column_privilege('anon','public.marketplaces','status','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','status','SELECT')
    or not has_column_privilege('anon','public.marketplaces','created_at','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','created_at','SELECT')
    or not has_column_privilege('anon','public.marketplaces','icon','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','icon','SELECT') then
    raise exception 'Safe marketplace catalog column grants were removed';
  end if;
  if has_table_privilege('anon','public.marketplaces','INSERT')
    or has_table_privilege('authenticated','public.marketplaces','INSERT')
    or has_table_privilege('anon','public.marketplaces','UPDATE')
    or has_table_privilege('authenticated','public.marketplaces','UPDATE')
    or has_table_privilege('anon','public.marketplaces','DELETE')
    or has_table_privilege('authenticated','public.marketplaces','DELETE') then
    raise exception 'Browser role retains direct marketplace DML';
  end if;
  if has_column_privilege('anon','public.marketplaces','api_config','SELECT')
    or has_column_privilege('authenticated','public.marketplaces','api_config','SELECT')
    or has_column_privilege('anon','public.marketplaces','api_status','SELECT')
    or has_column_privilege('authenticated','public.marketplaces','api_status','SELECT')
    or has_column_privilege('anon','public.marketplaces','affiliate_link_structure','SELECT')
    or has_column_privilege('authenticated','public.marketplaces','affiliate_link_structure','SELECT')
    or has_column_privilege('anon','public.marketplaces','updated_at','SELECT')
    or has_column_privilege('authenticated','public.marketplaces','updated_at','SELECT') then
    raise exception 'Marketplace API credentials and private metadata remain visible to browser roles';
  end if;
  if not has_column_privilege('anon','public.marketplaces','id','SELECT')
    or not has_column_privilege('authenticated','public.marketplaces','name','SELECT') then
    raise exception 'Public marketplace catalog fields were not preserved';
  end if;
  if not has_table_privilege('service_role','public.marketplaces','INSERT')
    or not has_table_privilege('service_role','public.marketplaces','UPDATE')
    or not has_table_privilege('service_role','public.marketplaces','DELETE')
    or not has_function_privilege('service_role','public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)','EXECUTE')
    or has_function_privilege('anon','public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.rubi_manage_marketplace_audited(text,uuid,jsonb,uuid)','EXECUTE') then
    raise exception 'Marketplace service-role write path or RPC grants are incorrect';
  end if;
end
$grants$;

select set_config('request.jwt.claim.sub',current_setting('rubi.qa.master_id'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rubi.qa.master_id'),'role','authenticated')::text,true);
set local role authenticated;
do $owner_read$
begin
  perform id,name,slug,status,created_at from public.marketplaces limit 1;
end
$owner_read$;
do $owner_dml$
begin
  begin
    execute 'insert into public.marketplaces default values';
    raise exception 'RUBI_QA_EXPECTED_MARKETPLACE_INSERT_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.marketplaces set name=name where false;
    raise exception 'RUBI_QA_EXPECTED_MARKETPLACE_UPDATE_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.marketplaces where false;
    raise exception 'RUBI_QA_EXPECTED_MARKETPLACE_DELETE_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
end
$owner_dml$;
select set_config('request.jwt.claim.sub',current_setting('rubi.qa.non_owner_id'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rubi.qa.non_owner_id'),'role','authenticated')::text,true);
do $non_owner_read$
begin
  perform id,name,slug,status,created_at from public.marketplaces limit 1;
end
$non_owner_read$;
reset role;
rollback;
\echo 'PASS: marketplace catalog reads preserved; API secrets/status hidden; direct Owner DML denied; audited service-role RPC retained.'
