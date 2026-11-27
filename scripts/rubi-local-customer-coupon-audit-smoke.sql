\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);
select set_config('rubi.qa.marketplace_id', coalesce((select id::text from public.marketplaces order by created_at limit 1),'00000000-0000-0000-0000-000000000000'), true);

do $$
begin
  if current_setting('rubi.qa.marketplace_id')::uuid = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'RUBI_QA marketplace fixture is required';
  end if;
  if has_function_privilege('authenticated','public.rubi_manage_customer_coupon_audited(text,uuid,jsonb,uuid,timestamptz)','EXECUTE')
     or has_function_privilege('anon','public.rubi_manage_customer_coupon_audited(text,uuid,jsonb,uuid,timestamptz)','EXECUTE')
     or not has_function_privilege('service_role','public.rubi_manage_customer_coupon_audited(text,uuid,jsonb,uuid,timestamptz)','EXECUTE') then
    raise exception 'Customer coupon RPC grants are not least-privilege';
  end if;
  if has_table_privilege('authenticated','public.customer_coupons','INSERT')
     or has_table_privilege('authenticated','public.customer_coupons','UPDATE')
     or has_table_privilege('authenticated','public.customer_coupons','DELETE') then
    raise exception 'Browser role still has direct customer coupon DML';
  end if;
end $$;

create function pg_temp.rubi_qa_reject_coupon_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.action_type like 'RUBI_CUSTOMER_COUPON_%' then
    raise exception 'RUBI_QA_FORCED_COUPON_AUDIT_FAILURE';
  end if;
  return new;
end;
$trigger$;
create trigger rubi_qa_reject_coupon_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_coupon_audit();

set local role service_role;
do $$
declare
  v_marketplace uuid := current_setting('rubi.qa.marketplace_id')::uuid;
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_count integer;
begin
  begin
    perform public.rubi_manage_customer_coupon_audited(
      'create', null,
      jsonb_build_object(
        'marketplace_id',v_marketplace,'code','RUBI-QA-ATOMIC-COUPON',
        'description','rollback probe','discount_type','percentage','discount_value',10,
        'valid_from',now(),'valid_until',null,'is_active',true,'product_id',null,
        'category_id',null,'max_uses',null
      ), v_master, null
    );
    raise exception 'Expected forced audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_COUPON_AUDIT_FAILURE' then raise; end if;
  end;
  select count(*) into v_count from public.customer_coupons where code='RUBI-QA-ATOMIC-COUPON';
  if v_count <> 0 then raise exception 'Coupon mutation survived failed audit insert'; end if;
end $$;
reset role;
drop trigger rubi_qa_reject_coupon_audit on public.admin_audit_log;

set local role service_role;
do $$
declare
  v_marketplace uuid := current_setting('rubi.qa.marketplace_id')::uuid;
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_non_owner uuid := current_setting('rubi.qa.non_owner_id')::uuid;
  v_result jsonb;
  v_coupon_id uuid;
  v_updated timestamptz;
  v_count integer;
begin
  begin
    perform public.rubi_manage_customer_coupon_audited(
      'create', null,
      jsonb_build_object(
        'marketplace_id',v_marketplace,'code','RUBI-QA-ATOMIC-COUPON',
        'description','non-owner probe','discount_type','percentage','discount_value',10,
        'valid_from',now(),'valid_until',null,'is_active',true,'product_id',null,
        'category_id',null,'max_uses',null
      ), v_non_owner, null
    );
    raise exception 'Non-Owner mutation unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Owner access required' then raise; end if;
  end;

  v_result := public.rubi_manage_customer_coupon_audited(
    'create', null,
    jsonb_build_object(
      'marketplace_id',v_marketplace,'code','RUBI-QA-ATOMIC-COUPON',
      'description','successful probe','discount_type','percentage','discount_value',10,
      'valid_from',now(),'valid_until',null,'is_active',true,'product_id',null,
      'category_id',null,'max_uses',null
    ), v_master, null
  );
  v_coupon_id := (v_result->>'id')::uuid;
  select updated_at into v_updated from public.customer_coupons where id=v_coupon_id;
  v_result := public.rubi_manage_customer_coupon_audited('toggle',v_coupon_id,
    jsonb_build_object('is_active',false),v_master,v_updated);
  if coalesce((v_result->'row'->>'is_active')::boolean,true) then raise exception 'Coupon toggle did not persist'; end if;

  begin
    perform public.rubi_manage_customer_coupon_audited('delete',v_coupon_id,'{}'::jsonb,v_master,now()-interval '1 day');
    raise exception 'Stale coupon revision unexpectedly succeeded';
  exception when others then
    if sqlerrm not like 'Customer coupon changed%' then raise; end if;
  end;

  select updated_at into v_updated from public.customer_coupons where id=v_coupon_id;
  perform public.rubi_manage_customer_coupon_audited('delete',v_coupon_id,'{}'::jsonb,v_master,v_updated);
  select count(*) into v_count from public.admin_audit_log
    where entity_type='customer_coupon' and entity_id=v_coupon_id::text
      and action_type in ('RUBI_CUSTOMER_COUPON_CREATED','RUBI_CUSTOMER_COUPON_STATUS_CHANGED','RUBI_CUSTOMER_COUPON_DELETED');
  if v_count <> 3 then raise exception 'Expected exactly three coupon audit events, found %',v_count; end if;
end $$;
reset role;
rollback;
