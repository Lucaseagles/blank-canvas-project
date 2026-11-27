\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);
select set_config('rubi.qa.product_id', coalesce((select id::text from public.products order by created_at limit 1),'00000000-0000-0000-0000-000000000000'), true);

do $$
begin
  if current_setting('rubi.qa.product_id')::uuid = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'RUBI_QA product fixture is required';
  end if;
  if has_function_privilege('authenticated','public.rubi_update_product_images_audited(uuid,jsonb,uuid,timestamptz)','EXECUTE')
     or has_function_privilege('anon','public.rubi_update_product_images_audited(uuid,jsonb,uuid,timestamptz)','EXECUTE')
     or not has_function_privilege('service_role','public.rubi_update_product_images_audited(uuid,jsonb,uuid,timestamptz)','EXECUTE') then
    raise exception 'Product media RPC grants are not least-privilege';
  end if;
end $$;

create function pg_temp.rubi_qa_reject_product_media_audit() returns trigger
language plpgsql as $trigger$
begin
  if new.action_type = 'RUBI_PRODUCT_MEDIA_IMAGES_UPDATED' then
    raise exception 'RUBI_QA_FORCED_PRODUCT_MEDIA_AUDIT_FAILURE';
  end if;
  return new;
end;
$trigger$;
create trigger rubi_qa_reject_product_media_audit
before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_product_media_audit();

set local role service_role;
do $$
declare
  v_product uuid := current_setting('rubi.qa.product_id')::uuid;
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_before public.products%rowtype;
  v_after public.products%rowtype;
begin
  select * into v_before from public.products where id=v_product;
  begin
    perform public.rubi_update_product_images_audited(
      v_product, jsonb_build_array('https://example.com/rubi-qa-rollback.webp'),
      v_master, v_before.updated_at
    );
    raise exception 'Expected forced audit failure did not occur';
  exception when others then
    if sqlerrm <> 'RUBI_QA_FORCED_PRODUCT_MEDIA_AUDIT_FAILURE' then raise; end if;
  end;
  select * into v_after from public.products where id=v_product;
  if v_after.images is distinct from v_before.images
     or v_after.updated_at is distinct from v_before.updated_at then
    raise exception 'Product media mutation survived failed audit insert';
  end if;
end $$;
reset role;
drop trigger rubi_qa_reject_product_media_audit on public.admin_audit_log;

set local role service_role;
do $$
declare
  v_product uuid := current_setting('rubi.qa.product_id')::uuid;
  v_master uuid := current_setting('rubi.qa.master_id')::uuid;
  v_non_owner uuid := current_setting('rubi.qa.non_owner_id')::uuid;
  v_before public.products%rowtype;
  v_after public.products%rowtype;
  v_result jsonb;
  v_count integer;
begin
  select * into v_before from public.products where id=v_product;
  begin
    perform public.rubi_update_product_images_audited(
      v_product, jsonb_build_array('https://example.com/rubi-qa-denied.webp'),
      v_non_owner, v_before.updated_at
    );
    raise exception 'Non-Owner mutation unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Owner access required' then raise; end if;
  end;

  v_result := public.rubi_update_product_images_audited(
    v_product, jsonb_build_array('https://example.com/rubi-qa-gallery.webp'),
    v_master, v_before.updated_at
  );
  if v_result->>'id' <> v_product::text or (v_result->>'image_count')::integer <> 1 then
    raise exception 'Product gallery update result is invalid';
  end if;
  select * into v_after from public.products where id=v_product;

  begin
    perform public.rubi_update_product_images_audited(
      v_product, jsonb_build_array('https://example.com/rubi-qa-stale.webp'),
      v_master, v_before.updated_at
    );
    raise exception 'Stale product revision unexpectedly succeeded';
  exception when others then
    if sqlerrm not like 'Product changed%' then raise; end if;
  end;

  v_result := public.rubi_update_product_images_audited(
    v_product, jsonb_build_array('https://example.com/rubi-qa-gallery-final.webp'),
    v_master, v_after.updated_at
  );
  select count(*) into v_count from public.admin_audit_log
    where entity_type='product' and entity_id=v_product::text
      and action_type='RUBI_PRODUCT_MEDIA_IMAGES_UPDATED';
  if v_count <> 2 then raise exception 'Expected two product media audit events, found %',v_count; end if;
  if exists (
    select 1 from public.admin_audit_log
    where entity_type='product' and entity_id=v_product::text
      and action_type='RUBI_PRODUCT_MEDIA_IMAGES_UPDATED'
      and (coalesce(previous_value,'{}'::jsonb) ? 'images' or coalesce(new_value,'{}'::jsonb) ? 'images')
  ) then raise exception 'Raw product image URLs leaked into audit snapshots'; end if;
end $$;
reset role;
rollback;
