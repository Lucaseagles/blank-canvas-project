\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

do $grants$
begin
  if not has_table_privilege('authenticated','public.share_templates','SELECT')
    or not has_table_privilege('anon','public.share_templates','SELECT')
    or has_table_privilege('anon','public.share_templates','INSERT')
    or has_table_privilege('authenticated','public.share_templates','INSERT')
    or has_table_privilege('authenticated','public.share_templates','UPDATE')
    or has_table_privilege('authenticated','public.share_templates','DELETE') then
    raise exception 'Share template API grants do not match public-read/Owner-read-only contract';
  end if;
  if not has_table_privilege('authenticated','public.share_card_config','SELECT')
    or has_table_privilege('anon','public.share_card_config','SELECT')
    or has_table_privilege('authenticated','public.share_card_config','INSERT')
    or has_table_privilege('authenticated','public.share_card_config','UPDATE')
    or has_table_privilege('authenticated','public.share_card_config','DELETE') then
    raise exception 'Share card config API grants do not match Owner-read-only contract';
  end if;
  if not has_table_privilege('service_role','public.share_templates','UPDATE')
    or not has_table_privilege('service_role','public.share_card_config','UPDATE')
    or not has_function_privilege('service_role','public.rubi_update_share_template_audited(uuid,text,integer,text[],boolean,uuid)','EXECUTE')
    or not has_function_privilege('service_role','public.rubi_update_share_card_config_audited(jsonb,jsonb,uuid)','EXECUTE')
    or has_function_privilege('anon','public.rubi_update_share_template_audited(uuid,text,integer,text[],boolean,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.rubi_update_share_template_audited(uuid,text,integer,text[],boolean,uuid)','EXECUTE')
    or has_function_privilege('anon','public.rubi_update_share_card_config_audited(jsonb,jsonb,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.rubi_update_share_card_config_audited(jsonb,jsonb,uuid)','EXECUTE') then
    raise exception 'Share Studio RPC execution grants are incorrect';
  end if;
end
$grants$;

select set_config('rubi.qa.template_id',(select id::text from public.share_templates order by platform limit 1),true);
select set_config('rubi.qa.template_before',(select caption_template from public.share_templates where id=current_setting('rubi.qa.template_id')::uuid),true);
select set_config('rubi.qa.style_before',(select config_value::text from public.share_card_config where config_key='card_style'),true);
select set_config('rubi.qa.texts_before',(select config_value::text from public.share_card_config where config_key='card_texts'),true);

