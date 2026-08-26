-- 1. Seed badges
INSERT INTO public.badges (name, description, icon, criteria) VALUES
('Primeiro Favorito', 'Você favoritou seu primeiro produto!', 'Heart', '{"type": "event_count", "event_type": "favorite", "threshold": 1}'),
('Colecionador', 'Você favoritou 20 produtos!', 'Star', '{"type": "event_count", "event_type": "favorite", "threshold": 20}'),
('Maratonista', 'Você assistiu 50 vídeos!', 'Play', '{"type": "event_count", "event_type": "video_complete", "threshold": 50}'),
('Líder de Comunidade', 'Você indicou 5 amigos!', 'Users', '{"type": "event_count", "event_type": "referral_activation", "threshold": 5}');

-- 2. Seed missions
INSERT INTO public.missions (title, description, criteria, reward_points) VALUES
('Explorador de Vídeos', 'Assista 5 vídeos para ganhar pontos extras.', '{"type": "event_count", "event_type": "video_complete", "threshold": 5}', 15),
('Caçador de Ofertas', 'Favorite 3 produtos esta semana.', '{"type": "event_count", "event_type": "favorite", "threshold": 3}', 10),
('Expansor de Rede', 'Convide seu primeiro amigo.', '{"type": "event_count", "event_type": "referral_activation", "threshold": 1}', 50);

-- 3. Security Hardening for Gamification Functions
REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, text, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.grant_points(uuid, text, uuid) TO service_role;

-- 4. Function for handling daily streaks
CREATE OR REPLACE FUNCTION public.update_user_streak(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _last_activity timestamptz;
    _current_streak integer;
BEGIN
    SELECT last_activity_at, streak_count INTO _last_activity, _current_streak
    FROM public.user_points
    WHERE user_id = _user_id;

    IF NOT FOUND THEN
        INSERT INTO public.user_points (user_id, points, streak_count, last_activity_at)
        VALUES (_user_id, 0, 1, now());
        RETURN;
    END IF;

    -- If last activity was yesterday, increment streak
    IF _last_activity::date = (now() - interval '1 day')::date THEN
        UPDATE public.user_points
        SET streak_count = streak_count + 1,
            last_activity_at = now(),
            updated_at = now()
        WHERE user_id = _user_id;
        
        -- Grant streak bonus
        PERFORM public.grant_points(_user_id, 'daily_streak');
    -- If last activity was today, do nothing (already updated or same session)
    ELSIF _last_activity::date = now()::date THEN
        RETURN;
    -- If last activity was more than 1 day ago, reset streak
    ELSE
        UPDATE public.user_points
        SET streak_count = 1,
            last_activity_at = now(),
            updated_at = now()
        WHERE user_id = _user_id;
    END IF;
END;
$$;

-- Security Hardening for update_user_streak
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO service_role;
