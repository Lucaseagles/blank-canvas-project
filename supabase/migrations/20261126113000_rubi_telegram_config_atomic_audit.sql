-- Sprint 345: save Telegram configuration, Vault references and audit atomically.
-- The nested set_integration_secret calls share this transaction. Any failure, including
-- the final audit insert, rolls back config metadata and Vault changes together.
create or replace function public.rubi_save_telegram_config_audited(
  p_channel_id text,
  p_is_active boolean,
  p_bot_token text,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_config public.telegram_config%rowtype;
  v_existing_count integer;
  v_token_updated boolean := p_bot_token is not null and pg_catalog.length(pg_catalog.btrim(p_bot_token)) > 0;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = p_actor and r.role = 'owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  if p_channel_id is null or pg_catalog.length(pg_catalog.btrim(p_channel_id)) not between 1 and 200
    or p_is_active is null
    or (p_bot_token is not null and pg_catalog.length(pg_catalog.btrim(p_bot_token)) not between 1 and 500) then
    raise exception 'Invalid Telegram configuration';
  end if;

  -- Serialize the singleton config row and Vault reference updates.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rubi:telegram-config:singleton', 0)
  );

  select count(*) into v_existing_count from public.telegram_config;
  if v_existing_count > 1 then
    raise exception 'Multiple Telegram configuration rows exist; reconcile before saving';
  end if;

  -- Both secret writes participate in this outer transaction.
  perform public.set_integration_secret('telegram', 'channel_id', pg_catalog.btrim(p_channel_id));
  if v_token_updated then
    perform public.set_integration_secret('telegram', 'bot_token', pg_catalog.btrim(p_bot_token));
  end if;

  select * into v_config
  from public.telegram_config
  order by updated_at desc
  limit 1
  for update;

  if found then
    update public.telegram_config
      set channel_id = pg_catalog.btrim(p_channel_id),
          is_active = p_is_active,
          bot_token_secret_ref = 'vault:telegram.bot_token',
          updated_at = pg_catalog.now()
    where id = v_config.id
    returning * into v_config;
  else
    insert into public.telegram_config(channel_id, is_active, bot_token_secret_ref)
    values (pg_catalog.btrim(p_channel_id), p_is_active, 'vault:telegram.bot_token')
    returning * into v_config;
  end if;

  -- Never store the Channel ID or Bot Token in audit JSON.
  insert into public.admin_audit_log(
    actor_user_id, actor_email, action_type, entity_type, entity_id, previous_value, new_value
  ) values (
    p_actor, null, 'RUBI_TELEGRAM_CONFIG_UPDATED', 'telegram_config', v_config.id::text,
    jsonb_build_object('changed_fields', jsonb_build_array('channel_id','is_active','bot_token'),
      'values_redacted', true),
    jsonb_build_object('is_active', v_config.is_active, 'bot_token_updated', v_token_updated,
      'channel_id_redacted', true, 'bot_token_redacted', true)
  );

  return jsonb_build_object(
    'id', v_config.id,
    'channel_id', v_config.channel_id,
    'is_active', v_config.is_active,
    'has_token', exists (
      select 1 from public.integration_credentials c
      where c.platform_id = 'telegram'
        and coalesce(c.secret_refs, '{}'::jsonb) ? 'bot_token'
    )
  );
end;
$function$;