select set_config('request.jwt.claim.sub',current_setting('rubi.qa.master_id'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rubi.qa.master_id'),'role','authenticated')::text,true);
set local role authenticated;
do $owner_read$
begin
  if not exists(select 1 from public.share_templates where id=current_setting('rubi.qa.template_id')::uuid) then
    raise exception 'Owner cannot read share template';
  end if;
  if not exists(select 1 from public.share_card_config where config_key='card_style') then
    raise exception 'Owner cannot read share card config';
  end if;
end
$owner_read$;
select set_config('request.jwt.claim.sub',current_setting('rubi.qa.non_owner_id'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rubi.qa.non_owner_id'),'role','authenticated')::text,true);
do $non_owner_read$
begin
  if exists(select 1 from public.share_card_config where config_key='card_style') then
    raise exception 'Non-Owner can read private share card config';
  end if;
end
$non_owner_read$;
select set_config('request.jwt.claim.sub',current_setting('rubi.qa.master_id'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('rubi.qa.master_id'),'role','authenticated')::text,true);
do $owner_dml$
begin
  begin
    execute 'insert into public.share_templates default values';
    raise exception 'RUBI_QA_EXPECTED_SHARE_TEMPLATE_INSERT_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.share_templates set caption_template=caption_template where id=current_setting('rubi.qa.template_id')::uuid;
    raise exception 'RUBI_QA_EXPECTED_SHARE_TEMPLATE_UPDATE_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.share_templates where id=current_setting('rubi.qa.template_id')::uuid;
    raise exception 'RUBI_QA_EXPECTED_SHARE_TEMPLATE_DELETE_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    execute 'insert into public.share_card_config default values';
    raise exception 'RUBI_QA_EXPECTED_SHARE_CARD_INSERT_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.share_card_config set config_value=config_value where config_key='card_style';
    raise exception 'RUBI_QA_EXPECTED_SHARE_CARD_UPDATE_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.share_card_config where config_key='card_style';
    raise exception 'RUBI_QA_EXPECTED_SHARE_CARD_DELETE_DENIAL_NOT_RAISED';
  exception when insufficient_privilege then null;
  end;
end
$owner_dml$;
reset role;

create function pg_temp.rubi_qa_reject_share_audit()
returns trigger language plpgsql as $trigger$
begin
  if new.entity_type in ('share_templates','share_card_config') then
    raise exception 'RUBI_QA_FORCED_SHARE_AUDIT_FAILURE';
  end if;
  return new;
end;
$trigger$;
create trigger rubi_qa_reject_share_audit before insert on public.admin_audit_log
for each row execute function pg_temp.rubi_qa_reject_share_audit();

set local role service_role;
do $rollback$
declare
  v_id uuid:=current_setting('rubi.qa.template_id')::uuid;
begin
  begin
    perform public.rubi_update_share_template_audited(v_id,'RUBI QA rollback secret',280,array['qa'],true,current_setting('rubi.qa.master_id')::uuid);
    raise exception 'RUBI_QA_EXPECTED_SHARE_TEMPLATE_AUDIT_FAILURE_NOT_RAISED';
  exception when others then
    if sqlerrm not like '%RUBI_QA_FORCED_SHARE_AUDIT_FAILURE%' then raise; end if;
  end;
  if (select caption_template from public.share_templates where id=v_id) is distinct from current_setting('rubi.qa.template_before') then
    raise exception 'Share template mutation survived audit rollback';
  end if;
  begin
    perform public.rubi_update_share_card_config_audited(
      '{"primary_color":"#112233","secondary_color":"#223344","text_color":"#ffffff","background":"#000000","accent_color":"#ffaa00"}'::jsonb,
      '{"title":"Rollback title","subtitle":"Rollback subtitle","cta":"Rollback CTA","reward_label":"Rollback reward"}'::jsonb,
      current_setting('rubi.qa.master_id')::uuid
    );
    raise exception 'RUBI_QA_EXPECTED_SHARE_CARD_AUDIT_FAILURE_NOT_RAISED';
  exception when others then
    if sqlerrm not like '%RUBI_QA_FORCED_SHARE_AUDIT_FAILURE%' then raise; end if;
  end;
  if (select config_value::text from public.share_card_config where config_key='card_style') is distinct from current_setting('rubi.qa.style_before')
    or (select config_value::text from public.share_card_config where config_key='card_texts') is distinct from current_setting('rubi.qa.texts_before') then
    raise exception 'Share card config mutation survived audit rollback';
  end if;
end
$rollback$;
reset role;
drop trigger rubi_qa_reject_share_audit on public.admin_audit_log;
drop function pg_temp.rubi_qa_reject_share_audit();

set local role service_role;
do $non_owner$
begin
  begin
    perform public.rubi_update_share_template_audited(
      current_setting('rubi.qa.template_id')::uuid,'Denied',280,array['qa'],true,
      current_setting('rubi.qa.non_owner_id')::uuid
    );
    raise exception 'RUBI_QA_EXPECTED_SHARE_NON_OWNER_REJECTION_NOT_RAISED';
  exception when others then
    if sqlerrm not like '%Owner authorization required%' then raise; end if;
  end;
end
$non_owner$;

do $success$
declare
  v_id uuid:=current_setting('rubi.qa.template_id')::uuid;
  v_template jsonb;
  v_config jsonb;
begin
  v_template:=public.rubi_update_share_template_audited(
    v_id,'RUBI QA successful caption',280,array['qa','audit'],true,
    current_setting('rubi.qa.master_id')::uuid
  );
  if v_template->>'caption_template' is distinct from 'RUBI QA successful caption' then
    raise exception 'Share template update did not persist';
  end if;
  v_config:=public.rubi_update_share_card_config_audited(
    '{"primary_color":"#112233","secondary_color":"#223344","text_color":"#ffffff","background":"#000000","accent_color":"#ffaa00"}'::jsonb,
    '{"title":"QA title","subtitle":"QA subtitle","cta":"QA CTA","reward_label":"QA reward"}'::jsonb,
    current_setting('rubi.qa.master_id')::uuid
  );
  if v_config->'card_style'->>'primary_color' is distinct from '#112233'
    or v_config->'card_texts'->>'title' is distinct from 'QA title' then
    raise exception 'Share card config update did not persist';
  end if;
  if (select count(*) from public.admin_audit_log
      where actor_user_id=current_setting('rubi.qa.master_id')::uuid
        and ((entity_type='share_templates' and entity_id=current_setting('rubi.qa.template_id'))
          or (entity_type='share_card_config' and entity_id in ('card_style','card_texts')))
        and action_type in ('RUBI_SHARE_TEMPLATE_UPDATED','RUBI_SHARE_CARD_CONFIG_UPDATED')) <> 3 then
    raise exception 'Expected exactly three sanitized Share Studio audit events';
  end if;
  if exists(select 1 from public.admin_audit_log
    where actor_user_id=current_setting('rubi.qa.master_id')::uuid
      and ((entity_type='share_templates' and entity_id=current_setting('rubi.qa.template_id'))
        or (entity_type='share_card_config' and entity_id in ('card_style','card_texts')))
      and ((coalesce(previous_value,'{}'::jsonb)||coalesce(new_value,'{}'::jsonb))::text
        ilike '%RUBI QA successful caption%' or (coalesce(previous_value,'{}'::jsonb)||coalesce(new_value,'{}'::jsonb))::text ilike '%112233%' or (coalesce(previous_value,'{}'::jsonb)||coalesce(new_value,'{}'::jsonb))::text ilike '%QA title%')) then
    raise exception 'Share Studio audit contains caption content';
  end if;
end
$success$;
reset role;
rollback;
\echo 'PASS: Share Studio Owner-only writes, service-role audited RPCs, read isolation, rollback, actor verification and sanitized audit.'
