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

-- Restore the server-side leaderboard RPCs consumed by the referral dashboard.
-- Only users who explicitly opted in are eligible; banned users are excluded.
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE (
  ranking_position integer,
  user_id uuid,
  display_name text,
  total_referrals integer,
  tier_name text,
  tier_icon text,
  tier_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ranked.ranking_position,
         ranked.user_id,
         ranked.display_name,
         ranked.total_referrals,
         ranked.tier_name,
         ranked.tier_icon,
         ranked.tier_color
  FROM (
    SELECT
      row_number() OVER (
        ORDER BY profile.total_referrals DESC, profile.created_at ASC, profile.user_id ASC
      )::integer AS ranking_position,
      profile.user_id,
      COALESCE(NULLIF(btrim(profile.display_name), ''), 'Membro RUBI') AS display_name,
      profile.total_referrals,
      COALESCE(tier.tier_name, 'Inicial') AS tier_name,
      COALESCE(tier.icon, '🏅') AS tier_icon,
      COALESCE(tier.color, '#6B7280') AS tier_color
    FROM public.profiles AS profile
    LEFT JOIN public.referral_tiers AS tier
      ON tier.id = profile.current_tier_id
    WHERE profile.show_on_leaderboard IS TRUE
      AND profile.is_banned IS FALSE
      AND profile.total_referrals > 0
  ) AS ranked
  ORDER BY ranked.ranking_position
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 50), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_referral_leaderboard_position(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ranked.ranking_position
  FROM (
    SELECT
      profile.user_id,
      row_number() OVER (
        ORDER BY profile.total_referrals DESC, profile.created_at ASC, profile.user_id ASC
      )::integer AS ranking_position
    FROM public.profiles AS profile
    WHERE profile.show_on_leaderboard IS TRUE
      AND profile.is_banned IS FALSE
      AND profile.total_referrals > 0
  ) AS ranked
  WHERE ranked.user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_referral_leaderboard(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_referral_leaderboard_position(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard_position(uuid) TO service_role;
