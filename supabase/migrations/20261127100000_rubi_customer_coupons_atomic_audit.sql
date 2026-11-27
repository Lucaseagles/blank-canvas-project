-- Customer coupon Master mutations must be Owner-authorized and audited atomically.
-- Browser roles retain the existing read policies; all writes move through the server RPC.
create or replace function public.rubi_manage_customer_coupon_audited(
  p_action text,
  p_id uuid,
  p_payload jsonb,
  p_actor uuid,
  p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_before public.customer_coupons%rowtype;
  v_after public.customer_coupons%rowtype;
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
    raise exception 'Invalid customer coupon action';
  end if;

  if p_action = 'create' then
    insert into public.customer_coupons (
      marketplace_id, code, description, discount_type, discount_value,
      valid_from, valid_until, is_active, is_real, product_id, category_id, max_uses
    ) values (
      (p_payload->>'marketplace_id')::uuid,
      upper(trim(p_payload->>'code')),
      nullif(trim(p_payload->>'description'), ''),
      p_payload->>'discount_type',
      (p_payload->>'discount_value')::numeric,
      coalesce((p_payload->>'valid_from')::timestamptz, now()),
      nullif(p_payload->>'valid_until','')::timestamptz,
      coalesce((p_payload->>'is_active')::boolean, true),
      true,
      nullif(p_payload->>'product_id','')::uuid,
      nullif(p_payload->>'category_id','')::uuid,
      nullif(p_payload->>'max_uses','')::integer
    ) returning * into v_after;
    v_id := v_after.id;
    v_action_type := 'RUBI_CUSTOMER_COUPON_CREATED';
  else
    select * into v_before
    from public.customer_coupons
    where id = p_id
    for update;
    if not found then raise exception 'Customer coupon not found'; end if;
    if p_expected_updated_at is not null and v_before.updated_at <> p_expected_updated_at then
      raise exception 'Customer coupon changed; reload before retrying';
    end if;

    if p_action = 'delete' then
      delete from public.customer_coupons where id = p_id;
      v_id := p_id;
      v_action_type := 'RUBI_CUSTOMER_COUPON_DELETED';
    elsif p_action = 'toggle' then
      update public.customer_coupons
      set is_active = coalesce((p_payload->>'is_active')::boolean, not v_before.is_active)
      where id = p_id
      returning * into v_after;
      v_id := v_after.id;
      v_action_type := 'RUBI_CUSTOMER_COUPON_STATUS_CHANGED';
    else
      update public.customer_coupons set
        marketplace_id = (p_payload->>'marketplace_id')::uuid,
        code = upper(trim(p_payload->>'code')),
        description = nullif(trim(p_payload->>'description'), ''),
        discount_type = p_payload->>'discount_type',
        discount_value = (p_payload->>'discount_value')::numeric,
        valid_from = (p_payload->>'valid_from')::timestamptz,
        valid_until = nullif(p_payload->>'valid_until','')::timestamptz,
        is_active = (p_payload->>'is_active')::boolean,
        is_real = true,
        product_id = nullif(p_payload->>'product_id','')::uuid,
        category_id = nullif(p_payload->>'category_id','')::uuid,
        max_uses = nullif(p_payload->>'max_uses','')::integer
      where id = p_id
      returning * into v_after;
      v_id := v_after.id;
      v_action_type := 'RUBI_CUSTOMER_COUPON_UPDATED';
    end if;
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
  ) values (
    p_actor,
    v_action_type,
    'customer_coupon',
    v_id::text,
    case when p_action = 'create' then '{}'::jsonb
         when p_action = 'delete' then public.sanitize_admin_audit_value(to_jsonb(v_before))
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

revoke all on function public.rubi_manage_customer_coupon_audited(text,uuid,jsonb,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.rubi_manage_customer_coupon_audited(text,uuid,jsonb,uuid,timestamptz) to service_role;

-- Remove browser-role DML as defense in depth; Owner reads remain governed by the existing RLS policy.
revoke insert, update, delete on public.customer_coupons from anon, authenticated;
