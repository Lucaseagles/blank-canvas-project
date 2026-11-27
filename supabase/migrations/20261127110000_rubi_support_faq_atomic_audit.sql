-- Move Owner knowledge-base mutations behind an audited transaction.
alter table public.support_faq
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.rubi_manage_support_faq_audited(
  p_action text,
  p_id uuid,
  p_payload jsonb,
  p_actor uuid,
  p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.support_faq%rowtype;
  v_after public.support_faq%rowtype;
  v_id uuid;
  v_action_type text;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_actor and ur.role = 'owner'
  ) then
    raise exception 'Owner access required';
  end if;

  if p_action not in ('create','update','toggle','delete') then
    raise exception 'Invalid support FAQ action';
  end if;

  if p_action = 'create' then
    insert into public.support_faq (question, answer, keywords, priority, is_active)
    values (
      trim(p_payload->>'question'),
      trim(p_payload->>'answer'),
      coalesce(array(select jsonb_array_elements_text(p_payload->'keywords')), '{}'::text[]),
      greatest(0, coalesce((p_payload->>'priority')::integer, 0)),
      coalesce((p_payload->>'is_active')::boolean, true)
    ) returning * into v_after;
    v_id := v_after.id;
    v_action_type := 'RUBI_SUPPORT_FAQ_CREATED';
  else
    select * into v_before from public.support_faq where id = p_id for update;
    if not found then raise exception 'Support FAQ article not found'; end if;
    if p_expected_updated_at is null then
      raise exception 'Expected support FAQ revision is required';
    end if;
    if v_before.updated_at <> p_expected_updated_at then
      raise exception 'Support FAQ article changed; reload before retrying';
    end if;

    if p_action = 'delete' then
      delete from public.support_faq where id = p_id;
      v_id := p_id;
      v_action_type := 'RUBI_SUPPORT_FAQ_DELETED';
    elsif p_action = 'toggle' then
      update public.support_faq
      set is_active = coalesce((p_payload->>'is_active')::boolean, not v_before.is_active),
          updated_at = now()
      where id = p_id returning * into v_after;
      v_id := v_after.id;
      v_action_type := 'RUBI_SUPPORT_FAQ_STATUS_CHANGED';
    else
      update public.support_faq set
        question = trim(p_payload->>'question'),
        answer = trim(p_payload->>'answer'),
        keywords = coalesce(array(select jsonb_array_elements_text(p_payload->'keywords')), '{}'::text[]),
        priority = greatest(0, coalesce((p_payload->>'priority')::integer, 0)),
        is_active = coalesce((p_payload->>'is_active')::boolean, true),
        updated_at = now()
      where id = p_id returning * into v_after;
      v_id := v_after.id;
      v_action_type := 'RUBI_SUPPORT_FAQ_UPDATED';
    end if;
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
  ) values (
    p_actor, v_action_type, 'support_faq', v_id::text,
    case when p_action = 'create' then '{}'::jsonb
         else public.sanitize_admin_audit_value(to_jsonb(v_before)) end,
    case when p_action = 'delete' then '{}'::jsonb
         else public.sanitize_admin_audit_value(to_jsonb(v_after)) end
  );

  return jsonb_build_object(
    'id', v_id,
    'row', case when p_action = 'delete' then to_jsonb(v_before) else to_jsonb(v_after) end
  );
end;
$$;

revoke all on function public.rubi_manage_support_faq_audited(text,uuid,jsonb,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.rubi_manage_support_faq_audited(text,uuid,jsonb,uuid,timestamptz) to service_role;
revoke insert, update, delete on public.support_faq from public, anon, authenticated;
