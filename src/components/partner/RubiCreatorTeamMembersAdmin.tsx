import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {ShieldCheck,UserCheck,Users} from "lucide-react";
import {RubiCreatorTeamMembershipHistoryAdmin} from "./RubiCreatorTeamMembershipHistoryAdmin";
import {listRubiCreatorTeamMembersAdmin,assignRubiCreatorTeamMemberAdmin} from "@/lib/rubi-creator-team-members.functions";

type Team={id:string;name:string;niche:string};
type Partner={id:string;display_name:string;partner_type:string|null;instagram_handle:string|null};
type Membership={id:string;team_id:string;commercial_profile_id:string;status:"active"|"paused"};
/** Private Master tool: a team association is separate from product authorization and commission. */
export function RubiCreatorTeamMembersAdmin(){
 const list=useServerFn(listRubiCreatorTeamMembersAdmin);
 const assign=useServerFn(assignRubiCreatorTeamMemberAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-approved-creator-members"],queryFn:()=>list(),retry:false});
 const [teamId,setTeamId]=useState("");
 const [profileId,setProfileId]=useState("");
 const [status,setStatus]=useState<"active"|"paused">("active");
 const teams=(query.data?.teams??[]) as Team[];
 const partners=(query.data?.approvedPartners??[]) as Partner[];
 const memberships=(query.data?.members??[]) as Membership[];
 const refresh=()=>{
  void qc.invalidateQueries({queryKey:["rubi-approved-creator-members"]});
  void qc.invalidateQueries({queryKey:["rubi-creator-team-history"]});
  void qc.invalidateQueries({queryKey:["rubi-creator-team-performance-30d"]});
 };
 const mutation=useMutation({mutationFn:(input:{teamId:string;commercialProfileId:string;status:"active"|"paused";expectedStatus:"active"|"paused"|null})=>assign({data:input}),
  onSuccess:result=>{toast.success(result.notice);refresh();},
  onError:(error:Error)=>toast.error(error.message)});
 const partnerById=new Map(partners.map(p=>[p.id,p]));
 return <section aria-label="Integrantes aprovados de times RUBI" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary"><Users className="h-4 w-4"/> RUBI Partners · Times operacionais</p>
   <h2 className="text-xl font-black">Associar parceiros aprovados aos times</h2>
   <p className="text-sm text-muted-foreground">Conecte um perfil de parceiro já aprovado a um time por nicho. Prospectos ainda não aprovados não podem ser ativados aqui.</p>
  </header>
  <form onSubmit={event=>{event.preventDefault();if(teamId&&profileId)mutation.mutate({teamId,commercialProfileId:profileId,status,expectedStatus:memberships.find(m=>m.team_id===teamId&&m.commercial_profile_id===profileId)?.status??null});}}
   className="grid items-end gap-3 rounded-2xl border bg-background/60 p-4 md:grid-cols-4">
   <label className="space-y-1 text-xs font-semibold">Time
    <select required aria-label="Time de criadores" className="block w-full rounded-xl border bg-background p-2.5" value={teamId} onChange={e=>setTeamId(e.target.value)}>
     <option value="">Escolha um time</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name} · {t.niche}</option>)}
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Parceiro aprovado
    <select required aria-label="Perfil de parceiro aprovado" className="block w-full rounded-xl border bg-background p-2.5" value={profileId} onChange={e=>setProfileId(e.target.value)}>
     <option value="">Escolha um parceiro</option>{partners.map(p=><option key={p.id} value={p.id}>{p.display_name||"Parceiro"} · {p.partner_type||"sem tipo"}</option>)}
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Atividade no time
    <select aria-label="Atividade da participação" value={status} onChange={e=>setStatus(e.target.value as "active"|"paused")} className="block w-full rounded-xl border bg-background p-2.5">
     <option value="active">Ativo no time</option><option value="paused">Pausado no time</option>
    </select>
   </label>
   <Button type="submit" disabled={!teamId||!profileId||mutation.isPending}>Salvar vínculo</Button>
  </form>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando parceiros aprovados e times...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar vínculos. Confira a migração e a sessão Master.</p>}
  {query.data&&<div className="space-y-3">
   {teams.length===0&&<p className="text-xs text-muted-foreground">Cadastre um time por nicho antes de associar parceiros.</p>}
   {partners.length===0&&<p className="text-xs text-muted-foreground">Nenhum parceiro aprovado disponível para associação nesta consulta.</p>}
   {teams.map(team=>{const members=memberships.filter(member=>member.team_id===team.id);return <div key={team.id} className="rounded-xl border p-4">
    <p className="font-black">{team.name} <span className="font-normal text-xs text-muted-foreground">· {members.length} vínculo(s) na amostra</span></p>
    {members.length===0?<p className="mt-2 text-xs text-muted-foreground">Nenhum parceiro vinculado.</p>:<div className="mt-3 grid gap-2 sm:grid-cols-2">{members.map(member=><div key={member.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background/60 p-3">
     <span className="flex min-w-0 items-center gap-2"><UserCheck className="h-4 w-4 shrink-0 text-primary"/><span className="min-w-0"><strong className="block truncate text-xs">{partnerById.get(member.commercial_profile_id)?.display_name||"Perfil fora da amostra"}</strong><span className="text-[11px] text-muted-foreground">{member.status==="active"?"Vínculo ativo":"Vínculo pausado"}</span></span></span>
     <Button type="button" size="sm" variant="outline" disabled={mutation.isPending||!partnerById.has(member.commercial_profile_id)}
      onClick={()=>mutation.mutate({teamId:team.id,commercialProfileId:member.commercial_profile_id,status:member.status==="active"?"paused":"active",expectedStatus:member.status})}>{member.status==="active"?"Pausar":"Reativar"}</Button>
    </div>)}</div>}
   </div>})}
   {query.data.partial&&<p role="status" className="text-xs text-muted-foreground">Amostra parcial: 100 times, 200 parceiros e 500 vínculos por consulta. Números não representam inventário completo.</p>}
  </div>}
  <RubiCreatorTeamMembershipHistoryAdmin teams={teams} />
  <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/> Este vínculo não cria link de venda, grant de produto, comissão, contrato nem pagamento. A autorização comercial e a atribuição oficial continuam em fluxos separados.</p>
 </section>;
}
