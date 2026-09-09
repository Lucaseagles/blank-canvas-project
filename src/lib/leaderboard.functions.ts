import { createServerFn } from "@tanstack/react-start";

export type LeaderboardRow = {
  ranking_position: number;
  user_id: string;
  display_name: string;
  total_referrals: number;
  tier_name: string;
  tier_icon: string;
  tier_color: string;
};

export const fetchReferralLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((data: { limit?: number }) => data)
  .handler(async ({ data }): Promise<LeaderboardRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any).rpc("get_referral_leaderboard", {
      limit_count: Math.min(100, Math.max(1, data.limit ?? 50)),
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as LeaderboardRow[];
  });

export const fetchLeaderboardPosition = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<number | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: position, error } = await (supabaseAdmin as any).rpc("get_referral_leaderboard_position", {
      p_user_id: data.userId,
    });
    if (error) return null;
    return (position as number | null) ?? null;
  });
