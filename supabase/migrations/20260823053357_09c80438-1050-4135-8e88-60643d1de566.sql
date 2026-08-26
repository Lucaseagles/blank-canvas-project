GRANT SELECT ON public.personalization_weights TO authenticated;

CREATE POLICY "Admins can read personalization weights"
ON public.personalization_weights
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role));