-- 1. Create app_points_config for non-hardcoded values
CREATE TABLE public.app_points_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key text UNIQUE NOT NULL,
    points integer NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create user_points table
CREATE TABLE public.user_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    points integer DEFAULT 0 NOT NULL,
    streak_count integer DEFAULT 0 NOT NULL,
    last_activity_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create point_transactions table
CREATE TABLE public.point_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points integer NOT NULL,
    reason text NOT NULL,
    event_reference_id uuid,
    created_at timestamptz DEFAULT now()
);

-- 4. Create badges table
CREATE TABLE public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
    criteria jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 5. Create user_badges table
CREATE TABLE public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at timestamptz DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- 6. Create missions table
CREATE TABLE public.missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    criteria jsonb NOT NULL,
    reward_points integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 7. Create user_missions table
CREATE TABLE public.user_missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    progress jsonb DEFAULT '{}'::jsonb,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, mission_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_points_config TO authenticated;
GRANT ALL ON public.app_points_config TO service_role;

GRANT SELECT ON public.user_points TO authenticated;
GRANT ALL ON public.user_points TO service_role;

GRANT SELECT ON public.point_transactions TO authenticated;
GRANT ALL ON public.point_transactions TO service_role;

GRANT SELECT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;

GRANT SELECT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;

GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;

GRANT SELECT ON public.user_missions TO authenticated;
GRANT ALL ON public.user_missions TO service_role;

-- RLS
ALTER TABLE public.app_points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage points config" ON public.app_points_config TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.point_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active missions" ON public.missions FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can view their own missions" ON public.user_missions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 8. Seed points config
INSERT INTO public.app_points_config (action_key, points, description) VALUES
('favorite', 5, 'Points for favoriting a product'),
('video_complete', 3, 'Points for watching a video to completion'),
('referral_activation', 20, 'Points for a successful referral activation'),
('daily_streak', 10, 'Points for maintaining a daily streak');

-- 9. Functions for point management
CREATE OR REPLACE FUNCTION public.grant_points(_user_id uuid, _action_key text, _ref_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _pts integer;
BEGIN
    SELECT points INTO _pts FROM public.app_points_config WHERE action_key = _action_key;
    IF NOT FOUND THEN
        _pts := 0;
    END IF;

    IF _pts > 0 THEN
        INSERT INTO public.point_transactions (user_id, points, reason, event_reference_id)
        VALUES (_user_id, _pts, _action_key, _ref_id);

        INSERT INTO public.user_points (user_id, points, last_activity_at)
        VALUES (_user_id, _pts, now())
        ON CONFLICT (user_id) DO UPDATE
        SET points = user_points.points + EXCLUDED.points,
            updated_at = now();
    END IF;
END;
$$;
