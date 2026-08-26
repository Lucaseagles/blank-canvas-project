-- Referral Milestones and Automated Rewards logic
CREATE TABLE IF NOT EXISTS public.referral_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_activations INTEGER NOT NULL UNIQUE,
    reward_type TEXT NOT NULL, -- 'BADGE', 'EARLY_ACCESS', 'MULTIPLIER'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.referral_milestones TO authenticated;
GRANT ALL ON public.referral_milestones TO service_role;

ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view milestones" ON public.referral_milestones FOR SELECT TO authenticated USING (true);

-- User Rewards table to track granted milestones
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES public.referral_milestones(id) ON DELETE CASCADE,
    reward_code TEXT,
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, milestone_id)
);

GRANT SELECT ON public.user_rewards TO authenticated;
GRANT ALL ON public.user_rewards TO service_role;

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Seed basic milestones
INSERT INTO public.referral_milestones (name, target_activations, reward_type, description)
VALUES 
('Early Access Protocol', 3, 'EARLY_ACCESS', 'Access new features before everyone else'),
('Discovery Multiplier', 5, 'MULTIPLIER', 'Your clicks weigh 1.5x more for the global trending algorithm'),
('Neural Ambassador Badge', 10, 'BADGE', 'Exclusive badge visible on your profile')
ON CONFLICT (target_activations) DO NOTHING;

-- Trigger function to check milestones on activation
CREATE OR REPLACE FUNCTION public.check_referral_milestones()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_activation_count INTEGER;
    v_milestone RECORD;
BEGIN
    -- Only act on 'activated' events
    IF NEW.status = 'activated' THEN
        -- Find the referrer
        SELECT referrer_user_id INTO v_referrer_id 
        FROM public.referrals 
        WHERE id = NEW.referral_id;

        IF v_referrer_id IS NOT NULL THEN
            -- Count activated referrals
            SELECT COUNT(*) INTO v_activation_count
            FROM public.referral_events
            WHERE referral_id = NEW.referral_id AND status = 'activated';

            -- Grant milestones
            FOR v_milestone IN 
                SELECT id FROM public.referral_milestones 
                WHERE target_activations <= v_activation_count
            LOOP
                INSERT INTO public.user_rewards (user_id, milestone_id)
                VALUES (v_referrer_id, v_milestone.id)
                ON CONFLICT (user_id, milestone_id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_referral_milestones
AFTER INSERT OR UPDATE ON public.referral_events
FOR EACH ROW EXECUTE FUNCTION public.check_referral_milestones();
