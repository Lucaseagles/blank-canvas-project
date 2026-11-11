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
    <h2 className="mt-1 text-2xl font-black">Funil de descoberta por coleção</h2>
    <p className="mt-2 text-sm text-muted-foreground">Acompanhe cliques nos cards, visualizações de produtos e saídas ao checkout, sem atribuir compras não confirmadas.</p></div>
   <Button type="button" variant="outline" disabled={query.isFetching} onClick={()=>void query.refetch()}>{query.isFetching?"Atualizando...":"Atualizar"}</Button>
  </div>
  {query.isLoading&&<p role="status">Calculando eventos observados...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Falha ao consultar os dados. Verifique a rotina de métricas e suas permissões.</p>}
  {query.data&&<>
   {!rows.length&&<p className="text-sm text-muted-foreground">Nenhuma coleção com produtos cadastrada no período consultado.</p>}
   {groups.map(id=><div key={id} className="space-y-2 rounded-xl border p-4">
    <h3 className="font-bold">{rows.find(r=>r.sectionId===id)?.sectionTitle}</h3>
    <p className="text-xs text-muted-foreground">Sessões com sequência observada: clique → visualização → saída ao fornecedor (até 30 minutos)</p>
    <div className="space-y-2">{rows.filter(r=>r.sectionId===id).map(r=><div key={r.productId} className="grid grid-cols-1 items-center gap-2 border-t py-2 text-sm sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,auto))]">
     <span className="truncate" title={r.productTitle}>{r.productTitle}</span>
     <span className="tabular-nums">{r.clickEvents.toLocaleString("pt-BR")} cliques</span>
     <span className="tabular-nums">{r.productViews.toLocaleString("pt-BR")} visualizações</span>
     <span className="tabular-nums">{r.checkoutIntents.toLocaleString("pt-BR")} saídas ao checkout</span>
     <div className="sm:col-span-4 text-xs text-muted-foreground">Sessões: {r.qualifiedClickedSessions} cliques únicos · {r.qualifiedViewedSessions} avançaram à página · {r.qualifiedCheckoutSessions} seguiram ao checkout</div>
    </div>)}</div></div>)}
   <p className="text-xs text-muted-foreground">Atualizado em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Os três números principais são eventos, enquanto a linha de sessões acompanha uma sequência no mesmo identificador de sessão, sem identificar pessoas. Não representam vendas, receita, taxa de conversão ou retenção de vídeo. As coleções refletem a associação atual de produtos; mudanças anteriores na curadoria podem limitar a leitura histórica. Bloqueadores e consentimento podem reduzir a coleta.</p>
  </>}
 </section>;
}
