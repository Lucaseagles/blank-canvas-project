-- Extend social_proof_config
ALTER TABLE public.social_proof_config 
ADD COLUMN IF NOT EXISTS hybrid_simulation_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS simulated_volume_boost integer DEFAULT 0;

-- Extend profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_state text;

-- Update existing config with new defaults
UPDATE public.social_proof_config 
SET hybrid_simulation_enabled = true, show_location = true 
WHERE is_enabled = true;

-- Update RLS/Grants
GRANT ALL ON public.social_proof_config TO service_role;
GRANT ALL ON public.profiles TO service_role;