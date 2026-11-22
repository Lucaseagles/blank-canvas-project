-- Restore profile fields consumed by admin, referral, consent and leaderboard flows.
-- referral_tiers is created by the immediately preceding migration.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_referrals integer NOT NULL DEFAULT 0
    CHECK (total_referrals >= 0),
  ADD COLUMN IF NOT EXISTS current_tier_id uuid
    REFERENCES public.referral_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_source text;

CREATE INDEX IF NOT EXISTS profiles_current_tier_id_idx
  ON public.profiles(current_tier_id);
CREATE INDEX IF NOT EXISTS profiles_referral_leaderboard_idx
  ON public.profiles(total_referrals DESC, created_at ASC)
  WHERE show_on_leaderboard = true AND is_banned = false;

COMMENT ON COLUMN public.profiles.whatsapp_opt_in IS
  'Explicit user consent to receive WhatsApp communications; false by default.';
COMMENT ON COLUMN public.profiles.whatsapp_opt_in_at IS
  'Timestamp of the current affirmative WhatsApp consent.';
COMMENT ON COLUMN public.profiles.whatsapp_opt_in_source IS
  'User-facing surface where affirmative WhatsApp consent was recorded.';

CREATE OR REPLACE FUNCTION public.set_whatsapp_opt_in(
  p_enabled boolean,
  p_source text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE updated_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles AS profile
  SET whatsapp_opt_in = p_enabled,
      whatsapp_opt_in_at = CASE WHEN p_enabled THEN now() ELSE NULL END,
      whatsapp_opt_in_source = CASE
        WHEN p_enabled THEN NULLIF(left(btrim(p_source), 120), '')
        ELSE NULL
      END,
      updated_at = now()
  WHERE profile.user_id = auth.uid()
  RETURNING profile.* INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.set_whatsapp_opt_in(boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_whatsapp_opt_in(boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_referral_leaderboard_visibility(p_show boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET show_on_leaderboard = p_show,
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.set_referral_leaderboard_visibility(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_referral_leaderboard_visibility(boolean) TO authenticated;
