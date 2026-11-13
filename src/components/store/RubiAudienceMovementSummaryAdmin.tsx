import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {getRubiAudienceMovementSummaryAdmin} from "@/lib/rubi-audience-movement-summary.functions";

const audiences={consumer:"Consumidor",merchant:"Lojista",partner:"Parceiro"} as const;
export function RubiAudienceMovementSummaryAdmin({productId}:{productId:string}){
 const load=useServerFn(getRubiAudienceMovementSummaryAdmin);
 const query=useQuery({queryKey:["rubi-audience-movement-summary",productId],
  queryFn:()=>load({data:{productId}}),enabled:!!productId,retry:false,staleTime:60_000});
 return <section aria-label="Desempenho por público e movimento" className="space-y-3 rounded-xl border bg-muted/20 p-4">
  <h3 className="text-base font-bold">Públicos × Movimentos · últimos 30 dias</h3>
  <p className="text-xs text-muted-foreground">O público representa a categoria editorial cadastrada para o movimento, não um perfil comprovado de cada visitante. Apenas eventos orgânicos, sem pagamentos confirmados.</p>
  <Button type="button" variant="outline" size="sm" onClick={()=>void query.refetch()} disabled={query.isFetching}>Atualizar comparativo</Button>
  {query.isLoading&&<p role="status">Consultando campanhas...</p>}
  {query.isError&&<p role="alert" className="text-xs text-destructive">Falha ao consultar. Verifique as permissões e a função de agregação.</p>}
  {query.data?.partial&&<p role="alert" className="text-xs text-amber-700 dark:text-amber-300">Cobertura incompleta. Não compare taxas nem escolha vencedor com esses dados.</p>}
  {query.data?.rows.length===0&&!query.data.partial&&<p className="text-xs text-muted-foreground">Nenhum movimento cadastrado para este produto.</p>}
  {query.data?.rows.map(row=><article key={row.movementId} className="rounded-lg border bg-card p-3 space-y-1">
   <p className="text-sm font-semibold">{row.movementName} · {audiences[row.audience]}</p>
   <p className="text-xs tabular-nums">{row.viewEvents.toLocaleString("pt-BR")} visualizações · {row.checkoutIntents.toLocaleString("pt-BR")} intenções de checkout</p>
   <p className="text-xs text-muted-foreground">{row.observedCampaigns} campanhas observadas · {row.missingCampaigns} sem dados confiáveis · {row.ambiguousCampaigns} ambíguas</p>
   <p className="text-xs">{row.intentPerViewPercent===null?"Taxa indisponível":row.intentPerViewPercent.toLocaleString("pt-BR")+"% de intenção por visualização observada"}</p>
  </article>)}
 </section>;
}
