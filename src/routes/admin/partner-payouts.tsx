import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPartnerCommissionPayoutsAdmin } from "@/lib/partner-commission-payouts-admin.functions";
import { getUnpaidPartnerCommissionsAdmin, settlePartnerCommissionsAdmin } from "@/lib/partner-payout-settlement-admin.functions";

export const Route = createFileRoute("/admin/partner-payouts")({ component: PartnerPayouts });
type Payout = { id: string; payment_reference: string; paid_amount: number; paid_at: string };
type Sale = { id: string; external_order_id: string; commission_amount: number; paid_amount: number; remaining_amount: number };
function PartnerPayouts() {
  const load = useServerFn(getPartnerCommissionPayoutsAdmin);
  const loadUnpaid = useServerFn(getUnpaidPartnerCommissionsAdmin);
  const settle = useServerFn(settlePartnerCommissionsAdmin);
  const cache = useQueryClient();
  const [partnerId, setPartnerId] = useState("");
  const [installments, setInstallments] = useState<Record<string, string>>({});
  const [reference, setReference] = useState("");
  const [verified, setVerified] = useState(false);
  const query = useQuery({ queryKey: ["admin-partner-payouts"], queryFn: () => load({ data: {} }), retry: false });
  const unpaid = useQuery({ queryKey: ["admin-unpaid-commissions", partnerId], queryFn: () => loadUnpaid({ data: { commercial_profile_id: partnerId } }), enabled: !!partnerId, retry: false });
  const sales = (unpaid.data ?? []) as Sale[];
  const mutation = useMutation({
    mutationFn: () => settle({ data: { commercial_profile_id: partnerId, allocations: sales.filter(sale => Number(installments[sale.id] ?? 0) > 0).map(sale => ({ sale_id: sale.id, amount: Number(installments[sale.id]) })), payment_reference: reference.trim(), paid_at: new Date().toISOString(), payment_verified: true } }),
    onSuccess: () => { toast.success("Pagamento registrado."); setInstallments({}); setReference(""); setVerified(false); void cache.invalidateQueries({ queryKey: ["admin-partner-payouts"] }); void cache.invalidateQueries({ queryKey: ["admin-unpaid-commissions"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const amount = sales.reduce((sum, sale) => sum + Math.min(sale.remaining_amount, Math.max(0, Number(installments[sale.id] ?? 0))), 0);
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-28">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Financeiro</p><h1 className="text-3xl font-black">Pagamentos de comissões</h1><p className="text-muted-foreground">Registro manual do Owner após conferência externa. O RUBI não consulta nem executa a transferência automaticamente.</p></header>
    {query.isLoading && <p role="status">Carregando pagamentos...</p>}
    {query.isError && <div role="alert"><p>Acesso restrito ou falha ao consultar pagamentos.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-bold">Baixar comissões pagas</h2>
      <label className="block space-y-1">ID do parceiro<input className="block w-full rounded-md border bg-background p-2" value={partnerId} onChange={event => { setPartnerId(event.target.value); setInstallments({}); }} placeholder="UUID do perfil comercial" /></label>
      {unpaid.isLoading && <p>Carregando comissões pendentes...</p>}
      {unpaid.isError && <p role="alert">Não foi possível carregar comissões pendentes.</p>}
      {sales.map(sale => <label key={sale.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_180px] sm:items-center"><span>Pedido {sale.external_order_id}<span className="block text-sm text-muted-foreground">Comissão {Number(sale.commission_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Pago {Number(sale.paid_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Restante {Number(sale.remaining_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></span><input aria-label={`Valor desta parcela do pedido ${sale.external_order_id}`} type="number" min="0" max={sale.remaining_amount} step="0.01" className="w-full rounded-md border bg-background p-2" value={installments[sale.id] ?? ""} onChange={event => setInstallments(current => ({ ...current, [sale.id]: event.target.value }))} placeholder="Valor desta parcela" /></label>)}
      <p className="font-semibold">Total selecionado: {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <label className="block space-y-1">Referência da transferência<input className="block w-full rounded-md border bg-background p-2" value={reference} onChange={event => setReference(event.target.value)} placeholder="Identificador real da transferência" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />Declaro que conferi externamente a transferência e o valor pago.</label>
      <Button disabled={!verified || !partnerId || amount <= 0 || sales.some(sale => Number(installments[sale.id] ?? 0) > sale.remaining_amount + 0.005) || reference.trim().length < 3 || mutation.isPending} onClick={() => mutation.mutate()}>Registrar pagamento realizado</Button>
    </section>}
    <h2 className="text-xl font-bold">Histórico de pagamentos</h2>
    {query.isSuccess && !(query.data?.payouts ?? []).length && <p>Nenhum pagamento registrado.</p>}
    {((query.data?.payouts ?? []) as Payout[]).map(payout => <article key={payout.id} className="rounded-xl border p-4">{payout.payment_reference} · {Number(payout.paid_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · {new Date(payout.paid_at).toLocaleDateString("pt-BR")}</article>)}
  </main>;
}
