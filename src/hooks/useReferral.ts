import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getReferralInfo } from "@/lib/referral.functions";
import { getUserReferralStats } from "@/lib/supabase/tiers";
import { useServerFn } from "@tanstack/react-start";

export function useReferral(userId?: string | null) {
  const client = useQueryClient();
  const getInfo = useServerFn(getReferralInfo);
  const referral = useQuery({ queryKey: ["referral-info", userId], queryFn: () => getInfo({ data: {} as never }), enabled: !!userId, staleTime: 30_000 });
  const stats = useQuery({ queryKey: ["referral-stats", userId], queryFn: () => getUserReferralStats(userId!), enabled: !!userId, staleTime: 30_000 });
  useEffect(() => { const timer = window.setInterval(() => { if (userId) { client.invalidateQueries({ queryKey: ["referral-info", userId] }); client.invalidateQueries({ queryKey: ["referral-stats", userId] }); } }, 30_000); return () => window.clearInterval(timer); }, [client, userId]);
  return { referral: referral.data ?? null, stats: stats.data ?? null, isLoading: referral.isLoading || stats.isLoading, refetch: () => Promise.all([referral.refetch(), stats.refetch()]) };
}
