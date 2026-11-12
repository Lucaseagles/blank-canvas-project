import {useMemo,useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Link2,ShieldCheck,Target} from "lucide-react";
import {listRubiTeamCampaignAssignmentsAdmin,createRubiTeamCampaignAssignmentAdmin,changeRubiTeamCampaignAssignmentStatusAdmin} from "@/lib/rubi-team-campaign-assignments.functions";

type Team={id:string;name:string;niche:string;stage:string};
type Plan={id:string;product_id:string;campaign_code:string;mode:string;audience:string;status:string};
type Movement={id:string;product_id:string;name:string;status:string};
type Variant={id:string;movement_id:string;name:string;status:string;media_rights_confirmed:boolean};
type Assignment={id:string;team_id:string;campaign_plan_id:string;movement_id:string;variant_id:string;status:string;editorial_notes:string};
export function RubiTeamCampaignAssignmentsAdmin(){
 const get=useServerFn(listRubiTeamCampaignAssignmentsAdmin);
 const create=useServerFn(createRubiTeamCampaignAssignmentAdmin);
 const change=useServerFn(changeRubiTeamCampaignAssignmentStatusAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-team-campaign-assignments"],queryFn:()=>get(),retry:false});
 const [teamId,setTeamId]=useState(""),[planId,setPlanId]=useState("");
 const [movementId,setMovementId]=useState(""),[variantId,setVariantId]=useState("");
 const [notes,setNotes]=useState("");
 const teams=(query.data?.teams??[]) as Team[];
 const plans=(query.data?.plans??[]) as Plan[];
 const movements=(query.data?.movements??[]) as Movement[];
 const variants=(query.data?.variants??[]) as Variant[];
 const assignments=(query.data?.assignments??[]) as Assignment[];
 const selectedPlan=plans.find(plan=>plan.id===planId);
 const matchingMovements=useMemo(()=>movements.filter(m=>m.product_id===selectedPlan?.product_id),[movements,selectedPlan?.product_id]);
 const matchingVariants=useMemo(()=>variants.filter(v=>v.movement_id===movementId),[variants,movementId]);
 const refresh=()=>void qc.invalidateQueries({queryKey:["rubi-team-campaign-assignments"]});
 const createMutation=useMutation({mutationFn:()=>create({data:{teamId,campaignPlanId:planId,movementId,variantId,notes}}),
  onSuccess:result=>{toast.success(result.notice);setNotes("");refresh();},
  onError:(error:Error)=>toast.error(error.message)});
 const changeMutation=useMutation({mutationFn:({id,status}:{id:string;status:"ready"|"paused"})=>change({data:{id,status}}),
  onSuccess:result=>{toast.success(result.notice);refresh();},
  onError:(error:Error)=>toast.error(error.message)});
 return <section aria-label="Campanhas e criativos por time" className="space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Target className="h-4 w-4"/> RUBI Partners · Distribuição planejada</p>
   <h2 className="text-xl font-black">Ligue os times às campanhas e aos criativos</h2>
   <p className="text-sm leading-6 text-muted-foreground">Organize qual time poderá trabalhar com cada plano e variante do Movement Engine. Esta associação é um planejamento privado do Master, não uma campanha publicada.</p>
  </header>
  <form onSubmit={event=>{event.preventDefault();if(teamId&&planId&&movementId&&variantId)createMutation.mutate();}} className="space-y-4 rounded-2xl border bg-background/60 p-4">
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="space-y-1 text-xs font-semibold">Time<select required value={teamId} onChange={e=>setTeamId(e.target.value)} className="block w-full rounded-xl border bg-background p-2.5"><option value="">Selecionar time</option>{teams.map(team=><option key={team.id} value={team.id}>{team.name} · {team.niche}</option>)}</select></label>
    <label className="space-y-1 text-xs font-semibold">Plano de time de influenciadores<select required value={planId} onChange={e=>{setPlanId(e.target.value);setMovementId("");setVariantId("");}} className="block w-full rounded-xl border bg-background p-2.5"><option value="">Selecionar plano</option>{plans.map(plan=><option key={plan.id} value={plan.id}>{plan.campaign_code} · {plan.status}</option>)}</select></label>
    <label className="space-y-1 text-xs font-semibold">Movimento da oferta<select required value={movementId} disabled={!planId} onChange={e=>{setMovementId(e.target.value);setVariantId("");}} className="block w-full rounded-xl border bg-background p-2.5"><option value="">Selecionar movimento</option>{matchingMovements.map(m=><option key={m.id} value={m.id}>{m.name} · {m.status}</option>)}</select></label>
    <label className="space-y-1 text-xs font-semibold">Variante criativa<select required disabled={!movementId} value={variantId} onChange={e=>setVariantId(e.target.value)} className="block w-full rounded-xl border bg-background p-2.5"><option value="">Selecionar variante</option>{matchingVariants.map(v=><option key={v.id} value={v.id}>{v.name} · {v.status}{v.media_rights_confirmed?" · direitos confirmados":""}</option>)}</select></label>
   </div>
   <label className="block space-y-1 text-xs font-semibold">Orientações para o time<textarea maxLength={1000} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Público, formatos autorizados e recomendações que deverão ser revisadas" className="block w-full rounded-xl border bg-background p-3"/></label>
   <Button type="submit" disabled={!teamId||!planId||!movementId||!variantId||createMutation.isPending}>Registrar associação planejada</Button>
  </form>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando planos e equipes...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar as associações. Verifique a migração e o acesso Master.</p>}
  {query.data&&<div className="space-y-3">
   {assignments.length===0&&<p className="text-sm text-muted-foreground">Nenhum time associado a campanhas ainda. Prepare um plano no Movement Engine e selecione um criativo existente.</p>}
   {assignments.map(a=><article key={a.id} className="space-y-3 rounded-2xl border bg-background/60 p-4">
    <div className="flex flex-wrap justify-between gap-2"><p className="flex items-center gap-2 font-black text-sm"><Link2 className="h-4 w-4 text-primary"/>{teams.find(t=>t.id===a.team_id)?.name??"Time fora da amostra"}</p><span className="text-xs font-bold">{a.status==="ready"?"Pronto para revisão de distribuição":a.status==="paused"?"Pausado":"Planejado"}</span></div>
    <p className="text-xs text-muted-foreground">Plano: {plans.find(p=>p.id===a.campaign_plan_id)?.campaign_code??"Fora da amostra"} · Movimento: {movements.find(m=>m.id===a.movement_id)?.name??"Fora da amostra"} · Criativo: {variants.find(v=>v.id===a.variant_id)?.name??"Fora da amostra"}</p>
    {a.editorial_notes&&<p className="text-xs leading-5">{a.editorial_notes}</p>}
    <div className="flex flex-wrap gap-2">
     {a.status!=="ready"&&<Button type="button" size="sm" variant="outline" disabled={changeMutation.isPending} onClick={()=>changeMutation.mutate({id:a.id,status:"ready"})}>Verificar e marcar pronto</Button>}
     {a.status!=="paused"&&<Button type="button" size="sm" variant="outline" disabled={changeMutation.isPending} onClick={()=>changeMutation.mutate({id:a.id,status:"paused"})}>Pausar associação</Button>}
    </div>
   </article>)}
   {query.data.partial&&<p role="status" className="text-xs text-amber-600">Relatório parcial por limites de consulta. Verifique a lista completa antes de qualquer decisão de distribuição.</p>}
  </div>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Apenas planejamento e revisão. Um time marcado como pronto não publica anúncios, não concede produtos ou links e não gera venda ou comissão. O checkout e a atribuição individual continuam exigindo validação independente.</p>
 </section>;
}
