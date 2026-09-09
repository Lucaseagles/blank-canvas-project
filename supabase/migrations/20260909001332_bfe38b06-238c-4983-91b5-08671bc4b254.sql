-- Guards move to the owner-gated server layer; these functions are now service_role-only.
CREATE OR REPLACE FUNCTION public.admin_count_users(p_search text DEFAULT NULL::text, p_banned boolean DEFAULT NULL::boolean)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN (
    select count(*)::integer from public.profiles p join auth.users u on u.id=p.user_id
    where (p_search is null or u.email ilike '%'||p_search||'%' or p.display_name ilike '%'||p_search||'%')
      and (p_banned is null or p.is_banned=p_banned)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit integer DEFAULT 25, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text, p_banned boolean DEFAULT NULL::boolean)
 RETURNS TABLE(user_id uuid, email text, display_name text, role text, created_at timestamp with time zone, total_referrals integer, current_tier_id uuid, is_banned boolean)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  select p.user_id,u.email::text,p.display_name,coalesce(ur.role::text,p.role::text,'user'),p.created_at,p.total_referrals,p.current_tier_id,p.is_banned
  from public.profiles p join auth.users u on u.id=p.user_id
  left join lateral (select role from public.user_roles r where r.user_id=p.user_id order by case when r.role='owner' then 0 else 1 end limit 1) ur on true
  where (p_search is null or u.email ilike '%'||p_search||'%' or p.display_name ilike '%'||p_search||'%')
    and (p_banned is null or p.is_banned=p_banned)
  order by p.created_at desc nulls last
  limit greatest(1,least(p_limit,100)) offset greatest(0,p_offset);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_profile_banned(p_user_id uuid, p_banned boolean, p_actor uuid DEFAULT NULL::uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth'
AS $function$
declare old_value boolean; actor uuid := coalesce(auth.uid(), p_actor); actor_email text;
begin
 if auth.uid() is not null and not public.has_role(auth.uid(),'owner') then raise exception 'Unauthorized'; end if;
 select is_banned into old_value from public.profiles where user_id=p_user_id;
 if old_value is null then return false; end if;
 update public.profiles set is_banned=p_banned,updated_at=now() where user_id=p_user_id;
 select email into actor_email from auth.users where id=actor;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(actor,actor_email,'USER_BAN_STATUS_CHANGED','profiles',p_user_id,jsonb_build_object('is_banned',old_value),jsonb_build_object('is_banned',p_banned));
 return true;
end; $function$;

REVOKE EXECUTE ON FUNCTION public.admin_count_users(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(integer, integer, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_profile_banned(uuid, boolean, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_count_users(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users(integer, integer, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_banned(uuid, boolean, uuid) TO service_role;