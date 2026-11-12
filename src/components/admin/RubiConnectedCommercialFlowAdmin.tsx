import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {ArrowRight,Network,RefreshCw,ShieldCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {getRubiConnectedCommercialFlowAdmin} from "@/lib/rubi-connected-commercial-flow.functions";
import {buildRubiConnectedFlowStages,nextRubiConnectedFlowAction} from "@/lib/rubi-connected-commercial-flow";

/** Owner-only commercial navigation. Stage counts are independent, not conversion cohorts. */
export function RubiConnectedCommercialFlowAdmin(){
 const load=useServerFn(getRubiConnectedCommercialFlowAdmin);
 const query=useQuery({queryKey:["rubi-master-connected-flow"],queryFn:()=>load(),retry:false,staleTime:30000});
 const stages=query.data?buildRubiConnectedFlowStages(query.data.counts):[];
 const next=query.data?nextRubiConnectedFlowAction(query.data.counts):null;
 return <section aria-label="RUBI integração dos módulos comerciais" className="space-y-5 rounded-3xl border border-primary/25 bg-card p-5 sm:p-7">
  <header className="flex flex-wrap items-start justify-between gap-3">
   <div className="space-y-2">
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary"><Network className="h-4 w-4"/> Shadow Master · Integração comercial</p>
    <h2 className="text-xl font-black sm:text-2xl">Do catálogo à divulgação: tudo conectado</h2>
    <p className="max-w-3xl text-xs leading-6 text-muted-foreground">Confira as etapas interdependentes do funil de criadores e abra a ferramenta certa. Cada contagem é independente; não significa que os registros formem a mesma jornada ou uma compra concluída.</p>
   </div>
   <Button type="button" variant="outline" size="sm" onClick={()=>void query.refetch()} disabled={query.isFetching}><RefreshCw className="mr-2 h-4 w-4"/> Atualizar conexões</Button>
  </header>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando as etapas no Supabase...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível confirmar a ligação dos módulos. Nenhuma etapa será considerada concluída.</p>}
  {query.data&&<>
   {next&&<div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
    <p className="text-xs font-black uppercase tracking-wide text-primary">Próxima ação sugerida</p>
    <h3 className="font-black">{next.title}</h3>
    <p className="text-sm leading-6 text-muted-foreground">{next.description}</p>
    <a href={"#"+next.anchor} className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">Ir para a ferramenta <ArrowRight className="h-4 w-4"/></a>
   </div>}
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {stages.map(stage=><a key={stage.id} href={"#"+stage.anchor} className="group space-y-2 rounded-2xl border bg-background/60 p-4 hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
     <div className="flex items-start justify-between gap-2">
      <strong className="text-xs leading-5">{stage.title}</strong>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"/>
     </div>
     <p className="text-2xl font-black tabular-nums">{stage.value.toLocaleString("pt-BR")}</p>
     <p className="text-xs leading-5 text-muted-foreground">{stage.description}</p>
    </a>)}
   </div>
   <p className="text-xs text-muted-foreground">Consulta em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Os números são contagens exatas de registros por fase, não taxas de conversão ou coortes conectadas.</p>
  </>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Não cria anúncios, autorização comercial, pagamentos, contratos ou comissões. Checkout, atribuição por criador, vendas e despesas continuam sujeitos a provas independentes.</p>
 </section>;
}
