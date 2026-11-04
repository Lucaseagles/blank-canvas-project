import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getPartnerFinanceSummaryAdmin } from "@/lib/partner-finance-summary-admin.functions";

export const Route = createFileRoute("/admin/partner-finance")({ component: PartnerFinance });
type Profile = { id: string; display_name: string };
const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function PartnerFinance() {
  const load = useServerFn(getPartnerFinanceSummaryAdmin);
  const [partnerId, setPartnerId] = useState("");
  const query = useQuery({ queryKey: ["admin-partner-finance-summary", partnerId], queryFn: () => load({ data: { commercial_profile_id: partnerId || undefined } }), retry: false });
  const profiles = (query.data?.profiles ?? []) as Profile[];
  const metrics = query.data;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-28">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Financeiro</p><h1 className="text-3xl font-black">Resumo financeiro de parceiros</h1><p className="text-muted-foreground">Valores baseados em vendas confirmadas e baixas de pagamento registradas.</p></header>
    <label className="block space-y-1 text-sm">Parceiro<select className="block w-full max-w-md rounded-md border bg-background p-2" value={partnerId} onChange={event => setPartnerId(event.target.value)}><option value="">Todos os parceiros</option>{profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label>
    {query.isLoading && <p role="status">Carregando resumo...</p>}
    {query.isError && <div role="alert" className="space-y-2"><p>Acesso restrito ou falha na consulta financeira.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && metrics && <section aria-label="Indicadores financeiros" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { label: "Vendas confirmadas", value: String(metrics.sales) },
        { label: "Valor das vendas", value: money(metrics.grossAmount) },
        { label: "Comissões calculadas", value: money(metrics.accruedCommission) },
        { label: "Comissões pagas", value: money(metrics.paidCommission) },
        { label: "Comissões pendentes", value: money(metrics.pendingCommission) },
      ].map(metric => <article key={metric.label} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-black">{metric.value}</p></article>)}
    </section>}
    <p className="text-xs text-muted-foreground">Visitas e cliques não são vendas. Comissões pagas exigem baixa registrada. Valores de pedidos não são lucro líquido.</p>
  </main>;
}
