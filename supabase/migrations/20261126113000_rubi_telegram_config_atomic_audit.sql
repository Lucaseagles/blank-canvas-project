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
