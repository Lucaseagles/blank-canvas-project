import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Activity,ShieldCheck} from "lucide-react";
import {getRubiReferralTrafficQualityAdmin} from "@/lib/rubi-referral-traffic-quality.functions";

export function RubiReferralTrafficQualityAdmin(){
 const load=useServerFn(getRubiReferralTrafficQualityAdmin);
 const query=useQuery({queryKey:["rubi-referral-traffic-quality-30d"],queryFn:()=>load(),retry:false,staleTime:60000});
 const t=query.data?.totals;
 const cards=t?[
  {label:"Eventos totais",value:t.total_events},
  {label:"Com token de deduplicação",value:t.tokenized_events},
  {label:"Legados sem token",value:t.legacy_events},
  {label:"Com origem de publicação marcada",value:t.tagged_publication_events}
 ]:[];
 return <section aria-label="Qualidade técnica das visitas de indicação" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <h2 className="flex items-center gap-2 text-xl font-black"><Activity className="h-5 w-5 text-primary"/> Qualidade técnica das visitas</h2>
   <p className="text-xs leading-5 text-muted-foreground">Eventos de indicação nos últimos 30 dias. O token protege contra algumas duplicações por recarga; não comprova visitantes únicos, pessoas reais, campanhas válidas ou ausência de bots.</p>
  </header>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando contagens auditáveis...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível validar a qualidade dos eventos de indicação.</p>}
  {query.data&&<>
   <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{cards.map(card=><div key={card.label} className="space-y-1 rounded-xl border bg-background/60 p-3">
    <p className="text-xs text-muted-foreground">{card.label}</p><p className="text-2xl font-black tabular-nums">{card.value.toLocaleString("pt-BR")}</p>
   </div>)}</div>
   {query.data.rows.length===0?<p className="text-sm text-muted-foreground">Nenhuma visita registrada no período.</p>:
    <div className="overflow-x-auto"><table className="w-full text-left text-xs">
     <thead><tr className="border-b"><th className="p-2">Dia (UTC)</th><th className="p-2">Eventos</th><th className="p-2">Com token</th><th className="p-2">Legados</th><th className="p-2">Publicação marcada</th></tr></thead>
     <tbody>{query.data.rows.map(row=><tr key={row.visit_day} className="border-b">
      <td className="p-2">{row.visit_day}</td><td className="p-2 tabular-nums">{row.total_events.toLocaleString("pt-BR")}</td>
      <td className="p-2 tabular-nums">{row.tokenized_events.toLocaleString("pt-BR")}</td>
      <td className="p-2 tabular-nums">{row.legacy_events.toLocaleString("pt-BR")}</td>
      <td className="p-2 tabular-nums">{row.tagged_publication_events.toLocaleString("pt-BR")}</td>
     </tr>)}</tbody>
    </table></div>}
   <p className="text-xs text-muted-foreground">Atualizado em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Contagens agregadas, sem dados pessoais dos visitantes.</p>
  </>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Tráfego automatizado ou fraudulento não pode ser identificado apenas por estes totais. Nenhum evento representa pagamento, venda atribuída ou comissão confirmada.</p>
 </section>;
}
