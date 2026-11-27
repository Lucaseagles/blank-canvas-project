\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

with product_fixture as (
  insert into public.products(id,title,current_price,status,slug)
  values(gen_random_uuid(),'RUBI QA video hardening product',19.90,'active',
    'rubi-qa-video-hardening-'||replace(gen_random_uuid()::text,'-',''))
  returning id
)
select set_config('rubi.qa.video_product_id',id::text,true) from product_fixture;

do $grants$
declare v_table text;
begin
  foreach v_table in array array['videos','video_products','bridge_videos'] loop
    if not has_table_privilege('anon',format('public.%I',v_table),'SELECT')
       or not has_table_privilege('authenticated',format('public.%I',v_table),'SELECT') then
      raise exception 'Public/Owner SELECT grants were not preserved on %',v_table;
    end if;
    if has_table_privilege('anon',format('public.%I',v_table),'INSERT')
       or has_table_privilege('anon',format('public.%I',v_table),'UPDATE')
       or has_table_privilege('anon',format('public.%I',v_table),'DELETE') then
      raise exception 'anon retains direct DML on %',v_table;
    end if;
    if has_table_privilege('authenticated',format('public.%I',v_table),'INSERT')
       or has_table_privilege('authenticated',format('public.%I',v_table),'UPDATE')
       or has_table_privilege('authenticated',format('public.%I',v_table),'DELETE') then
      raise exception 'authenticated retains direct DML on %',v_table;
    end if;
    if not has_table_privilege('service_role',format('public.%I',v_table),'INSERT')
       or not has_table_privilege('service_role',format('public.%I',v_table),'UPDATE')
       or not has_table_privilege('service_role',format('public.%I',v_table),'DELETE') then
      raise exception 'service_role lost audited writes on %',v_table;
    end if;
  end loop;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='videos'
       and policyname in ('Public can view published videos','Anyone can view published videos') and cmd='SELECT')
     or not exists (select 1 from pg_policies where schemaname='public' and tablename='video_products' and policyname='Public can view video product associations' and cmd='SELECT')
     or not exists (select 1 from pg_policies where schemaname='public' and tablename='bridge_videos' and policyname='Public can view active bridge videos' and cmd='SELECT') then
    raise exception 'One or more public video read policies were removed';
  end if;
end
$grants$;

set local role service_role;
do $seed$
declare v_id uuid; v_product uuid := current_setting('rubi.qa.video_product_id')::uuid; v_result jsonb;
begin
  v_result := public.rubi_manage_video_audited(
    'save',null,
    jsonb_build_object('title','RUBI QA Owner-only draft video','status','draft',
      'external_url','https://example.test/rubi-owner-draft.mp4'),
    jsonb_build_array(v_product),current_setting('rubi.qa.master_id')::uuid
  );
  v_id := (v_result->>'id')::uuid;
  perform set_config('rubi.qa.owner_video_id',v_id::text,true);

  v_result := public.rubi_manage_video_audited(
    'save',null,
    jsonb_build_object('title','RUBI QA public published video','status','published',
      'external_url','https://example.test/rubi-public-published.mp4'),
    jsonb_build_array(v_product),current_setting('rubi.qa.master_id')::uuid
  );
  v_id := (v_result->>'id')::uuid;
  perform set_config('rubi.qa.public_video_id',v_id::text,true);

  v_result := public.rubi_manage_bridge_video_audited(
    'save',null,
    jsonb_build_object('product_id',v_product,'title','RUBI QA Owner-only bridge',
      'platform','youtube','link','https://youtube.com/watch?v=rubi-owner-only','is_active',false),
    current_setting('rubi.qa.master_id')::uuid
  );
  v_id := (v_result->>'id')::uuid;
  perform set_config('rubi.qa.owner_bridge_id',v_id::text,true);

  v_result := public.rubi_manage_bridge_video_audited(
    'save',null,
    jsonb_build_object('product_id',v_product,'title','RUBI QA public active bridge',
      'platform','youtube','link','https://youtube.com/watch?v=rubi-public-active','is_active',true),
    current_setting('rubi.qa.master_id')::uuid
  );
  v_id := (v_result->>'id')::uuid;
  perform set_config('rubi.qa.public_bridge_id',v_id::text,true);
