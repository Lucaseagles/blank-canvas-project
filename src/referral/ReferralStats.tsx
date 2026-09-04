import type { UserReferralStats } from "@/lib/supabase/tiers";
import { ReferralBadge } from "./ReferralBadge";

export function ReferralStats({ stats }: { stats: UserReferralStats }) {
  return <div className="grid gap-4 sm:grid-cols-3">
    <div className="rounded-2xl border border-glass-border bg-glass p-5"><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Indicações ativadas</p><p className="mt-2 text-3xl font-black tabular-nums">{stats.totalReferrals}</p></div>
    <div className="rounded-2xl border border-glass-border bg-glass p-5 flex items-center gap-4">{stats.currentTier ? <ReferralBadge tierName={stats.currentTier.tier_name} icon={stats.currentTier.icon} color={stats.currentTier.color} size="small" /> : <span className="text-2xl">🏅</span>}<div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nível atual</p><p className="mt-1 font-black uppercase">{stats.currentTier?.tier_name ?? "Iniciante"}</p></div></div>
    <div className="rounded-2xl border border-glass-border bg-glass p-5"><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ranking</p><p className="mt-2 text-3xl font-black tabular-nums">{stats.leaderboardPosition ? `#${stats.leaderboardPosition}` : "—"}</p></div>
  </div>;
}
