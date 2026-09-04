import { useQuery } from "@tanstack/react-query";
import { getReferralTiers, getUserReferralStats } from "@/lib/supabase/tiers";
import { ReferralBadge } from "./ReferralBadge";
import { ReferralProgress } from "./ReferralProgress";
import { ReferralStats } from "./ReferralStats";

export function ReferralTiers({ userId }: { userId?: string | null }) {
  const tiers = useQuery({ queryKey: ["referral-tiers"], queryFn: getReferralTiers, staleTime: 60_000 });
  const stats = useQuery({ queryKey: ["referral-stats", userId], queryFn: () => getUserReferralStats(userId!), enabled: !!userId, staleTime: 30_000 });
  const current = stats.data;
  return <section className="space-y-5">
    {current && <ReferralStats stats={current} />}
    {current?.nextTier && <ReferralProgress current={current.totalReferrals} target={current.nextTier.min_referrals} progress={current.progressToNext} currentTierName={current.currentTier?.tier_name ?? "Iniciante"} nextTierName={current.nextTier.tier_name} nextTierIcon={current.nextTier.icon} />}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiers.data?.map((tier) => { const unlocked = (current?.totalReferrals ?? 0) >= tier.min_referrals; const active = current?.currentTier?.id === tier.id; return <article key={tier.id} className={`relative rounded-[2rem] border bg-glass p-5 backdrop-blur-xl transition-transform hover:-translate-y-1 ${active ? "border-primary shadow-xl" : "border-glass-border"}`}>
        <div className="flex items-start justify-between gap-3"><ReferralBadge tierName={tier.tier_name} icon={tier.icon} color={tier.color} size="medium" /><span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{active ? "Atual" : unlocked ? "Desbloqueado" : `${tier.min_referrals} necessárias`}</span></div>
        <p className="mt-5 text-sm font-bold leading-relaxed text-muted-foreground">{tier.reward_description}</p>
      </article>; })}
    </div>
  </section>;
}
