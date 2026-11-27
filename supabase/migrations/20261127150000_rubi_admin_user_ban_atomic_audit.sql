-- Sprint 362: harden the legacy administrative user-ban mutation.
-- Preserve its signature and audit event while binding the actor to a real Owner,
-- serializing updates per profile and making repeated requests idempotent.
create or replace function public.admin_set_profile_banned(
  p_user_id uuid,
  p_banned boolean,
  p_actor uuid default null
) returns boolean
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_actor uuid := coalesce(auth.uid(), p_actor);
  v_actor_email text;
  v_old_value boolean;
begin
  if v_actor is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = v_actor and r.role::text = 'owner'
  ) then
    raise exception 'Owner authorization required';
  end if;

  if auth.uid() is not null and auth.uid() is distinct from v_actor then
    raise exception 'Actor identity mismatch';
  end if;

  select p.is_banned
    into v_old_value
    from public.profiles p
   where p.user_id = p_user_id
   for update;

  if not found then
    return false;
  end if;

  -- A retry for the already-persisted state is a no-op, not a duplicate audit event.
  if v_old_value is not distinct from p_banned then
    return true;
  end if;

  update public.profiles
     set is_banned = p_banned,
         updated_at = now()
   where user_id = p_user_id;

  select u.email::text into v_actor_email
    from auth.users u
   where u.id = v_actor;

  insert into public.admin_audit_log(
    actor_user_id, actor_email, action_type, entity_type, entity_id,
    previous_value, new_value
  ) values (
    v_actor, v_actor_email, 'USER_BAN_STATUS_CHANGED', 'profiles', p_user_id,
    jsonb_build_object('is_banned', v_old_value),
    jsonb_build_object('is_banned', p_banned)
  );

  return true;
end;
$function$;

revoke all on function public.admin_set_profile_banned(uuid, boolean, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_set_profile_banned(uuid, boolean, uuid)
  to service_role;
