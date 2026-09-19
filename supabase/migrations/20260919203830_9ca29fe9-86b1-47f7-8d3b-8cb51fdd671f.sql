-- Convert public.is_owner() to SECURITY INVOKER, matching the safe pattern used by is_admin()/has_role()
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  select private.has_role(auth.uid(), 'owner')
$$;