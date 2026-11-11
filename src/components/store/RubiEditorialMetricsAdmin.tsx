import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {getRubiEditorialMetricsAdmin} from "@/lib/rubi-editorial-metrics.functions";
export function RubiEditorialMetricsAdmin(){
 const load=useServerFn(getRubiEditorialMetricsAdmin);
 const query=useQuery({queryKey:["rubi-editorial-metrics"],queryFn:()=>load(),retry:false,staleTime:60000});
 const rows=query.data?.rows??[];
 const groups=Array.from(new Set(rows.map(r=>r.sectionId)));
 return <section className="space-y-4 rounded-3xl border bg-card p-6" aria-label="Resultados de coleções da loja">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Intelligence · 30 dias</p>
    <h2 className="mt-1 text-2xl font-black">Cliques nas coleções</h2>
    <p className="mt-2 text-sm text-muted-foreground">Medição de cliques de produtos e sessões observadas nas vitrines. Não representa vendas nem visitas totais à seção.</p></div>
   <Button type="button" variant="outline" disabled={query.isFetching} onClick={()=>void query.refetch()}>{query.isFetching?"Atualizando...":"Atualizar"}</Button>
  </div>
  {query.isLoading&&<p role="status">Calculando eventos observados...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Falha ao consultar os dados. Verifique a rotina de métricas e suas permissões.</p>}
  {query.data&&<>
   {!rows.length&&<p className="text-sm text-muted-foreground">Nenhuma coleção com produtos cadastrada no período consultado.</p>}
   {groups.map(id=><div key={id} className="space-y-2 rounded-xl border p-4">
    <h3 className="font-bold">{rows.find(r=>r.sectionId===id)?.sectionTitle}</h3>
    <div className="space-y-2">{rows.filter(r=>r.sectionId===id).map(r=><div key={r.productId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm">
     <span className="truncate" title={r.productTitle}>{r.productTitle}</span>
     <span className="tabular-nums">{r.clickEvents.toLocaleString("pt-BR")} cliques</span>
     <span className="tabular-nums text-muted-foreground">{r.clickSessions.toLocaleString("pt-BR")} sessões</span>
    </div>)}</div></div>)}
   <p className="text-xs text-muted-foreground">Atualizado em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Sem dados de exposição/impressão, não é possível calcular CTR. Zero significa nenhum clique registrado na janela, e não prova ausência de visitas. O rastreamento pode ser limitado por bloqueadores ou consentimento.</p>
  </>}
 </section>;
}
