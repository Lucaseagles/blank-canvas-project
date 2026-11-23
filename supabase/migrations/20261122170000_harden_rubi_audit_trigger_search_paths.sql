-- Harden existing SECURITY DEFINER audit triggers against object shadowing.
-- Their bodies use fully-qualified public table names and built-in trigger fields only.
ALTER FUNCTION public.rubi_master_campaign_plan_audit_trigger() SET search_path = '';
ALTER FUNCTION public.rubi_record_team_membership_transition() SET search_path = '';
ALTER FUNCTION public.rubi_log_creator_team_campaign_assignment() SET search_path = '';