revoke all on function public.rubi_save_telegram_config_audited(text,boolean,text,uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_save_telegram_config_audited(text,boolean,text,uuid)
  to service_role;
comment on function public.rubi_save_telegram_config_audited(text,boolean,text,uuid)
  is 'Owner-only atomic Telegram config + Vault secret update + sanitized audit. Vault writes and metadata roll back if any step fails.';

-- Remove Telegram from the generic settings writer. Telegram channel and credentials
-- must be changed only through rubi_save_telegram_config_audited so Vault and metadata
-- cannot drift into a partially updated state.
-- RUBI Sprint 172: fail-closed generic Master setting updates.
-- Allowlist mirrors SETTINGS_REGISTRY and is intentionally static: new sources
-- require a reviewed migration, never an arbitrary public table name.
create or replace function public.rubi_update_admin_setting_audited(
 p_source text,p_id uuid,p_patch jsonb,p_expected jsonb,p_actor uuid
) returns jsonb language plpgsql security invoker set search_path=''
as $fn$
declare
 permitted text[];
 changed_keys text[];
 k text;
 assignments text:='';
 before_row jsonb;
 after_row jsonb;
 sensitive boolean;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 permitted:=case p_source
  when 'personalization_weights' then array['weight']::text[]
  when 'feed_mix_config' then array['relevant_pct','related_pct','discovery_pct']::text[]
  when 'banners' then array['title','image_url','link_url','starts_at','ends_at','is_active','position','audience_segment','target_device','target_category_id','target_product_id','campaign_id']::text[]
  when 'social_proof_config' then array['is_enabled','hybrid_simulation_enabled','show_location','simulated_volume_boost','show_aggregated_counters','min_events_for_counter','counter_window_hours','allowed_event_types','enabled_formats','content_affinity_threshold','low_volume_threshold','adaptive_priority_enabled']::text[]
  when 'popup_rules' then array['priority','cooldown_minutes','frequency_cap_per_day','starts_at','ends_at','content','cta_label','cta_target','is_active']::text[]
  when 'ab_experiments' then array['variant_a','variant_b','target','is_active']::text[]
  when 'automation_rules' then array['trigger_condition','action_params','is_active','is_fully_automated']::text[]
  when 'app_points_config' then array['points','description']::text[]
  when 'badges' then array['name','description','icon','criteria']::text[]
  when 'missions' then array['title','description','criteria','reward_points','is_active']::text[]
  when 'compliance_rules' then array['rule_value','is_enforced','notes','source_url','reviewed_at']::text[]
  when 'feature_flags' then array['is_enabled']::text[]
  when 'marketplaces' then array['status','api_status']::text[]
  when 'whatsapp_config' then array['business_account_id','phone_number_id','is_active','public_phone_number']::text[]
  else null
 end;
 if permitted is null then raise exception 'Unknown configuration source'; end if;
 if p_patch is null or jsonb_typeof(p_patch)<>'object'
  or p_expected is null or jsonb_typeof(p_expected)<>'object'
  or p_patch='{}'::jsonb then
  raise exception 'Configuration patch and expected values are required';
 end if;
 select array_agg(key order by key) into changed_keys from jsonb_object_keys(p_patch) as key;
 foreach k in array changed_keys loop
  if not k=any(permitted) or not p_expected ? k then
   raise exception 'Unapproved or missing expected configuration field: %',k;
  end if;
  assignments:=assignments||
   case when assignments='' then '' else ', ' end||
   format('%I = (jsonb_populate_record(null::public.%I,$2)).%I',k,p_source,k);
 end loop;
 execute format('select to_jsonb(t) from public.%I t where t.id=$1 for update',p_source)
 into before_row using p_id;
 if before_row is null then raise exception 'Configuration record not found'; end if;
 foreach k in array changed_keys loop
  if (before_row->k) is distinct from (p_expected->k) then
   raise exception 'Configuration changed; reload before saving';
  end if;
 end loop;
 if p_source='personalization_weights' and (
  jsonb_typeof(p_patch->'weight')<>'number'
  or (p_patch->>'weight')::numeric not between -1000 and 1000) then
  raise exception 'Invalid personalization weight';
 end if;
 if p_source in ('feed_mix_config','personalization_weights','social_proof_config',
  'automation_rules','app_points_config','feature_flags','whatsapp_config') then
  assignments:=assignments||', updated_at=now()';
 end if;
 execute format('update public.%I t set %s where t.id=$1 returning to_jsonb(t)',p_source,assignments)
 into after_row using p_id,p_patch;
 if after_row is null then raise exception 'Configuration update did not persist'; end if;
 if p_source='feed_mix_config' and (
   (after_row->>'relevant_pct')::integer not between 0 and 100 or
   (after_row->>'related_pct')::integer not between 0 and 100 or
   (after_row->>'discovery_pct')::integer not between 0 and 100 or
   (after_row->>'relevant_pct')::integer+
   (after_row->>'related_pct')::integer+
   (after_row->>'discovery_pct')::integer<>100
 ) then raise exception 'Feed mix must total 100 percent'; end if;
 -- Audit records field names, not configurable URLs, credentials or private JSON.
 -- If an audit insert fails, the configuration update also rolls back.
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,'RUBI_ADMIN_SETTING_UPDATED',p_source,p_id,
  jsonb_build_object('changed_fields',to_jsonb(changed_keys),'values_redacted',true),
  jsonb_build_object('changed_fields',to_jsonb(changed_keys),'values_redacted',true));
 return after_row;
end;
$fn$;
revoke all on function public.rubi_update_admin_setting_audited(text,uuid,jsonb,jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_update_admin_setting_audited(text,uuid,jsonb,jsonb,uuid)
 to service_role;
comment on function public.rubi_update_admin_setting_audited(text,uuid,jsonb,jsonb,uuid)
 is 'Atomic Owner configuration update and sanitized audit, strict table/field allowlist and optimistic expected values.';
