-- Sprint 362: Social Sharing Studio configuration changes must be audited atomically.
-- Share history remains a user-owned event; this migration only hardens global templates/card configuration.

drop policy if exists share_templates_owner_write_s38 on public.share_templates;
drop policy if exists share_templates_owner_select_s38 on public.share_templates;
create policy share_templates_owner_select_s38
  on public.share_templates for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'));

drop policy if exists share_card_config_owner_write_s38 on public.share_card_config;
drop policy if exists share_card_config_authenticated_read_s38 on public.share_card_config;
create policy share_card_config_owner_select_s38
  on public.share_card_config for select to authenticated
  using (public.has_role((select auth.uid()), 'owner'));

revoke insert, update, delete on public.share_templates from public, anon, authenticated;
revoke insert, update, delete on public.share_card_config from public, anon, authenticated;
grant select on public.share_templates to anon, authenticated;
grant select on public.share_card_config to authenticated;
grant all privileges on public.share_templates, public.share_card_config to service_role;

create or replace function public.rubi_update_share_template_audited(
  p_template_id uuid,
  p_caption_template text,
  p_max_length integer,
  p_hashtags text[],
  p_is_active boolean,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_before public.share_templates%rowtype;
  v_after public.share_templates%rowtype;
  v_entity_id_is_uuid boolean;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if p_template_id is null or p_is_active is null
    or p_caption_template is null or length(btrim(p_caption_template)) not between 1 and 4096
    or p_max_length is null or p_max_length not between 1 and 4096
    or p_hashtags is null or cardinality(p_hashtags)>40
    or exists(select 1 from unnest(p_hashtags) h where length(h)>80) then
    raise exception 'Invalid social share template';
  end if;
  select * into v_before from public.share_templates where id=p_template_id for update;
  if not found then raise exception 'Social share template not found'; end if;
  update public.share_templates set
    caption_template=btrim(p_caption_template), max_length=p_max_length,
    hashtags=p_hashtags, is_active=p_is_active, updated_at=now()
  where id=p_template_id returning * into v_after;
  select a.atttypid='uuid'::regtype into v_entity_id_is_uuid
    from pg_attribute a
    where a.attrelid='public.admin_audit_log'::regclass and a.attname='entity_id'
      and a.attnum>0 and not a.attisdropped;
  if v_entity_id_is_uuid is null then raise exception 'admin_audit_log.entity_id column missing'; end if;
  if v_entity_id_is_uuid then
    execute 'insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value) values ($1,null,$2,$3,$4,$5,$6)'
      using p_actor,'RUBI_SHARE_TEMPLATE_UPDATED','share_templates',v_after.id,
        jsonb_build_object('platform',v_before.platform,'active',v_before.is_active,
          'caption_length',length(v_before.caption_template),'max_length',v_before.max_length,
          'hashtag_count',cardinality(v_before.hashtags)),
        jsonb_build_object('platform',v_after.platform,'active',v_after.is_active,
          'caption_length',length(v_after.caption_template),'max_length',v_after.max_length,
          'hashtag_count',cardinality(v_after.hashtags));
  else
    execute 'insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value) values ($1,null,$2,$3,$4,$5,$6)'
      using p_actor,'RUBI_SHARE_TEMPLATE_UPDATED','share_templates',v_after.id::text,
        jsonb_build_object('platform',v_before.platform,'active',v_before.is_active,
          'caption_length',length(v_before.caption_template),'max_length',v_before.max_length,
          'hashtag_count',cardinality(v_before.hashtags)),
        jsonb_build_object('platform',v_after.platform,'active',v_after.is_active,
          'caption_length',length(v_after.caption_template),'max_length',v_after.max_length,
          'hashtag_count',cardinality(v_after.hashtags));
  end if;
  return jsonb_build_object('id',v_after.id,'platform',v_after.platform,
    'caption_template',v_after.caption_template,'max_length',v_after.max_length,
    'hashtags',v_after.hashtags,'is_active',v_after.is_active,'updated_at',v_after.updated_at);
end;
$fn$;

create or replace function public.rubi_update_share_card_config_audited(
  p_style jsonb,
  p_texts jsonb,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $fn$
declare
  v_style_before jsonb;
  v_text_before jsonb;
  v_style_after jsonb;
  v_text_after jsonb;
  v_style_id uuid;
  v_text_id uuid;
  v_entity_id_is_uuid boolean;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if jsonb_typeof(p_style)<>'object' or jsonb_typeof(p_texts)<>'object'
    or (select count(*) from jsonb_object_keys(p_style))<>5
    or (select count(*) from jsonb_object_keys(p_texts))<>4
    or not (p_style ?& array['primary_color','secondary_color','text_color','background','accent_color'])
    or not (p_texts ?& array['title','subtitle','cta','reward_label']) then
    raise exception 'Invalid social share card configuration';
  end if;
  if exists(select 1 from jsonb_each_text(p_style) e where length(e.value)>100)
    or exists(select 1 from jsonb_each_text(p_texts) e where length(e.value)>500) then
    raise exception 'Social share card configuration value too long';
  end if;
  select id,config_value into v_style_id,v_style_before from public.share_card_config where config_key='card_style' for update;
  select id,config_value into v_text_id,v_text_before from public.share_card_config where config_key='card_texts' for update;
  if v_style_before is null or v_text_before is null then raise exception 'Social share card configuration rows missing'; end if;
  update public.share_card_config set config_value=p_style,updated_at=now()
    where config_key='card_style' returning config_value into v_style_after;
  update public.share_card_config set config_value=p_texts,updated_at=now()
    where config_key='card_texts' returning config_value into v_text_after;
  select a.atttypid='uuid'::regtype into v_entity_id_is_uuid
    from pg_attribute a
    where a.attrelid='public.admin_audit_log'::regclass and a.attname='entity_id'
      and a.attnum>0 and not a.attisdropped;
  if v_entity_id_is_uuid is null then raise exception 'admin_audit_log.entity_id column missing'; end if;
  if v_entity_id_is_uuid then
    execute 'insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value) values ($1,null,$2,$3,$4,$5,$6),($1,null,$2,$3,$7,$8,$9)'
      using p_actor,'RUBI_SHARE_CARD_CONFIG_UPDATED','share_card_config',v_style_id,
        jsonb_build_object('keys',array(select jsonb_object_keys(v_style_before))),
        jsonb_build_object('keys',array(select jsonb_object_keys(v_style_after))),
        v_text_id,
        jsonb_build_object('keys',array(select jsonb_object_keys(v_text_before))),
        jsonb_build_object('keys',array(select jsonb_object_keys(v_text_after)));
  else
    execute 'insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value) values ($1,null,$2,$3,$4,$5,$6),($1,null,$2,$3,$7,$8,$9)'
      using p_actor,'RUBI_SHARE_CARD_CONFIG_UPDATED','share_card_config','card_style',
        jsonb_build_object('keys',array(select jsonb_object_keys(v_style_before))),
        jsonb_build_object('keys',array(select jsonb_object_keys(v_style_after))),
        'card_texts',
        jsonb_build_object('keys',array(select jsonb_object_keys(v_text_before))),
        jsonb_build_object('keys',array(select jsonb_object_keys(v_text_after)));
  end if;
  return jsonb_build_object('card_style',v_style_after,'card_texts',v_text_after);
end;
$fn$;

revoke all on function public.rubi_update_share_template_audited(uuid,text,integer,text[],boolean,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_update_share_template_audited(uuid,text,integer,text[],boolean,uuid)
  to service_role;
revoke all on function public.rubi_update_share_card_config_audited(jsonb,jsonb,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_update_share_card_config_audited(jsonb,jsonb,uuid)
  to service_role;

comment on function public.rubi_update_share_template_audited(uuid,text,integer,text[],boolean,uuid)
  is 'Owner-only social sharing template update with row lock, service-role execution and sanitized atomic audit.';
comment on function public.rubi_update_share_card_config_audited(jsonb,jsonb,uuid)
  is 'Owner-only atomic social sharing card configuration update with sanitized audit; config values are never copied into audit payloads.';
