import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {ArrowRight,BarChart3,RefreshCw,Target} from "lucide-react";
import {Button} from "@/components/ui/button";
import {getRubiLaunchReadinessAdmin} from "@/lib/rubi-launch-readiness.functions";
import {getRubiCommercialPulseAdmin} from "@/lib/rubi-commercial-pulse.functions";
import {getRubiGrowthFunnelAdmin} from "@/lib/rubi-growth-funnel.functions";
import {getRubiThreeFunnelPulseAdmin} from "@/lib/rubi-three-funnel-pulse.functions";
import {buildRubiEcosystemFlywheel,simulateRubiOwnedMargin} from "@/lib/rubi-ecosystem-flywheel";

const money=(x:number)=>x.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const count=(x:number)=>x.toLocaleString("pt-BR");
const statusLabels={blocked:"Bloqueio crítico",setup:"Preparar e validar",measure:"Medir e otimizar"} as const;

/** Unified Owner decision support from independent existing systems, not a paid-sales report. */
export function RubiEcosystemFlywheelAdmin(){
 const getLaunch=useServerFn(getRubiLaunchReadinessAdmin);
 const getPulse=useServerFn(getRubiCommercialPulseAdmin);
 const getFunnel=useServerFn(getRubiGrowthFunnelAdmin);
 const getThree=useServerFn(getRubiThreeFunnelPulseAdmin);
 const launch=useQuery({queryKey:["rubi-master-growth-launch"],queryFn:()=>getLaunch(),retry:false,staleTime:60000});
 const pulse=useQuery({queryKey:["rubi-master-growth-commercial"],queryFn:()=>getPulse(),retry:false,staleTime:60000});
 const funnel=useQuery({queryKey:["rubi-master-growth-ecosystem-funnel"],queryFn:()=>getFunnel(),retry:false,staleTime:60000});
 const three=useQuery({queryKey:["rubi-three-funnel-pulse",30],queryFn:()=>getThree({data:{days:30}}),retry:false,staleTime:60000});
 const [base,setBase]=useState(20000);
 const [reach,setReach]=useState(50);
 const [visits,setVisits]=useState(20);
 const [conversion,setConversion]=useState(15);
 const [additional,setAdditional]=useState(0);
 const simulation=simulateRubiOwnedMargin({audience:base,reachPct:reach,visitPct:visits,purchasePct:conversion,
  retailPrice:148,supplierCost:48,otherCost:additional});
 const ready=launch.data&&pulse.data&&funnel.data&&three.data;
 const cards=ready?buildRubiEcosystemFlywheel({
  totalProducts:launch.data.totalProducts,readyProducts:launch.data.readyCount,
  inventoryPartial:launch.data.isPartial,suppliersWithoutHost:launch.data.suppliersWithoutHost,
  consumerProfiles:pulse.data.consumer.profiles,
  storeViews:Number(funnel.data.events.RUBI_STORE_PRODUCT_VIEW??0),
  storeCheckoutIntents:Number(funnel.data.events.RUBI_PRECHECKOUT_CONTINUE??0),
  marketplaceProductViews:funnel.data.organicChannels.reduce((sum,row)=>sum+row.productViews,0),
  partnerApproved:pulse.data.partner.approved,partnerPending:pulse.data.partner.pending,
  partnerActiveLinks:pulse.data.partner.activeLinks,partnerVisits:pulse.data.partner.visits30d,
  partnerSales:pulse.data.partner.confirmedSales30d,
  merchantApproved:pulse.data.merchant.approved,merchantQuotes:three.data.merchant.quotes,
  merchantResponses:three.data.merchant.responses,merchantReplenishments:three.data.merchant.replenishmentRequests
 }):[];
 const loading=launch.isLoading||pulse.isLoading||funnel.isLoading||three.isLoading;
 const failure=launch.isError||pulse.isError||funnel.isError||three.isError;
 return <section aria-label="RUBI motor operacional dos cinco pilares" className="space-y-5 rounded-3xl border border-primary/25 bg-card p-5 sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="max-w-3xl space-y-2">
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary"><Target className="h-4 w-4"/> Shadow Master · Flywheel de aquisição e margem</p>
    <h2 className="text-2xl font-black sm:text-3xl">Cinco estratégias conectadas, um objetivo comercial</h2>
    <p className="text-sm leading-6 text-muted-foreground">Achadinhos e conteúdo captam interesse; Eclipse desenvolve a base; Store busca margem; Partners amplia distribuição; Business desenvolve reposição. Recomendações priorizam o gargalo com evidências, sem prometer taxa de conversão.</p>
   </div>
   <Button variant="outline" size="sm" disabled={loading} onClick={()=>{void launch.refetch();void pulse.refetch();void funnel.refetch();void three.refetch();}}><RefreshCw className="mr-2 h-4 w-4"/> Atualizar</Button>
  </div>
  {loading&&<p role="status" className="text-sm">Consultando dados reais das cinco frentes...</p>}
  {failure&&<p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">Um dos relatórios está indisponível. Não será exibida recomendação como se houvesse dados confirmados.</p>}
  {ready&&<div className="grid gap-3 md:grid-cols-2">
   {cards.map((item,index)=><article key={item.pillar} className="space-y-3 rounded-2xl border bg-background/70 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <h3 className="font-black">{index+1}. {item.title}</h3>
     <span className="rounded-full border px-2 py-1 text-[11px] font-bold">{statusLabels[item.state]}</span>
    </div>
    <p className="text-xs text-muted-foreground">{item.strategyCount} estratégias mapeadas neste pilar · Indicador observado: {count(item.tracked)}</p>
    <p className="text-sm leading-6">{item.reason}</p>
    <div className="rounded-xl border border-primary/15 bg-primary/[0.05] p-3">
     <p className="text-[10px] font-black uppercase tracking-wide text-primary">Próxima ação prioritária</p>
     <p className="mt-1 text-sm font-semibold leading-6">{item.nextAction}</p>
    </div>
    <details className="rounded-xl border p-3"><summary className="cursor-pointer text-xs font-bold">Critérios para executar e escalar</summary>
     <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">{item.checklist.map(c=><li key={c}>{c}</li>)}</ul>
    </details>
    <a href={item.href} className="inline-flex items-center gap-2 text-xs font-bold text-primary underline underline-offset-4">Abrir módulo correspondente <ArrowRight className="h-4 w-4"/></a>
   </article>)}
  </div>}
  <div className="space-y-4 rounded-2xl border bg-background/70 p-4">
   <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/><h3 className="font-black">Simulação de margem da Store</h3></div>
   <p className="text-xs text-muted-foreground">Premissas para decisões, não dados do banco. Exemplo: preço R$ 148, custo informado R$ 48. Outros custos são ajustáveis. A taxa de compra se aplica aos visitantes da oferta, não automaticamente a toda a base.</p>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    {([
     {label:"Base",value:base,max:100000,step:1000,set:setBase},
     {label:"Alcance %",value:reach,max:100,step:5,set:setReach},
     {label:"Visitas %",value:visits,max:100,step:5,set:setVisits},
     {label:"Compras / visita %",value:conversion,max:30,step:1,set:setConversion},
     {label:"Custo extra / pedido R$",value:additional,max:150,step:5,set:setAdditional}
    ] as const).map(f=><label key={f.label} className="space-y-1 text-xs font-semibold">{f.label}
     <input type="number" min={0} max={f.max} step={f.step} value={f.value} onChange={e=>{
      const n=Number(e.target.value);f.set(Number.isFinite(n)?Math.min(f.max,Math.max(0,n)):0);
     }} className="w-full rounded-lg border bg-background p-2"/>
    </label>)}
   </div>
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {[
     ["Alcançados",count(simulation.reached)],
     ["Visitantes",count(simulation.visits)],
     ["Pedidos hipotéticos",count(simulation.orders)],
     ["Contribuição estimada",money(simulation.totalContribution)]
    ].map(([label,value])=><div key={label} className="rounded-lg border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-black">{value}</p></div>)}
   </div>
   <p className="text-xs text-muted-foreground">Margem unitária hipotética após custos declarados: {money(simulation.unitContribution)}. Não desconta impostos, logística, comissões ou estornos não informados; não representa lucro líquido.</p>
  </div>
  <p className="text-xs text-muted-foreground">As contagens de cada fase são independentes, sem coorte conectada ou promessa de ROAS/CPA. Nenhuma campanha, cobrança, comissão ou notificação é disparada automaticamente.</p>
 </section>;
}
