
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Ownership changes are not allowed';
  END IF;

  -- service_role / internal processes bypass client restrictions
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'owner') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role changes are not allowed';
  END IF;
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    RAISE EXCEPTION 'Ban status changes are not allowed';
  END IF;
  IF NEW.current_tier_id IS DISTINCT FROM OLD.current_tier_id THEN
    RAISE EXCEPTION 'Referral tier changes are not allowed';
  END IF;
  IF NEW.total_referrals IS DISTINCT FROM OLD.total_referrals THEN
    RAISE EXCEPTION 'Referral count changes are not allowed';
  END IF;

  RETURN NEW;
END;
$$;

-- Column level hardening: clients may only update self-service columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, location_city, location_state, whatsapp_opt_in, whatsapp_opt_in_at, whatsapp_opt_in_source, show_on_leaderboard, updated_at)
  ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
