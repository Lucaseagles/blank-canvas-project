import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, MousePointerClick } from "lucide-react";
import { getRubiAudienceConversionPulse } from "@/lib/rubi-audience-conversion-pulse.functions";

/** Intent telemetry. These events aren't transactions or distinct people. */
export function RubiAudienceConversionPulse(){
 const fetchPulse=useServerFn(getRubiAudienceConversionPulse);
 const query=useQuery({queryKey:["rubi-audience-conversion-pulse",7],
  queryFn:()=>fetchPulse({data:{days:7}}),retry:false,staleTime:60000});
 const data=query.data;
 return <section aria-label="Interesse comercial por perfil RUBI" className="rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="mb-5 flex items-start gap-3">
   <div className="rounded-2xl bg-primary/10 p-3 text-primary"><BarChart3 className="h-5 w-5"/></div>
   <div><h2 className="text-lg font-black">Interesse comercial por login</h2>
    <p className="text-xs text-muted-foreground">Eventos observados nos últimos 7 dias; não são pessoas únicas nem vendas.</p></div>
  </header>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando eventos reais...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar a atividade dos funis.</p>}
  {data&&<>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {[
     {label:"Consumidor",value:data.guideCounts.consumer},
     {label:"Lojista",value:data.guideCounts.merchant},
     {label:"Parceiro",value:data.guideCounts.partner},
     {label:"Kits copiados",value:data.kitCopies}
    ].map(item=><div key={item.label} className="rounded-2xl border bg-background/60 p-4">
     <span className="flex items-center gap-2 text-xs text-muted-foreground"><MousePointerClick className="h-3.5 w-3.5"/>{item.label}</span>
     <p className="mt-3 text-2xl font-black tabular-nums">{item.value.toLocaleString("pt-BR")}</p>
    </div>)}
   </div>
   <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
    Os três primeiros indicadores contam aberturas de guias; o quarto conta cópias de materiais de parceiros.
    {data.partial?" Relatório parcial: a consulta atingiu o limite de 1.000 eventos.":""}
    {" "}Para calcular conversão real, ainda é necessário conciliar etapas, pedidos pagos e seus denominadores.
   </p>
  </>}
 </section>;
}
