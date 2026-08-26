
-- 1. Private schema for privileged role helpers
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- avoid recursion: user_roles owner policy uses the private definer helper
DROP POLICY IF EXISTS "Owners can view all roles" ON public.user_roles;
CREATE POLICY "Owners can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'owner'));

-- public helpers become SECURITY INVOKER wrappers (not flagged, no privilege escalation)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  select private.has_role(_user_id, _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  select private.has_role(auth.uid(), 'owner')
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. Analytics events: no spoofed user attribution
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
CREATE POLICY "Anonymous events must be unattributed" ON public.analytics_events
FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

-- 3. Marketplace credentials: hide api_config from client roles
REVOKE SELECT ON public.marketplaces FROM anon, authenticated;
GRANT SELECT (id, name, slug, status, api_status, created_at) ON public.marketplaces TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplaces TO authenticated;
GRANT ALL ON public.marketplaces TO service_role;
