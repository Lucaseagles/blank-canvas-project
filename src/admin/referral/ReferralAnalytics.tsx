import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Gift, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminReferralStats } from "@/lib/referral.functions";

export function ReferralAnalytics() {
  const getStats = useServerFn(getAdminReferralStats);
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-referral-stats"], queryFn: () => getStats({ data: {} as never }), staleTime: 30_000 });
  if (isLoading) return <div className="rounded-[2rem] border border-glass-border bg-glass p-8 text-sm font-bold text-muted-foreground">Carregando analytics reais...</div>;
  if (isError || !data) return <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-8 text-sm font-bold">Não foi possível carregar os dados de indicação.</div>;
  const cards = [{ label: "Códigos", value: data.summary.totalCodes, icon: Gift }, { label: "Eventos", value: data.summary.totalEvents, icon: Activity }, { label: "Registrados", value: data.summary.registered, icon: Users }, { label: "Ativados", value: data.summary.activated, icon: CheckCircle2 }];
  return <section className="space-y-5"><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-glass-border bg-glass p-5"><Icon className="h-4 w-4 text-primary" /><p className="mt-4 text-2xl font-black tabular-nums">{value.toLocaleString("pt-BR")}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p></div>)}</div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">As métricas acima são calculadas diretamente dos eventos persistidos; não há metas ou volumes simulados.</p></section>;
}
