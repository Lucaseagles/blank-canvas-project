import { supabase } from "@/integrations/supabase/client";

export interface ReferralTier {
  id: string;
  tier_name: string;
  tier_key: string;
  min_referrals: number;
  reward_description: string;
  badge_id: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

export interface UserReferralStats {
  totalReferrals: number;
  currentTier: ReferralTier | null;
  nextTier: ReferralTier | null;
  progressToNext: number;
  leaderboardPosition: number | null;
  showOnLeaderboard: boolean;
}

type TierRow = ReferralTier;

export async function getReferralTiers(): Promise<ReferralTier[]> {
  const { data, error } = await supabase
    .from("referral_tiers" as never)
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TierRow[];
}

export async function getUserReferralStats(userId: string): Promise<UserReferralStats | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("total_referrals,show_on_leaderboard,current_tier_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !profile) return null;

  const p = profile as unknown as { total_referrals?: number | null; show_on_leaderboard?: boolean | null; current_tier_id?: string | null };
  const total = p.total_referrals ?? 0;
  const tiers = await getReferralTiers();
  const currentTier = tiers.find((tier) => tier.id === p.current_tier_id) ?? null;
  const nextTier = tiers.find((tier) => tier.min_referrals > total) ?? null;
  const currentMin = currentTier?.min_referrals ?? 0;
  const progressToNext = nextTier ? Math.min(100, Math.max(0, ((total - currentMin) / Math.max(1, nextTier.min_referrals - currentMin)) * 100)) : 100;

  let leaderboardPosition: number | null = null;
  if (p.show_on_leaderboard) {
    const { data: position } = await supabase.rpc("get_referral_leaderboard_position" as never, { p_user_id: userId } as never);
    leaderboardPosition = (position as number | null) ?? null;
  }

  return { totalReferrals: total, currentTier, nextTier, progressToNext, leaderboardPosition, showOnLeaderboard: p.show_on_leaderboard ?? false };
}

export async function updateLeaderboardVisibility(show: boolean): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("set_referral_leaderboard_visibility" as never, { p_show: show } as never);
  if (error) return { success: false, error: error.message };
  return { success: Boolean(data) };
}

export interface LeaderboardEntry {
  position: number;
  userId: string;
  name: string;
  totalReferrals: number;
  tierName: string;
  tierIcon: string;
  tierColor: string;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_referral_leaderboard" as never, { limit_count: Math.min(100, Math.max(1, limit)) } as never);
  if (error) throw error;
  return ((data ?? []) as unknown as Array<{ ranking_position: number; user_id: string; display_name: string; total_referrals: number; tier_name: string; tier_icon: string; tier_color: string }>).map((row) => ({
    position: Number(row.ranking_position), userId: row.user_id, name: row.display_name, totalReferrals: row.total_referrals, tierName: row.tier_name, tierIcon: row.tier_icon, tierColor: row.tier_color,
  }));
}
