import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {BarChart3,ShieldCheck} from "lucide-react";
import {getRubiCreatorTeamPerformanceAdmin} from "@/lib/rubi-creator-team-performance.functions";

/** Read-only team metrics; currently active memberships, with a 30-day historical cutoff. */
export function RubiCreatorTeamPerformanceAdmin(){
 const load=useServerFn(getRubiCreatorTeamPerformanceAdmin);
 const query=useQuery({queryKey:["rubi-creator-team-performance-30d"],queryFn:()=>load(),retry:false,staleTime:60000});
 return <section aria-label="Desempenho observado dos times RUBI" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header><h2 className="flex items-center gap-2 text-xl font-black"><BarChart3 className="h-5 w-5 text-primary"/> Atividade observada por time</h2>
   <p className="mt-2 text-xs leading-5 text-muted-foreground">Últimos 30 dias. Somente parceiros atualmente ativos e eventos posteriores ao vínculo com o time. Vendas confirmadas não significam pagamentos liquidados.</p>
  </header>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando atividade das equipes...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível confirmar os indicadores dos times.</p>}
  {query.data&&<div className="grid gap-3 lg:grid-cols-2">
   {query.data.teams.length===0&&<p className="text-sm text-muted-foreground">Nenhum time cadastrado.</p>}
   {query.data.teams.map((team:{id:string;name:string;niche:string;activeMembers:number;activeLinks:number;visitEvents:number;confirmedSales:number;excludedAmbiguousMembers:number})=>
    <article key={team.id} className="space-y-3 rounded-2xl border bg-background/60 p-4">
     <div><h3 className="font-black">{team.name}</h3><p className="text-xs text-muted-foreground">{team.niche}</p></div>
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
       {label:"Integrantes ativos",value:team.activeMembers},
       {label:"Links cadastrados",value:team.activeLinks},
       {label:"Eventos de visita",value:team.visitEvents},
       {label:"Vendas confirmadas",value:team.confirmedSales}
      ].map(metric=><div key={metric.label} className="rounded-xl border bg-card p-2.5">
       <p className="text-[10px] text-muted-foreground">{metric.label}</p>
       <p className="mt-2 text-xl font-black tabular-nums">{Number(metric.value??0).toLocaleString("pt-BR")}</p>
      </div>)}
     </div>
     {team.excludedAmbiguousMembers>0&&<p role="status" className="text-xs text-amber-600">Excluídos {team.excludedAmbiguousMembers} vínculos de perfis ativos em múltiplos times para evitar dupla atribuição.</p>}
    </article>)}
  </div>}
  {query.data?.partial&&<p role="status" className="text-xs text-amber-600">Atenção: relatório parcial por limite de consulta. Não use os totais para determinar o melhor time ou autorizar patrocínios.</p>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Indicadores observacionais: não mostram pessoas únicas, receita líquida, custo de mídia, comissão paga, ROI ou causalidade. Mudanças de integrantes podem afetar a leitura histórica. Escala exige pedidos, estornos e margens conciliados.</p>
 </section>;
}
