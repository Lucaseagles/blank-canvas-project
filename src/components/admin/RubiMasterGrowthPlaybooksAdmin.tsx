import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {ArrowRight,BrainCircuit,Clapperboard,ShieldAlert,Users,Store,CheckCircle2} from "lucide-react";
import {getRubiLaunchReadinessAdmin} from "@/lib/rubi-launch-readiness.functions";
import {getRubiCommercialPulseAdmin} from "@/lib/rubi-commercial-pulse.functions";
import {buildRubiMasterGrowthPlaybooks,type RubiMasterGrowthSnapshot} from "@/lib/rubi-master-growth-playbooks";

/** Read-only recommendations in the owner dashboard. Publishing and budgets remain separately gated. */
export function RubiMasterGrowthPlaybooksAdmin(){
 const loadLaunch=useServerFn(getRubiLaunchReadinessAdmin);
 const loadPulse=useServerFn(getRubiCommercialPulseAdmin);
 const launch=useQuery({queryKey:["rubi-master-growth-launch"],queryFn:()=>loadLaunch(),retry:false,staleTime:60000});
 const pulse=useQuery({queryKey:["rubi-master-growth-commercial"],queryFn:()=>loadPulse(),retry:false,staleTime:60000});
 const available=launch.data&&pulse.data;
 const snapshot:RubiMasterGrowthSnapshot|null=available?{
  totalProducts:launch.data.totalProducts,readyProducts:launch.data.readyCount,
  activeSuppliersWithoutHost:launch.data.suppliersWithoutHost,
  productAuditPartial:launch.data.isPartial,
  partnerApproved:pulse.data.partner.approved,
  partnerPending:pulse.data.partner.pending,
  partnerActiveLinks:pulse.data.partner.activeLinks,
  partnerVisits30d:pulse.data.partner.visits30d,
  partnerConfirmedSales30d:pulse.data.partner.confirmedSales30d,
  merchantApproved:pulse.data.merchant.approved
 }:null;
 const plans=snapshot?buildRubiMasterGrowthPlaybooks(snapshot):[];
 const icons={ai_seller:BrainCircuit,direct:Clapperboard,creators:Users,merchant:Store};
 return <section className="space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7" aria-label="Estratégia comercial do Shadow Master">
  <header className="space-y-2">
   <p className="text-xs font-black uppercase tracking-widest text-primary">Shadow Master · Central de decisões</p>
   <h2 className="text-2xl font-black sm:text-3xl">Sua máquina de aquisição e conversão</h2>
   <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Quais ações priorizar nos funis de agente vendedor com IA, resposta direta e times de influenciadores — usando dados observados, não estimativas de faturamento. A recorrência B2B acompanha os três motores.</p>
  </header>
  {(launch.isLoading||pulse.isLoading)&&<p role="status" className="text-sm text-muted-foreground">Consultando bloqueios e indicadores comerciais...</p>}
  {(launch.isError||pulse.isError)&&<p role="alert" className="rounded-xl border border-destructive/20 p-4 text-sm text-destructive">Não foi possível confirmar os dados comerciais. Recomendações automáticas estão indisponíveis; nenhuma liberação será presumida.</p>}
  {snapshot&&<div className="grid gap-3 lg:grid-cols-2">
   {plans.map(plan=>{const Icon=icons[plan.id];return <article key={plan.id} className="space-y-4 rounded-2xl border bg-background/65 p-4 sm:p-5">
    <div className="flex items-start gap-3">
     <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div>
     <div className="min-w-0"><h3 className="font-black">{plan.heading}</h3><p className="mt-1 text-xs text-muted-foreground">{plan.audience}</p></div>
    </div>
    <div className="flex items-center gap-2 text-xs font-bold">{plan.phase==="blocked"?<ShieldAlert className="h-4 w-4 text-amber-500"/>:<CheckCircle2 className="h-4 w-4 text-primary"/>}{plan.status}</div>
    <div className="rounded-xl border border-primary/15 bg-primary/[0.06] p-3">
     <p className="text-xs font-black uppercase tracking-wide text-primary">Próxima ação recomendada</p>
     <p className="mt-1 text-sm font-semibold leading-6">{plan.nextStep}</p>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">{plan.rationale}</p>
    <details className="rounded-xl border p-3">
     <summary className="cursor-pointer text-xs font-bold">Checklist antes de escalar</summary>
     <div className="mt-3 space-y-2">{plan.checkpoints.map(check=><p key={check} className="flex items-start gap-2 text-xs text-muted-foreground"><span aria-hidden="true" className="text-primary">○</span>{check}</p>)}</div>
    </details>
    <a href={plan.href} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10">{plan.hrefLabel}<ArrowRight className="h-4 w-4"/></a>
   </article>})}
  </div>}
  <p className="text-xs leading-5 text-muted-foreground">Painel consultivo. Não cria anúncios, prompts, vídeos, convites, vínculos comerciais, pagamentos ou comissões automaticamente. Ações financeiras e publicações passam pela aprovação do Master; resultados devem ser conciliados antes de escalar.</p>
 </section>;
}
