import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Megaphone,Users,ExternalLink,ShieldCheck} from "lucide-react";
import {RubiCreatorTeamGrowthAdmin,type GrowthTargetRow} from "./RubiCreatorTeamGrowthAdmin";
import {listRubiCreatorTeamsAdmin,saveRubiCreatorTeamAdmin,saveRubiCreatorProspectAdmin} from "@/lib/rubi-creator-teams.functions";
type Team={id:string;revision:number;name:string;niche:string;objective:string;stage:string};
type Prospect={id:string;revision:number;team_id:string;creator_name:string;platform:string;profile_url:string;follower_count:number;tier:string;stage:string;compensation_model:string;proposed_commission_percent:number|null;proposed_fixed_fee:number|null;notes:string};
const stageLabels:Record<string,string>={identified:"Identificado",contacted:"Contatado",negotiating:"Negociação",approved:"Acordo indicado",declined:"Descartado"};
const tiers=["nano","micro","mid","macro","mega"];
export function RubiCreatorTeamsAdmin(){
 const get=useServerFn(listRubiCreatorTeamsAdmin),saveTeam=useServerFn(saveRubiCreatorTeamAdmin),saveProspect=useServerFn(saveRubiCreatorProspectAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-creator-teams"],queryFn:()=>get(),retry:false});
 const teams=(query.data?.teams??[]) as Team[],prospects=(query.data?.prospects??[]) as Prospect[];
 const targets=(query.data?.targets??[]) as GrowthTargetRow[];
 const [selectedTeam,setSelectedTeam]=useState("");
 const [teamName,setTeamName]=useState(""),[niche,setNiche]=useState(""),[objective,setObjective]=useState("");
 const [creatorName,setCreatorName]=useState(""),[platform,setPlatform]=useState<"instagram"|"tiktok"|"youtube"|"other">("instagram"),[profileUrl,setProfileUrl]=useState("");
 const [followers,setFollowers]=useState("0"),[tier,setTier]=useState<"nano"|"micro"|"mid"|"macro"|"mega">("nano");
 const [model,setModel]=useState<"commission"|"fixed_sponsorship"|"hybrid">("commission");
 const [percent,setPercent]=useState(""),[fixed,setFixed]=useState("");
 const [notes,setNotes]=useState("");
 const refresh=()=>void qc.invalidateQueries({queryKey:["rubi-creator-teams"]});
 const teamMutation=useMutation({mutationFn:()=>saveTeam({data:{name:teamName,niche,objective,stage:"building"}}),
  onSuccess:()=>{toast.success("Time de prospecção criado.");setTeamName("");setNiche("");setObjective("");refresh();},
  onError:(e:Error)=>toast.error(e.message)});
 const prospectMutation=useMutation({mutationFn:()=>saveProspect({data:{
  team_id:selectedTeam,creator_name:creatorName,platform,profile_url:profileUrl,
  follower_count:Number(followers),tier,stage:"identified",compensation_model:model,
  proposed_commission_percent:percent.trim()===""?null:Number(percent),
  proposed_fixed_fee:fixed.trim()===""?null:Number(fixed),notes
 }}),onSuccess:()=>{toast.success("Criador adicionado à prospecção, sem vínculo comercial automático.");setCreatorName("");setProfileUrl("");setFollowers("0");setPercent("");setFixed("");setNotes("");refresh();},
 onError:(e:Error)=>toast.error(e.message)});
 const changeStage=useMutation({mutationFn:({p,stage}:{p:Prospect;stage:string})=>saveProspect({data:{
  ...p,platform:p.platform as "instagram"|"tiktok"|"youtube"|"other",
  tier:p.tier as "nano"|"micro"|"mid"|"macro"|"mega",
  stage:stage as "identified"|"contacted"|"negotiating"|"approved"|"declined",
  compensation_model:p.compensation_model as "commission"|"fixed_sponsorship"|"hybrid"
 }}),onSuccess:()=>{toast.success("Etapa registrada.");refresh();},onError:(e:Error)=>toast.error(e.message)});
 return <section className="space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7" aria-label="RUBI Partners Times de Criadores">
  <header className="space-y-2"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Users className="h-4 w-4"/> RUBI Partners · Times</p>
   <h2 className="text-2xl font-black">Rede de nano, micro e grandes influenciadores</h2>
   <p className="text-sm text-muted-foreground">Monte times por nicho, acompanhe a negociação e documente propostas de comissão ou patrocínio. Um prospect não ganha acesso ao app, produto ou comissão automaticamente.</p>
  </header>
  <div className="grid gap-5 lg:grid-cols-2">
   <form onSubmit={event=>{event.preventDefault();teamMutation.mutate();}} className="space-y-3 rounded-2xl border bg-background/60 p-4">
    <h3 className="font-bold">Criar time por nicho</h3>
    <label className="block space-y-1 text-xs font-semibold">Nome do time<input required minLength={3} maxLength={100} className="block w-full rounded-lg border bg-background p-2.5" value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Ex.: Criadores Casa e Organização"/></label>
    <label className="block space-y-1 text-xs font-semibold">Nicho<input required minLength={2} maxLength={100} className="block w-full rounded-lg border bg-background p-2.5" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Ex.: Casa"/></label>
    <label className="block space-y-1 text-xs font-semibold">Objetivo<textarea maxLength={500} rows={2} className="block w-full rounded-lg border bg-background p-2.5" value={objective} onChange={e=>setObjective(e.target.value)} placeholder="Público, campanha e problema que a oferta resolve"/></label>
    <Button type="submit" disabled={teamMutation.isPending}>Criar time de prospecção</Button>
   </form>
   <form onSubmit={event=>{event.preventDefault();prospectMutation.mutate();}} className="space-y-3 rounded-2xl border bg-background/60 p-4">
    <h3 className="font-bold">Cadastrar criador em um time</h3>
    <label className="block space-y-1 text-xs font-semibold">Time<select required value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)} className="block w-full rounded-lg border bg-background p-2.5"><option value="">Escolha um time</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    <div className="grid gap-2 sm:grid-cols-2">
     <label className="block space-y-1 text-xs font-semibold">Criador<input required value={creatorName} onChange={e=>setCreatorName(e.target.value)} minLength={2} maxLength={120} className="block w-full rounded-lg border bg-background p-2.5"/></label>
     <label className="block space-y-1 text-xs font-semibold">Plataforma<select value={platform} onChange={e=>setPlatform(e.target.value as typeof platform)} className="block w-full rounded-lg border bg-background p-2.5">{["instagram","tiktok","youtube","other"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    </div>
    <label className="block space-y-1 text-xs font-semibold">Perfil público HTTPS<input type="url" required value={profileUrl} onChange={e=>setProfileUrl(e.target.value)} maxLength={500} placeholder="https://instagram.com/..." className="block w-full rounded-lg border bg-background p-2.5"/></label>
    <div className="grid gap-2 sm:grid-cols-2">
     <label className="block space-y-1 text-xs font-semibold">Seguidores informados<input type="number" min="0" max="500000000" value={followers} onChange={e=>setFollowers(e.target.value)} className="block w-full rounded-lg border bg-background p-2.5"/></label>
     <label className="block space-y-1 text-xs font-semibold">Faixa de porte<select value={tier} onChange={e=>setTier(e.target.value as typeof tier)} className="block w-full rounded-lg border bg-background p-2.5">{tiers.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
     <label className="block space-y-1 text-xs font-semibold">Proposta<select value={model} onChange={e=>setModel(e.target.value as typeof model)} className="block w-full rounded-lg border bg-background p-2.5"><option value="commission">Comissão</option><option value="fixed_sponsorship">Patrocínio fixo</option><option value="hybrid">Híbrido</option></select></label>
     <label className="block space-y-1 text-xs font-semibold">Comissão sugerida (%)<input type="number" min="0" max="100" step="0.01" value={percent} onChange={e=>setPercent(e.target.value)} className="block w-full rounded-lg border bg-background p-2.5"/></label>
     <label className="block space-y-1 text-xs font-semibold">Patrocínio sugerido (R$)<input type="number" min="0" step="0.01" value={fixed} onChange={e=>setFixed(e.target.value)} className="block w-full rounded-lg border bg-background p-2.5"/></label>
    </div>
    <label className="block space-y-1 text-xs font-semibold">Observações comerciais<textarea rows={2} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} className="block w-full rounded-lg border bg-background p-2.5"/></label>
    <Button type="submit" disabled={!selectedTeam||prospectMutation.isPending}>Registrar para prospecção</Button>
   </form>
  </div>
  {query.isLoading&&<p role="status">Carregando times...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível carregar times. Confira a migração de banco e as permissões do Master.</p>}
  {query.data&&<div className="space-y-4">
   {teams.length===0&&<p className="text-sm text-muted-foreground">Nenhum time cadastrado. Comece por um nicho específico e valide os primeiros criadores.</p>}
   {teams.map(team=>{const members=prospects.filter(p=>p.team_id===team.id);return <article key={team.id} className="space-y-3 rounded-2xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black">{team.name}</h3><p className="text-xs text-muted-foreground">{team.niche} · {members.length} prospect(s) nesta amostra · {team.stage}</p>{team.objective&&<p className="mt-1 text-sm">{team.objective}</p>}</div><Megaphone className="h-5 w-5 text-primary"/></div>
    <RubiCreatorTeamGrowthAdmin teamId={team.id} targets={targets.find(target=>target.team_id===team.id)} prospectTiers={members.map(member=>member.tier)}/>
    <div className="grid gap-2 md:grid-cols-2">{members.map(p=><div key={p.id} className="space-y-2 rounded-xl border bg-background/60 p-3">
     <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{p.creator_name}</strong><a href={p.profile_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-primary">Ver perfil <ExternalLink className="h-3 w-3"/></a></div>
     <p className="text-xs text-muted-foreground">{p.platform} · {p.tier} · {p.follower_count.toLocaleString("pt-BR")} seguidores informados</p>
     <p className="text-xs">Proposta: {p.compensation_model} · {p.proposed_commission_percent??"—"}% comissão · {p.proposed_fixed_fee===null?"—":p.proposed_fixed_fee.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} fixo</p>
     <label className="block space-y-1 text-xs font-semibold">Etapa<select aria-label={"Etapa de "+p.creator_name} value={p.stage} disabled={changeStage.isPending} onChange={e=>changeStage.mutate({p,stage:e.target.value})} className="block w-full rounded-lg border bg-background p-2">{Object.entries(stageLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
     {p.notes&&<p className="whitespace-pre-wrap text-xs text-muted-foreground">{p.notes}</p>}
    </div>)}</div>
   </article>})}
   {query.data.partial&&<p role="status" className="text-xs text-muted-foreground">Amostra parcial (limites de 100 times e 500 prospects). Não interprete os totais como inventário exaustivo.</p>}
  </div>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/> Mesmo quando a etapa estiver marcada como acordo indicado, qualquer comissão ou patrocínio é apenas uma proposta até contrato e autorização Master. Nenhum pagamento, grant ou link é criado aqui. Propostas na área de saúde exigem revisão das regras profissionais e das alegações.</p>
 </section>;
}
