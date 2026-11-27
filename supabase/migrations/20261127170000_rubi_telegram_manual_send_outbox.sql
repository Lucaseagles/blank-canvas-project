-- Sprint 362: idempotent Telegram outbox with actor-attributed audit.
alter table public.telegram_messages
  add column if not exists operation_key uuid,
  add column if not exists message_kind text not null default 'manual',
  add column if not exists attempted_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists result_code text;

create unique index if not exists telegram_messages_operation_key_uidx
  on public.telegram_messages(operation_key)
  where operation_key is not null;

create or replace function public.rubi_insert_admin_audit_event_compat(
  p_actor uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_previous jsonb,
  p_new jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $audit$
declare
  v_entity_id_type text;
begin
  select pg_catalog.format_type(a.atttypid, a.atttypmod)
    into v_entity_id_type
    from pg_catalog.pg_attribute a
   where a.attrelid = 'public.admin_audit_log'::regclass
     and a.attname = 'entity_id'
     and a.attnum > 0
     and not a.attisdropped;

  if v_entity_id_type = 'uuid' then
    insert into public.admin_audit_log(
      actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
    ) values (p_actor, p_action, p_entity_type, p_entity_id, p_previous, p_new);
  elsif v_entity_id_type = 'text' then
    insert into public.admin_audit_log(
      actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
    ) values (p_actor, p_action, p_entity_type, p_entity_id::text, p_previous, p_new);
  else
    raise exception 'Unsupported admin_audit_log.entity_id type';
  end if;
end;
$audit$;

revoke all on function public.rubi_insert_admin_audit_event_compat(uuid,text,text,uuid,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.rubi_insert_admin_audit_event_compat(uuid,text,text,uuid,jsonb,jsonb)
  to service_role;

create or replace function public.rubi_prepare_telegram_send_audited(
  p_operation_key uuid,
  p_product_id uuid,
  p_message_text text,
  p_message_kind text,
  p_actor uuid
) returns table(message_id uuid, status text, should_send boolean)
language plpgsql
security invoker
set search_path = ''
as $prepare$
declare
  v_existing public.telegram_messages%rowtype;
  v_message_id uuid;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
     where r.user_id = p_actor and r.role::text = 'owner'
  ) then
    raise exception 'Owner authorization required';
  end if;
  if p_operation_key is null
     or p_message_kind is null
     or p_message_text is null
     or length(pg_catalog.btrim(p_message_text)) < 1
     or length(p_message_text) > 4000
     or p_message_kind not in ('manual','test') then
    raise exception 'Invalid Telegram send request';
  end if;
  if p_message_kind = 'manual' and (
    p_product_id is null or not exists (select 1 from public.products p where p.id = p_product_id)
  ) then
    raise exception 'A valid product is required for a manual Telegram send';
  end if;
  if p_message_kind = 'test' and p_product_id is not null then
    raise exception 'Test Telegram messages cannot reference a product';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rubi:telegram-send:' || p_operation_key::text, 0)
  );

  select * into v_existing
    from public.telegram_messages
   where operation_key = p_operation_key
   for update;

  if found then
    if v_existing.product_id is distinct from p_product_id
       or v_existing.message_text is distinct from p_message_text
       or v_existing.message_kind is distinct from p_message_kind then
      raise exception 'Telegram idempotency key payload mismatch';
    end if;
    return query select v_existing.id, v_existing.status, false;
    return;
  end if;

  insert into public.telegram_messages(
    operation_key, product_id, message_text, message_kind, status, attempted_at
  ) values (
    p_operation_key, p_product_id, p_message_text, p_message_kind, 'sending', pg_catalog.now()
  ) returning id into v_message_id;

  perform public.rubi_insert_admin_audit_event_compat(
    p_actor,
    'TELEGRAM_MESSAGE_SEND_STARTED',
    'telegram_messages',
    v_message_id,
    pg_catalog.jsonb_build_object('status', null),
    pg_catalog.jsonb_build_object(
      'status', 'sending',
      'message_kind', p_message_kind,
      'product_id', p_product_id,
      'message_length', length(p_message_text)
    )
  );

  return query select v_message_id, 'sending'::text, true;
end;
$prepare$;

create or replace function public.rubi_finalize_telegram_send_audited(
  p_message_id uuid,
  p_status text,
  p_provider_message_id text,
  p_result_code text,
  p_actor uuid
) returns text
language plpgsql
security invoker
set search_path = ''
as $finalize$
declare
  v_message public.telegram_messages%rowtype;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r
     where r.user_id = p_actor and r.role::text = 'owner'
  ) then
    raise exception 'Owner authorization required';
  end if;
  if p_status not in ('sent','failed','unknown')
     or (p_status = 'sent' and (
       p_provider_message_id is null
       or pg_catalog.btrim(p_provider_message_id) = ''
       or p_result_code is not null
     ))
     or (p_status <> 'sent' and (
       p_provider_message_id is not null
       or p_result_code is null
       or p_result_code not in ('telegram_rejected','network_unknown','response_invalid')
     )) then
    raise exception 'Invalid Telegram final status';
  end if;
  if p_provider_message_id is not null and length(p_provider_message_id) > 128 then
    raise exception 'Invalid Telegram provider message id';
  end if;

  select * into v_message
    from public.telegram_messages
   where id = p_message_id
   for update;
  if not found then raise exception 'Telegram send operation not found'; end if;

  if v_message.status in ('sent','failed','unknown') then
    if v_message.status = p_status
       and v_message.provider_message_id is not distinct from p_provider_message_id
       and v_message.result_code is not distinct from p_result_code then
      return v_message.status;
    end if;
    raise exception 'Telegram send operation already finalized';
  end if;
  if v_message.status <> 'sending' then
    raise exception 'Telegram send operation is not in sending state';
  end if;

  update public.telegram_messages
     set status = p_status,
         provider_message_id = p_provider_message_id,
         result_code = p_result_code,
         sent_at = case when p_status = 'sent' then pg_catalog.now() else null end
   where id = p_message_id;

  perform public.rubi_insert_admin_audit_event_compat(
    p_actor,
    'TELEGRAM_MESSAGE_SEND_FINISHED',
    'telegram_messages',
    p_message_id,
    pg_catalog.jsonb_build_object('status', v_message.status),
    pg_catalog.jsonb_build_object(
      'status', p_status,
      'provider_message_id', p_provider_message_id,
      'result_code', p_result_code,
      'message_kind', v_message.message_kind
    )
  );

  return p_status;
end;
$finalize$;

revoke all on function public.rubi_prepare_telegram_send_audited(uuid,uuid,text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_prepare_telegram_send_audited(uuid,uuid,text,text,uuid)
  to service_role;

revoke all on function public.rubi_finalize_telegram_send_audited(uuid,text,text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.rubi_finalize_telegram_send_audited(uuid,text,text,text,uuid)
  to service_role;

comment on function public.rubi_prepare_telegram_send_audited(uuid,uuid,text,text,uuid)
  is 'Creates a single idempotent Telegram outbox operation and audit event before any external send.';
comment on function public.rubi_finalize_telegram_send_audited(uuid,text,text,text,uuid)
  is 'Finalizes Telegram outbox state and audit atomically; ambiguous network outcomes remain unknown and are never blindly resent.';
