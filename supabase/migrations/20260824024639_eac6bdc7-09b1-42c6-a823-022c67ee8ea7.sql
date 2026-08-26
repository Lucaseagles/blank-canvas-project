-- Add aggregated counter columns to social_proof_config
ALTER TABLE public.social_proof_config 
ADD COLUMN IF NOT EXISTS show_aggregated_counters BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_events_for_counter INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS counter_window_hours INTEGER DEFAULT 24;

-- Update existing config with defaults if they don't exist
UPDATE public.social_proof_config 
SET 
  show_aggregated_counters = COALESCE(show_aggregated_counters, FALSE),
  min_events_for_counter = COALESCE(min_events_for_counter, 5),
  counter_window_hours = COALESCE(counter_window_hours, 24);
