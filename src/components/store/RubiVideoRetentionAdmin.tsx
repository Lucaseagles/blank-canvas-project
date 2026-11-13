import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {getRubiVariantVideoRetentionAdmin} from "@/lib/rubi-video-retention.functions";

export function RubiVideoRetentionAdmin({movementId}:{movementId:string}){
 const load=useServerFn(getRubiVariantVideoRetentionAdmin);
 const query=useQuery({queryKey:["rubi-video-retention",movementId],
  queryFn:()=>load({data:{movementId}}),retry:false,staleTime:60_000});
 return <section aria-label="Conclusão de vídeo por variante" className="space-y-3 rounded-xl border bg-muted/20 p-3">
  <h5 className="font-bold">Vídeos por variante · últimos 30 dias</h5>
  <p className="text-xs text-muted-foreground">Conclusões entre usuários autenticados com evento de início no período. Não mede audiência anônima, atenção real, compra confirmada ou experimento A/B.</p>
  <Button type="button" variant="outline" size="sm" disabled={query.isFetching}
   onClick={()=>void query.refetch()}>{query.isFetching?"Atualizando...":"Atualizar vídeos"}</Button>
  {query.isLoading&&<p role="status" className="text-xs">Consultando eventos de vídeos...</p>}
  {query.isError&&<p role="alert" className="text-xs text-destructive">Falha ao consultar retenção. Confirme a migração e a permissão Master.</p>}
  {query.data?.partial&&<p role="alert" className="text-xs">Amostra truncada em 100 vídeos. Percentuais indisponíveis.</p>}
  {query.data&&query.data.rows.length===0&&<p className="text-xs text-muted-foreground">Sem vídeos vinculados a variantes revisadas.</p>}
  {query.data?.rows.map(row=><article key={row.videoId} className="space-y-1 rounded-lg border bg-card p-3">
   <p className="text-sm font-semibold">{row.videoTitle}</p>
   <p className="text-xs text-muted-foreground">Variante {row.variantId}</p>
   <p className="text-sm tabular-nums">{row.startUsers.toLocaleString("pt-BR")} usuários iniciaram · {row.completeUsers.toLocaleString("pt-BR")} também concluíram</p>
   <p className="text-xs">{row.completionPercent===null?"Taxa indisponível":row.completionPercent.toLocaleString("pt-BR")+"% de conclusão observada entre iniciadores"}</p>
  </article>)}
 </section>;
}
