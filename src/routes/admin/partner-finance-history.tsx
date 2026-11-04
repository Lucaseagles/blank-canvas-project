import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getPartnerFinanceHistoryAdmin } from "@/lib/partner-finance-history-admin.functions";

export const Route = createFileRoute("/admin/partner-finance-history")({ component: FinanceHistory });
type Profile = { id: string; display_name: string };
type Sale = { id: string; external_order_id: string; partner_name: string; product_id: string | null; source: string; gross_amount: number; commission_percent: number; commission_amount: number; confirmed_at: string };
const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function FinanceHistory() {
  const load = useServerFn(getPartnerFinanceHistoryAdmin);
  const [partnerId, setPartnerId] = useState("");
  const [page, setPage] = useState(0);
  const size = 25;
  const query = useQuery({ queryKey: ["admin-partner-finance-history", partnerId, page], queryFn: () => load({ data: { commercial_profile_id: partnerId || undefined, offset: page * size, limit: size } }), retry: false });
  const profiles = (query.data?.profiles ?? []) as Profile[];
  const sales = (query.data?.sales ?? []) as Sale[];
  const total = query.data?.total ?? 0;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-28">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Financeiro</p><h1 className="text-3xl font-black">Histórico de vendas e comissões</h1><p className="text-muted-foreground">Somente vendas confirmadas. Comissões registradas não significam pagamento realizado.</p></header>
    <label className="block space-y-2 text-sm">Filtrar parceiro<select className="block w-full max-w-md rounded-md border bg-background p-2" value={partnerId} onChange={event => { setPartnerId(event.target.value); setPage(0); }}><option value="">Todos os parceiros</option>{profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label>
    {query.isLoading && <p role="status">Carregando histórico...</p>}
    {query.isError && <div role="alert"><p>Acesso restrito ou erro ao consultar histórico.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && <><p className="text-sm text-muted-foreground">{total} vendas confirmadas no filtro atual.</p>
      {sales.length === 0 && <p className="rounded-xl border p-5">Nenhuma venda confirmada encontrada.</p>}
      <div className="space-y-3">{sales.map(sale => <article key={sale.id} className="rounded-xl border bg-card p-4 space-y-1"><p className="font-bold">{sale.partner_name} · Pedido {sale.external_order_id}</p><p className="text-sm text-muted-foreground">{new Date(sale.confirmed_at).toLocaleString("pt-BR")} · {sale.source === "admin_reconciliation" ? "Conciliação manual" : "Webhook verificado"}</p><p className="text-sm">Venda: {money(sale.gross_amount)} · Comissão: {money(sale.commission_amount)} ({sale.commission_percent}%)</p><p className="text-xs text-muted-foreground">Produto: {sale.product_id ?? "Não identificado"}</p></article>)}</div>
      <nav aria-label="Paginação do histórico" className="flex items-center gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Anterior</Button><span className="text-sm">Página {page + 1}</span><Button variant="outline" disabled={(page + 1) * size >= total} onClick={() => setPage(value => value + 1)}>Próxima</Button></nav>
    </>}
  </main>;
}
