import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getPartnerCommissionPayoutsAdmin } from "@/lib/partner-commission-payouts-admin.functions";

export const Route = createFileRoute("/admin/partner-payouts")({ component: PartnerPayouts });
type Payout = { id: string; commercial_profile_id: string; payment_reference: string; paid_amount: number; paid_at: string; note: string | null };
type Item = { payout_id: string; sale_id: string; commission_amount: number };
function PartnerPayouts() {
  const load = useServerFn(getPartnerCommissionPayoutsAdmin);
  const query = useQuery({ queryKey: ["admin-partner-payouts"], queryFn: () => load({ data: {} }), retry: false });
  const payouts = (query.data?.payouts ?? []) as Payout[];
  const items = (query.data?.items ?? []) as Item[];
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-28">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Financeiro</p><h1 className="text-3xl font-black">Pagamentos de comissões</h1><p className="text-muted-foreground">Histórico de pagamentos efetivamente registrados. Comissões calculadas ainda não pagas não aparecem aqui.</p></header>
    {query.isLoading && <p role="status">Carregando pagamentos...</p>}
    {query.isError && <div role="alert"><p>Acesso restrito ou falha ao consultar pagamentos.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && payouts.length === 0 && <p className="rounded-xl border p-5">Nenhum pagamento de comissão registrado.</p>}
    {payouts.map(payout => <article key={payout.id} className="space-y-2 rounded-xl border bg-card p-5">
      <h2 className="font-bold">Referência: {payout.payment_reference}</h2>
      <p className="text-sm text-muted-foreground">Pago em {new Date(payout.paid_at).toLocaleDateString("pt-BR")} · {Number(payout.paid_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <p className="text-sm">Vendas vinculadas: {items.filter(item => item.payout_id === payout.id).length}</p>
      {payout.note && <p className="text-sm text-muted-foreground">{payout.note}</p>}
    </article>)}
    <p className="text-xs text-muted-foreground">O registro de novos pagamentos exigirá comprovante e operação transacional segura em uma etapa separada.</p>
  </main>;
}
