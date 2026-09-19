-- personalization_weights: remove public/anon/authenticated read exposure
DROP POLICY IF EXISTS "Allow anon read of weights" ON public.personalization_weights;
DROP POLICY IF EXISTS "Allow read of weights" ON public.personalization_weights;
REVOKE ALL ON public.personalization_weights FROM anon, authenticated;
GRANT ALL ON public.personalization_weights TO service_role;
ALTER TABLE public.personalization_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage personalization weights"
  ON public.personalization_weights FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personalization_weights TO authenticated;

-- social_proof_config: remove blanket public read (owner policy remains)
DROP POLICY IF EXISTS "Public reads safe social proof config" ON public.social_proof_config;
REVOKE ALL ON public.social_proof_config FROM anon;
GRANT ALL ON public.social_proof_config TO service_role;

-- SECURITY DEFINER routines must not be callable by signed-in users directly
REVOKE EXECUTE ON FUNCTION public.get_ab_experiment_result(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_eligible_strategic_popup(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_notification_intelligence() FROM authenticated, anon, PUBLIC;