-- 1) Remove marketplaces from realtime publication (leaks api_config to subscribers)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='marketplaces'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.marketplaces';
  END IF;
END $$;

-- 2) Add owner guard to admin functions that lacked it
CREATE OR REPLACE FUNCTION public.admin_count_users(p_search text DEFAULT NULL, p_banned boolean DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN (
    select count(*)::integer from public.profiles p join auth.users u on u.id=p.user_id
    where (p_search is null or u.email ilike '%'||p_search||'%' or p.display_name ilike '%'||p_search||'%')
      and (p_banned is null or p.is_banned=p_banned)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit integer DEFAULT 25, p_offset integer DEFAULT 0, p_search text DEFAULT NULL, p_banned boolean DEFAULT NULL)
RETURNS TABLE(user_id uuid, email text, display_name text, role text, created_at timestamptz, total_referrals integer, current_tier_id uuid, is_banned boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  select p.user_id,u.email::text,p.display_name,coalesce(ur.role::text,p.role::text,'user'),p.created_at,p.total_referrals,p.current_tier_id,p.is_banned
  from public.profiles p join auth.users u on u.id=p.user_id
  left join lateral (select role from public.user_roles r where r.user_id=p.user_id order by case when r.role='owner' then 0 else 1 end limit 1) ur on true
  where (p_search is null or u.email ilike '%'||p_search||'%' or p.display_name ilike '%'||p_search||'%')
    and (p_banned is null or p.is_banned=p_banned)
  order by p.created_at desc nulls last
  limit greatest(1,least(p_limit,100)) offset greatest(0,p_offset);
END;
$$;

-- 3) Revoke execute on SECURITY DEFINER functions not meant for public/API callers
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    IF r.proname IN ('is_owner','search_knowledge_base','get_eligible_strategic_popup') THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated, public', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    ELSIF r.proname IN ('admin_count_users','admin_list_users','admin_list_profiles','admin_set_profile_banned','get_referral_leaderboard','get_referral_leaderboard_position') THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, public', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
    END IF;
  END LOOP;
END $$;