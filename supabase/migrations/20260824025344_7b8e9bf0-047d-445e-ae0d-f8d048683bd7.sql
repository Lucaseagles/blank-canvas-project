-- Hardening the referral milestone check function
ALTER FUNCTION public.check_referral_milestones() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.check_referral_milestones() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_referral_milestones() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_referral_milestones() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_referral_milestones() TO service_role;
