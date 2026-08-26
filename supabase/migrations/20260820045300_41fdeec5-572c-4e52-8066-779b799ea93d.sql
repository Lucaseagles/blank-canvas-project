-- 1. Secure the has_role function
-- Revoke execute from public and authenticated roles for this security definer function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Grant execute ONLY to service_role (the function owner usually has execute, and it's used in RLS policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 2. Add RLS policy for user_roles table to fix "RLS Enabled No Policy"
-- Allow owners to see all roles, users can see their own role
CREATE POLICY "Owners can view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
