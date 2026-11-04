import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPartnerSalesReconciliationAdmin, reconcilePartnerSaleAdmin } from "@/lib/partner-sales-reconciliation-admin.functions";

export const Route = createFileRoute("/admin/partner-sales")({ component: PartnerSalesAdmin });
type Profile = { id: string; display_name: string };
type Referral = { id: string; commercial_profile_id: string; product_id: string; active: boolean };
type Sale = { id: string; external_order_id: string; gross_amount: number; commission_amount: number };

function PartnerSalesAdmin() {
  const load = useServerFn(getPartnerSalesReconciliationAdmin);
  const save = useServerFn(reconcilePartnerSaleAdmin);
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["admin-partner-sales"], queryFn: () => load(), retry: false });
  const [linkId, setLinkId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [verified, setVerified] = useState(false);
  const profiles = (query.data?.profiles ?? []) as Profile[];
  const links = (query.data?.links ?? []) as Referral[];
  const sales = (query.data?.sales ?? []) as Sale[];
  const value = Number(amount);
  const valid = !!linkId && orderId.trim().length >= 3 && amount.trim() !== "" && Number.isFinite(value) && value > 0 && verified;
  const mutation = useMutation({
    mutationFn: () => save({ data: { referral_link_id: linkId, external_order_id: orderId.trim(), gross_amount: value, confirmed_by_admin: true } }),
    onSuccess: () => { toast.success("Venda confirmada."); setOrderId(""); setAmount(""); setVerified(false); void cache.invalidateQueries({ queryKey: ["admin-partner-sales"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-28">
    <h1 className="text-3xl font-black">Shadow Master · Conciliação de vendas</h1>
    <p className="text-muted-foreground">Registre somente pedidos pagos e conferidos no checkout do fornecedor.</p>
    {query.isLoading && <p role="status">Carregando...</p>}
    {query.isError && <div role="alert"><p>Acesso restrito ou erro de consulta.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && <section className="space-y-4 rounded-xl border p-6">
      <label className="block space-y-1">Link do parceiro<select className="block w-full rounded-md border bg-background p-2" value={linkId} onChange={event => setLinkId(event.target.value)}>
        <option value="">Selecione</option>
        {links.filter(link => link.active).map(link => <option key={link.id} value={link.id}>{profiles.find(profile => profile.id === link.commercial_profile_id)?.display_name ?? "Parceiro"} · {link.product_id}</option>)}
      </select></label>
      <label className="block space-y-1">ID do pedido confirmado<input className="block w-full rounded-md border bg-background p-2" value={orderId} onChange={event => setOrderId(event.target.value)} /></label>
      <label className="block space-y-1">Valor pago (R$)<input type="number" min="0.01" step="0.01" className="block w-full rounded-md border bg-background p-2" value={amount} onChange={event => setAmount(event.target.value)} /></label>
      <label className="flex gap-2"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />Confirmei o pagamento diretamente no checkout.</label>
      <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>Registrar venda confirmada</Button>
    </section>}
    <h2 className="text-xl font-bold">Vendas registradas</h2>
    {query.isSuccess && sales.length === 0 && <p>Nenhuma venda confirmada.</p>}
    {sales.map(sale => <article key={sale.id} className="rounded-xl border p-4">Pedido {sale.external_order_id} · {Number(sale.gross_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Comissão {Number(sale.commission_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</article>)}
  </main>;
}
