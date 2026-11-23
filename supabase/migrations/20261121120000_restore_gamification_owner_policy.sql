-- Restore the original owner-only gamification policy after public.has_role is created.
-- The historical 20240824 migration predates the role helper and must remain bootstrappable.
DROP POLICY IF EXISTS "Admins can manage points config" ON public.app_points_config;
CREATE POLICY "Admins can manage points config"
  ON public.app_points_config
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role));
