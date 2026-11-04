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
type Sale = { id: string; external_order_id: string; commission_amount: number };
function PartnerPayouts() {
  const load = useServerFn(getPartnerCommissionPayoutsAdmin);
  const loadUnpaid = useServerFn(getUnpaidPartnerCommissionsAdmin);
  const settle = useServerFn(settlePartnerCommissionsAdmin);
  const cache = useQueryClient();
  const [partnerId, setPartnerId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [reference, setReference] = useState("");
  const [verified, setVerified] = useState(false);
  const query = useQuery({ queryKey: ["admin-partner-payouts"], queryFn: () => load({ data: {} }), retry: false });
  const unpaid = useQuery({ queryKey: ["admin-unpaid-commissions", partnerId], queryFn: () => loadUnpaid({ data: { commercial_profile_id: partnerId } }), enabled: !!partnerId, retry: false });
  const sales = (unpaid.data ?? []) as Sale[];
  const mutation = useMutation({
    mutationFn: () => settle({ data: { commercial_profile_id: partnerId, sale_ids: selected, payment_reference: reference.trim(), paid_at: new Date().toISOString(), payment_verified: true } }),
    onSuccess: () => { toast.success("Pagamento registrado."); setSelected([]); setReference(""); setVerified(false); void cache.invalidateQueries({ queryKey: ["admin-partner-payouts"] }); void cache.invalidateQueries({ queryKey: ["admin-unpaid-commissions"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const amount = sales.filter(sale => selected.includes(sale.id)).reduce((sum, sale) => sum + Number(sale.commission_amount), 0);
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-28">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Financeiro</p><h1 className="text-3xl font-black">Pagamentos de comissões</h1><p className="text-muted-foreground">Registre somente transferências efetivamente realizadas e verificadas.</p></header>
    {query.isLoading && <p role="status">Carregando pagamentos...</p>}
    {query.isError && <div role="alert"><p>Acesso restrito ou falha ao consultar pagamentos.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-bold">Baixar comissões pagas</h2>
      <label className="block space-y-1">ID do parceiro<input className="block w-full rounded-md border bg-background p-2" value={partnerId} onChange={event => { setPartnerId(event.target.value); setSelected([]); }} placeholder="UUID do perfil comercial" /></label>
      {unpaid.isLoading && <p>Carregando comissões pendentes...</p>}
      {unpaid.isError && <p role="alert">Não foi possível carregar comissões pendentes.</p>}
      {sales.map(sale => <label key={sale.id} className="flex items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={selected.includes(sale.id)} onChange={event => setSelected(current => event.target.checked ? [...current, sale.id] : current.filter(id => id !== sale.id))} /><span>Pedido {sale.external_order_id} · {Number(sale.commission_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></label>)}
      <p className="font-semibold">Total selecionado: {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <label className="block space-y-1">Referência da transferência<input className="block w-full rounded-md border bg-background p-2" value={reference} onChange={event => setReference(event.target.value)} placeholder="Identificador real da transferência" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />Confirmei a transferência e o valor pago.</label>
      <Button disabled={!verified || !partnerId || selected.length === 0 || reference.trim().length < 3 || mutation.isPending} onClick={() => mutation.mutate()}>Registrar pagamento realizado</Button>
    </section>}
    <h2 className="text-xl font-bold">Histórico de pagamentos</h2>
    {query.isSuccess && !(query.data?.payouts ?? []).length && <p>Nenhum pagamento registrado.</p>}
    {((query.data?.payouts ?? []) as Payout[]).map(payout => <article key={payout.id} className="rounded-xl border p-4">{payout.payment_reference} · {Number(payout.paid_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · {new Date(payout.paid_at).toLocaleDateString("pt-BR")}</article>)}
  </main>;
}
