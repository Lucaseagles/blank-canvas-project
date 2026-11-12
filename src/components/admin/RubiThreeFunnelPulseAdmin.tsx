import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {ArrowRight,BarChart3,ShoppingBag,Store,Users} from "lucide-react";
import {getRubiThreeFunnelPulseAdmin} from "@/lib/rubi-three-funnel-pulse.functions";

/** Independent stage counts: a later stage can exceed an earlier one in a given period. */
export function RubiThreeFunnelPulseAdmin(){
 const [days,setDays]=useState<7|30|90>(30);
 const getPulse=useServerFn(getRubiThreeFunnelPulseAdmin);
 const query=useQuery({queryKey:["rubi-three-funnel-pulse",days],
  queryFn:()=>getPulse({data:{days}}),retry:false,staleTime:60000});
 const d=query.data;
 const groups=d?[
  {name:"Consumidor · RUBI Store",icon:ShoppingBag,stages:[
   ["Visualizações de produto",d.consumer.productViews],
   ["Saídas registradas para checkout",d.consumer.checkoutIntents]],
   note:"Não comprova pagamento; uma sessão pode gerar vários eventos."},
  {name:"Lojista · RUBI Business",icon:Store,stages:[
   ["Cotações solicitadas no período",d.merchant.quotes],
   ["Respostas comerciais no período",d.merchant.responses],
   ["Solicitações de reposição no período",d.merchant.replenishmentRequests]],
   note:"Respostas podem corresponder a cotações de períodos anteriores. Cotação não é venda."},
  {name:"Parceiro · RUBI Partners",icon:Users,stages:[
   ["Visitas a links individuais",d.partner.linkVisits],
   ["Vendas confirmadas registradas",d.partner.confirmedSales]],
   note:"Visitas não são pessoas únicas. Vendas exigem confirmação confiável; comissão paga é outro estágio."}
 ]:[];

 return <section aria-label="Funis comerciais RUBI" className="space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="flex gap-3">
    <div className="rounded-2xl bg-primary/10 p-3 text-primary"><BarChart3 className="h-5 w-5"/></div>
    <div><h2 className="text-lg font-black">Etapas reais dos três funis</h2>
     <p className="text-xs text-muted-foreground">Contagens por período; etapas independentes, sem taxa de conversão presumida.</p></div>
   </div>
   <label className="flex items-center gap-2 text-xs font-semibold">Período
    <select aria-label="Período dos funis" className="rounded-xl border bg-background px-3 py-2"
     value={days} onChange={event=>setDays(Number(event.target.value) as 7|30|90)}>
     <option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option>
    </select>
   </label>
  </div>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando registros reais...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar um dos funis. Nenhum valor será estimado.</p>}
  {d&&<div className="grid gap-3 lg:grid-cols-3">
   {groups.map(group=><article key={group.name} className="rounded-2xl border bg-background/60 p-4">
    <div className="mb-4 flex items-center gap-2"><group.icon className="h-4 w-4 text-primary"/>
     <h3 className="font-black">{group.name}</h3></div>
    <div className="space-y-2">{group.stages.map(([label,value],index)=><div key={String(label)}>
     {index>0&&<ArrowRight className="my-1 h-3.5 w-3.5 rotate-90 text-muted-foreground" aria-hidden="true"/>}
     <div className="rounded-xl border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{Number(value).toLocaleString("pt-BR")}</p>
     </div></div>)}</div>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">{group.note}</p>
   </article>)}
  </div>}
  <p className="text-xs leading-5 text-muted-foreground">
   Os valores são contagens exatas de eventos ou registros dentro da janela selecionada, não uma coorte de pessoas acompanhadas do início ao fim. Os estágios não formam necessariamente um subconjunto do anterior. Dados de pagamentos externos não integrados não aparecem como venda.
  </p>
 </section>;
}
