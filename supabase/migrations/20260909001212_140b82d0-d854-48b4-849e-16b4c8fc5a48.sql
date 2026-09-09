-- 1. Categories: only active categories are publicly readable
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
CREATE POLICY "Active categories are viewable by everyone"
ON public.categories FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE);

CREATE POLICY "Owners can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

-- 2. Products: only published/active products are publicly readable
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
ON public.products FOR SELECT
TO anon, authenticated
USING (status IN ('active', 'published'));

-- 3. SECURITY DEFINER functions must not be callable by signed-in users
REVOKE EXECUTE ON FUNCTION public.admin_count_users(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(integer, integer, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_profiles(integer, integer, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_profile_banned(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard_position(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_count_users(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users(integer, integer, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(integer, integer, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_banned(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard_position(uuid) TO service_role;