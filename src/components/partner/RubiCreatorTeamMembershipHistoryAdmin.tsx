import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {History,ShieldCheck} from "lucide-react";
import {listRubiCreatorTeamMembershipHistoryAdmin} from "@/lib/rubi-creator-team-membership-history.functions";

type Team={id:string;name:string};
type Entry={id:number;commercial_profile_id:string;action:string;status:string;effective_at:string};
const labels:Record<string,string>={
 created:"Vínculo criado",paused:"Participação pausada",reactivated:"Participação reativada",
 migrated_baseline:"Situação encontrada na implantação"
};
/** Audit visibility restricted to Master. No contacts, payments or grants. */
export function RubiCreatorTeamMembershipHistoryAdmin({teams}:{teams:Team[]}){
 const [teamId,setTeamId]=useState("");
 const fetchHistory=useServerFn(listRubiCreatorTeamMembershipHistoryAdmin);
 const query=useQuery({queryKey:["rubi-creator-team-history",teamId],
  queryFn:()=>fetchHistory({data:{teamId}}),enabled:!!teamId,retry:false,staleTime:30000});
 return <section aria-label="Histórico de participação nos times" className="space-y-4 rounded-2xl border bg-card p-5">
  <header className="space-y-1">
   <h3 className="flex items-center gap-2 font-black"><History className="h-5 w-5 text-primary"/> Histórico de entrada e pausa</h3>
   <p className="text-xs leading-5 text-muted-foreground">Registra mudanças reais de vínculo. O estado importado da implantação não comprova atividade anterior.</p>
  </header>
  <label className="block max-w-md space-y-1 text-xs font-semibold">Time
   <select aria-label="Time do histórico" className="block w-full rounded-xl border bg-background p-2.5"
    value={teamId} onChange={e=>setTeamId(e.target.value)}>
    <option value="">Escolha um time</option>
    {teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}
   </select>
  </label>
  {query.isLoading&&<p role="status" className="text-xs text-muted-foreground">Carregando histórico de alterações...</p>}
  {query.isError&&<p role="alert" className="text-xs text-destructive">Não foi possível consultar o histórico deste time.</p>}
  {query.data&&<div className="space-y-2">
   {query.data.events.length===0&&<p className="text-xs text-muted-foreground">Nenhum evento registrado neste time.</p>}
   {(query.data.events as Entry[]).map(event=><article key={event.id} className="rounded-xl border bg-background/60 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <strong className="text-xs">{labels[event.action]??event.action}</strong>
     <time className="text-xs text-muted-foreground" dateTime={event.effective_at}>{new Date(event.effective_at).toLocaleString("pt-BR")}</time>
    </div>
    <p className="mt-1 break-all text-[11px] text-muted-foreground">Perfil comercial: {event.commercial_profile_id} · Estado: {event.status}</p>
   </article>)}
   {query.data.partial&&<p role="status" className="text-xs text-amber-600">Histórico parcial: apenas os 200 eventos mais recentes. Não reconstruir todas as etapas a partir desta amostra.</p>}
  </div>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/>
   Eventos de vínculo não geram autorização de venda, pagamento ou comissão. Antes de comparar campanhas entre equipes, conferir histórico, datas e atribuição do checkout oficial.
  </p>
 </section>;
}
