import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyPartnerStatement } from "@/lib/partner-statement.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner/statement")({ component: PartnerStatement });
type Sale = { id: string; external_order_id: string; product_id: string | null; gross_amount: number; commission_percent: number; commission_amount: number; confirmed_at: string; status: string; paid_amount: number; pending_amount: number; paid_at: string | null };
const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function PartnerStatement() {
  const load = useServerFn(getMyPartnerStatement);
  const [page, setPage] = useState(0);
  const size = 20;
  const query = useQuery({ queryKey: ["my-partner-statement", page], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return load({ data: { accessToken: session.access_token, offset: page * size, limit: size } });
  }, retry: false });
  const sales = (query.data?.sales ?? []) as Sale[];
  const total = query.data?.total ?? 0;
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-28">
    <header className="space-y-2"><p className="text-xs font-bold uppercase tracking-widest text-primary">RUBI · Parceiros</p><h1 className="text-3xl font-black">Meu extrato de comissões</h1><p className="text-muted-foreground">Acompanhe pedidos confirmados e comissões pendentes ou pagas.</p><Button variant="outline" asChild><Link to="/partner/portal">Voltar ao portal</Link></Button></header>
    {query.isLoading && <p role="status">Carregando extrato...</p>}
    {query.isError && <div role="alert" className="space-y-2"><p>{query.error instanceof Error ? query.error.message : "Erro ao consultar extrato."}</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && <><p className="text-sm text-muted-foreground">{total} vendas confirmadas registradas.</p>
      {sales.length === 0 && <p className="rounded-xl border p-5">Nenhuma venda confirmada encontrada.</p>}
      <section aria-label="Pedidos e comissões" className="space-y-3">
        {sales.map(sale => <article key={sale.id} className="space-y-2 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Pedido {sale.external_order_id}</h2><span className="rounded-md border px-2 py-1 text-xs">{sale.status === "paid" ? "Comissão paga" : sale.status === "partial" ? "Pagamento parcial" : "Comissão pendente"}</span></div>
          <p className="text-sm text-muted-foreground">Venda confirmada em {new Date(sale.confirmed_at).toLocaleDateString("pt-BR")}</p>
          <p className="text-sm">Venda: {money(sale.gross_amount)} · Comissão: {money(sale.commission_amount)} ({sale.commission_percent}%)</p>
          {sale.paid_amount > 0 && <p className="text-sm">Pago: {money(sale.paid_amount)} · Pendente: {money(sale.pending_amount)}</p>}
          {sale.paid_at && <p className="text-sm text-muted-foreground">Último pagamento registrado em {new Date(sale.paid_at).toLocaleDateString("pt-BR")}</p>}
        </article>)}
      </section>
      <nav aria-label="Paginação do extrato" className="flex items-center gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Anterior</Button><span className="text-sm">Página {page + 1}</span><Button variant="outline" disabled={(page + 1) * size >= total} onClick={() => setPage(value => value + 1)}>Próxima</Button></nav>
    </>}
    <p className="text-xs text-muted-foreground">Visitas não são vendas. O status pago exige quitação integral da comissão; pagamentos parciais permanecem identificados.</p>
  </main>;
}
