import { createFileRoute } from "@tanstack/react-router";
import { ReferralTiersAdmin } from "@/admin/referral/ReferralTiersAdmin";
import { ReferralAnalytics } from "@/admin/referral/ReferralAnalytics";
import { ReferralLeaderboard } from "@/referral/ReferralLeaderboard";

export const Route = createFileRoute("/admin/referrals")({ component: AdminReferralsPage });

function AdminReferralsPage() {
  return <main className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
    <header><p className="text-[10px] font-black uppercase tracking-[.25em] text-primary">Referral Intelligence</p><h1 className="mt-2 text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Indicações</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Operação administrativa dos níveis, analytics e ranking público. Os números exibidos vêm exclusivamente do banco.</p></header>
    <ReferralAnalytics />
    <ReferralTiersAdmin />
    <ReferralLeaderboard />
  </main>;
}