end
$seed$;
reset role;

select set_config('request.jwt.claim.sub',current_setting('rubi.qa.master_id'),true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',current_setting('rubi.qa.master_id'),'role','authenticated')::text,true);
set local role authenticated;
do $owner_read_and_direct_dml$
declare
  v_table text;
  v_column text;
  v_count bigint;
begin
  select count(*) into v_count from public.videos
   where id in (current_setting('rubi.qa.owner_video_id')::uuid,current_setting('rubi.qa.public_video_id')::uuid);
  if v_count<>2 then raise exception 'Owner cannot read both native video records'; end if;

  select count(*) into v_count from public.video_products
   where video_id in (current_setting('rubi.qa.owner_video_id')::uuid,current_setting('rubi.qa.public_video_id')::uuid);
  if v_count<2 then raise exception 'Owner cannot read native video associations'; end if;

  select count(*) into v_count from public.bridge_videos
   where id in (current_setting('rubi.qa.owner_bridge_id')::uuid,current_setting('rubi.qa.public_bridge_id')::uuid);
  if v_count<>2 then raise exception 'Owner cannot read both bridge-video records'; end if;

  foreach v_table in array array['videos','video_products','bridge_videos'] loop
    begin
      execute format('insert into public.%I default values',v_table);
      raise exception 'RUBI_QA_EXPECTED_VIDEO_CONTENT_INSERT_DENIAL_NOT_RAISED: %',v_table;
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
      raise exception 'RUBI_QA_EXPECTED_VIDEO_CONTENT_UPDATE_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('delete from public.%I where false',v_table);
      raise exception 'RUBI_QA_EXPECTED_VIDEO_CONTENT_DELETE_DENIAL_NOT_RAISED: %',v_table;
    exception when insufficient_privilege then null;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub',current_setting('rubi.qa.non_owner_id'),true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub',current_setting('rubi.qa.non_owner_id'),'role','authenticated')::text,true);
  select count(*) into v_count from public.videos
   where id=current_setting('rubi.qa.owner_video_id')::uuid;
  if v_count<>0 then raise exception 'Non-Owner can read draft native video'; end if;
  select count(*) into v_count from public.bridge_videos
   where id=current_setting('rubi.qa.owner_bridge_id')::uuid;
  if v_count<>0 then raise exception 'Non-Owner can read inactive bridge video'; end if;
  select count(*) into v_count from public.videos
   where id=current_setting('rubi.qa.public_video_id')::uuid;
  if v_count<>1 then raise exception 'Public published video read was not preserved'; end if;
  select count(*) into v_count from public.video_products
   where video_id=current_setting('rubi.qa.public_video_id')::uuid;
  if v_count<1 then raise exception 'Public published-video association read was not preserved'; end if;
  select count(*) into v_count from public.bridge_videos
   where id=current_setting('rubi.qa.public_bridge_id')::uuid;
  if v_count<>1 then raise exception 'Public active bridge-video read was not preserved'; end if;
end
$owner_read_and_direct_dml$;
reset role;

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $anon_public_reads$
declare v_count bigint;
begin
  select count(*) into v_count from public.videos
   where id=current_setting('rubi.qa.public_video_id')::uuid;
  if v_count<>1 then raise exception 'anon cannot read published video'; end if;
  select count(*) into v_count from public.video_products
   where video_id=current_setting('rubi.qa.public_video_id')::uuid;
  if v_count<1 then raise exception 'anon cannot read published video associations'; end if;
  select count(*) into v_count from public.bridge_videos
   where id=current_setting('rubi.qa.public_bridge_id')::uuid;
  if v_count<>1 then raise exception 'anon cannot read active bridge video'; end if;
end
$anon_public_reads$;
reset role;
rollback;

\echo 'PASS: audited video RPCs retain writes; direct DML denied on videos/video_products/bridge_videos; Owner-only and public reads preserved.'
