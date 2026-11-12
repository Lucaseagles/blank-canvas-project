import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {getRubiMovementPerformanceAdmin} from "@/lib/rubi-movement-performance.functions";
import {summarizeMovementVariants,assessRubiVariantDecisionReadiness,type RubiMovementPerformanceRow} from "@/lib/rubi-movement-performance";

/** Performance of organic campaign labels, not checkout revenue or paid conversion. */
export function RubiMovementPerformanceAdmin({movementId}:{movementId:string}){
 const load=useServerFn(getRubiMovementPerformanceAdmin);
 const query=useQuery({
  queryKey:["rubi-movement-performance",movementId],
  queryFn:()=>load({data:{movementId}}),
  retry:false,staleTime:60_000,
 });
 const rows=(query.data?.rows??[]) as RubiMovementPerformanceRow[];
 const names=query.data?.variantNames as Record<string,string>|undefined;
 const comparison=summarizeMovementVariants(rows);
 const decisions=assessRubiVariantDecisionReadiness(comparison,query.data?.partial===true);
 const byVariantDecision=new Map(decisions.map(item=>[item.variantId,item]));
 const fmt=(value:number)=>value.toLocaleString("pt-BR");
 return <section className="space-y-4 rounded-xl border border-primary/30 p-4" aria-label="Resultados orgânicos por movimento">
   <header>
    <h4 className="font-bold text-lg">Resultados de campanhas · últimos 30 dias</h4>
    <p className="text-xs text-muted-foreground">Dados observados de visualização da página e intenção de saída ao checkout. Não representam impressões em redes sociais, CTR, retenção de vídeo, vendas confirmadas ou lucro.</p>
   </header>
   <Button variant="outline" size="sm" onClick={()=>void query.refetch()} disabled={query.isFetching}>{query.isFetching?"Atualizando...":"Atualizar resultados"}</Button>
   {query.isLoading&&<p role="status">Consultando resultados orgânicos...</p>}
   {query.isError&&<p role="alert" className="text-destructive">Não foi possível carregar os resultados. Confira as permissões e a rotina de métricas.</p>}
   {query.data&&<>
    <p className="text-xs text-muted-foreground">Dados consultados em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Relatório limitado às 200 campanhas orgânicas mais relevantes do agregado; ausência nesta tela não significa necessariamente zero tráfego.</p>
    {query.data.partial&&<p role="alert" className="rounded-lg border border-amber-500/40 p-3 text-xs text-amber-700 dark:text-amber-300">Cobertura incompleta: parte das variantes, distribuições ou campanhas agregadas atingiu o limite de consulta. Os resultados abaixo são amostras observadas; não classifique vencedores nem conclua testes A/B com esta amostra.</p>}
    {!rows.length&&<p className="text-sm text-muted-foreground">Nenhum planejamento rastreável localizado para este movimento. Cadastre primeiro variantes e canais.</p>}
    {comparison.length>0&&<section className="space-y-3 rounded-xl border bg-muted/20 p-3" aria-label="Comparativo observacional de variantes">
     <div><h5 className="font-bold">Comparativo de variantes (tráfego observado, não experimental)</h5>
      <p className="text-xs text-muted-foreground">Ordenado por visualizações observadas, não por desempenho vencedor. Campanhas sem dados e campanhas com atribuição ambígua são excluídas dos totais. Os dados agregados são limitados e não comprovam vendas, CTR nem teste A/B estatisticamente válido.</p></div>
     <div className="grid gap-2 md:grid-cols-2">
      {comparison.map(item=><article key={item.variantId} className="rounded-lg border bg-card p-3 space-y-1">
       <p className="font-semibold">{names?.[item.variantId]??"Variante"}</p>
       <p className="text-xs text-muted-foreground" role="status">{byVariantDecision.get(item.variantId)?.reason}</p>
       <p className="text-xs text-muted-foreground">{item.observedCampaigns} campanha(s) com visualizações observadas · {item.ambiguousCampaigns} ambígua(s) · {item.unobservedCampaigns} sem observação</p>
       <p className="text-sm tabular-nums">{fmt(item.viewEvents)} visualizações · {fmt(item.checkoutIntents)} intenções de checkout</p>
       <p className="text-xs text-muted-foreground">{item.intentPerViewPercent===null?"Taxa indisponível":item.intentPerViewPercent.toLocaleString("pt-BR")+"% de eventos de saída por visualização (não é conversão paga)"}</p>
      </article>)}
     </div>
    </section>}
    <div className="space-y-3">
     {rows.map(row=><article key={row.planId} className="space-y-2 rounded-xl border p-3">
      <div><p className="font-semibold">{names?.[row.variantId]??"Variante"} · {row.channel}</p>
       <p className="text-xs text-muted-foreground break-all">{row.campaign} · {row.publicationStatus==="manually_published"?"Publicação informada pelo Master":"Planejamento"}</p></div>
      <div className="grid grid-cols-3 gap-2 text-center">
       <div className="rounded-lg bg-muted/40 p-2"><p className="font-bold tabular-nums">{fmt(row.viewEvents)}</p><p className="text-xs text-muted-foreground">Visualizações</p></div>
       <div className="rounded-lg bg-muted/40 p-2"><p className="font-bold tabular-nums">{fmt(row.viewSessions)}</p><p className="text-xs text-muted-foreground">Sessões</p></div>
       <div className="rounded-lg bg-muted/40 p-2"><p className="font-bold tabular-nums">{fmt(row.checkoutIntents)}</p><p className="text-xs text-muted-foreground">Saídas ao checkout</p></div>
      </div>
      {row.ambiguousAttribution?
       <p className="text-xs text-amber-700 dark:text-amber-300">Campanha repetida em outras variantes deste movimento. Não é possível atribuir estes eventos a uma variante específica.</p>:
       <p className="text-xs text-muted-foreground">{row.intentPerViewPercent===null?"Relação de intenção por visualização indisponível (sem visualizações observadas).":`${row.intentPerViewPercent.toLocaleString("pt-BR")}% de eventos de saída por visualização de página (pode exceder 100%; não equivale a conversão paga).`}</p>
      }
     </article>)}
    </div>
   </>}
 </section>;
}
