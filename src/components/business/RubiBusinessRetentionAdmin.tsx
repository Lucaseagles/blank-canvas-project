import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getRubiBusinessRetentionAdmin } from "@/lib/rubi-business-retention.functions";

export function RubiBusinessRetentionAdmin() {
  const load = useServerFn(getRubiBusinessRetentionAdmin);
  const query = useQuery({
    queryKey: ["admin-rubi-business-retention-30d"],
    queryFn: () => load(),
    staleTime: 60_000,
    retry: false,
  });
  const metrics = query.data;
  const cards = metrics ? [
    { label: "Cotações solicitadas", value: metrics.quoteRequests },
    { label: "Lojistas que solicitaram", value: metrics.requestingMerchants },
    { label: "Cotações respondidas", value: metrics.respondedRequests },
    { label: "Lojistas com resposta", value: metrics.merchantsWithResponse },
    { label: "Aguardando resposta", value: metrics.pendingRequests },
    { label: "Solicitações de reposição", value: metrics.replenishmentRequests },
    { label: "Lojistas solicitando reposição", value: metrics.replenishingMerchants },
    { label: "Lojistas com nova cotação", value: metrics.repeatRequestMerchants },
  ] : [];

  return <section aria-label="RUBI Business · Funil de relacionamento e reposição" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI 11× · Business</p>
        <h2 className="text-2xl font-black">Atendimento e reposição de lojistas</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Indicadores de solicitações comerciais nos últimos 30 dias. Uma resposta exige
          mensagem registrada pelo Master. Reposição é uma nova cotação vinculada a outra
          anterior, não uma recompra paga.
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
        Atualizar indicadores
      </Button>
    </div>
    {query.isLoading && <p role="status">Carregando o funil de lojistas...</p>}
    {query.isError && <p role="alert" className="text-sm text-destructive">Não foi possível consultar os indicadores. Confirme a migração e as permissões.</p>}
    {metrics && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => <div key={card.label} className="rounded-xl border p-4">
        <p className="text-xs text-muted-foreground">{card.label}</p>
        <p className="mt-2 text-2xl font-black tabular-nums">{card.value.toLocaleString("pt-BR")}</p>
      </div>)}
    </div>}
    {metrics && <p className="text-xs text-muted-foreground">
      Consultado em {new Date(metrics.asOf).toLocaleString("pt-BR")}. O total de cotações
      respondidas considera solicitações criadas no período com resposta registrada, sem
      transformar atendimento em venda. Lojistas com nova cotação podem incluir pedidos
      de interesse fora de uma reposição explicitamente vinculada. Sem dados de pagamento
      da Kairos, o painel não calcula faturamento nem compradores recorrentes.
    </p>}
  </section>;
}
