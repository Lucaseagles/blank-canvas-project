-- Sprint 308: atomically pause a strategy orchestration and record a minimal audit event.
-- The caller must use the authenticated user client; service-role access is not granted.
create or replace function public.rubi_pause_strategy_orchestration_audited(
  p_orchestration_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_before public.strategy_orchestrations%rowtype;
begin
  if v_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = v_actor and r.role = 'owner'
  ) then
    raise exception 'Owner authorization required' using errcode = '42501';
  end if;

  if p_orchestration_id is null then
    raise exception 'Strategy orchestration ID required' using errcode = '22023';
  end if;

  select * into v_before
  from public.strategy_orchestrations
  where id = p_orchestration_id
  for update;

  if not found then
    raise exception 'Strategy orchestration not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('ready', 'approved') then
    raise exception 'Strategy orchestration cannot be paused from current status'
      using errcode = '40001';
  end if;

  update public.strategy_orchestrations
  set status = 'paused', updated_at = now()
  where id = p_orchestration_id;

  insert into public.admin_audit_log (
    actor_user_id, actor_email, action_type, entity_type, entity_id,
    previous_value, new_value
  ) values (
    v_actor, null, 'RUBI_STRATEGY_ORCHESTRATION_PAUSED',
    'strategy_orchestration', p_orchestration_id,
    jsonb_build_object('status', v_before.status),
    jsonb_build_object('status', 'paused')
  );

  return jsonb_build_object(
    'success', true,
    'id', p_orchestration_id,
    'previous_status', v_before.status,
    'status', 'paused'
  );
end;
$function$;

revoke all on function public.rubi_pause_strategy_orchestration_audited(uuid)
  from public, anon;
grant execute on function public.rubi_pause_strategy_orchestration_audited(uuid)
  to authenticated;
comment on function public.rubi_pause_strategy_orchestration_audited(uuid)
  is 'Owner-only atomic pause with row locking and minimal admin audit; audit failure rolls back the status change.';
