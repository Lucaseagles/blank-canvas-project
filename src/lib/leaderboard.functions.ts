import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    limit: z.number().int().min(1).max(100).default(50),
  }).parse(data ?? {}))
  .handler(async ({ data }): Promise<LeaderboardRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_referral_leaderboard", {
      limit_count: data.limit,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as LeaderboardRow[];
  });

export const fetchLeaderboardPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    userId: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }): Promise<number | null> => {
    if (data.userId !== context.userId) {
      throw new Error("Você só pode consultar sua própria posição no ranking.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: position, error } = await supabaseAdmin.rpc("get_referral_leaderboard_position", {
      p_user_id: context.userId,
    });
    if (error) return null;
    return (position as number | null) ?? null;
  });
