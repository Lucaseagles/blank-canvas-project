import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {ClipboardCheck,ShieldCheck} from "lucide-react";
import {listRubiMasterCampaignPlansAdmin,saveRubiMasterCampaignPlanAdmin,transitionRubiMasterCampaignPlanAdmin} from "@/lib/rubi-master-campaign-plans.functions";

type Mode="ai_seller_video"|"direct_response"|"creator_team";
type Audience="consumer"|"merchant"|"partner";
type CampaignRow={id:string;product_id:string;campaign_code:string;mode:Mode;audience:Audience;daily_budget:number;run_days:number;claim_evidence:string;responsible_name:string;status:string;approval_note:string;approved_at:string|null};
const label:Record<string,string>={draft:"Rascunho",ready_for_review:"Em revisão",approved:"Aprovado internamente",paused:"Pausado"};
export function RubiMasterCampaignApprovalAdmin({productId,campaign}:{productId:string;campaign:string}){
 const list=useServerFn(listRubiMasterCampaignPlansAdmin);
 const save=useServerFn(saveRubiMasterCampaignPlanAdmin);
 const transition=useServerFn(transitionRubiMasterCampaignPlanAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-master-campaign-plans"],queryFn:()=>list(),retry:false});
 const [mode,setMode]=useState<Mode>("ai_seller_video");
 const [audience,setAudience]=useState<Audience>("consumer");
 const [budget,setBudget]=useState("10"),[days,setDays]=useState("3");
 const [evidence,setEvidence]=useState(""),[responsible,setResponsible]=useState(""),[note,setNote]=useState("");
 const plans=(query.data?.rows??[]).filter((row:CampaignRow)=>row.product_id===productId) as CampaignRow[];
 const refresh=()=>void qc.invalidateQueries({queryKey:["rubi-master-campaign-plans"]});
 const saveMutation=useMutation({mutationFn:()=>save({data:{
  productId,campaignCode:campaign,mode,audience,dailyBudget:Number(budget),runDays:Number(days),
  claimEvidence:evidence,responsibleName:responsible
 }}),onSuccess:()=>{toast.success("Plano salvo como rascunho, sem gasto de mídia.");refresh();},
 onError:(error:Error)=>toast.error(error.message)});
 const changeMutation=useMutation({mutationFn:({id,action}:{id:string;action:"submit"|"approve"|"pause"})=>
  transition({data:{id,action,note}}),onSuccess:(result)=>{toast.success(result.disclaimer);setNote("");refresh();},
 onError:(error:Error)=>toast.error(error.message)});
 return <section aria-label="Registro de campanhas do Master" className="space-y-4 rounded-2xl border border-primary/20 bg-card p-4 sm:p-5">
  <header className="space-y-1"><h5 className="flex items-center gap-2 text-base font-black"><ClipboardCheck className="h-5 w-5 text-primary"/> Plano persistente e aprovação Master</h5>
   <p className="text-xs text-muted-foreground">Guarde o orçamento previsto e a decisão de revisão de cada campanha. Aprovação interna não publica anúncios nem autoriza gasto.</p></header>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="space-y-1 text-xs font-semibold">Funil<select className="block w-full rounded-xl border bg-background p-2.5" value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="ai_seller_video">Agente vendedor com IA</option><option value="direct_response">Anúncio de resposta direta</option><option value="creator_team">Time de influenciadores</option></select></label>
   <label className="space-y-1 text-xs font-semibold">Público<select className="block w-full rounded-xl border bg-background p-2.5" value={audience} onChange={e=>setAudience(e.target.value as Audience)}><option value="consumer">Consumidor</option><option value="merchant">Lojista</option><option value="partner">Parceiro</option></select></label>
   <label className="space-y-1 text-xs font-semibold">Teto estimado por dia (R$)<input type="number" min="0.01" max="10000" step="0.01" className="block w-full rounded-xl border bg-background p-2.5" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
   <label className="space-y-1 text-xs font-semibold">Duração prevista (dias)<input type="number" min="1" max="90" step="1" className="block w-full rounded-xl border bg-background p-2.5" value={days} onChange={e=>setDays(e.target.value)}/></label>
   <label className="space-y-1 text-xs font-semibold sm:col-span-2">Responsável<input maxLength={120} className="block w-full rounded-xl border bg-background p-2.5" value={responsible} onChange={e=>setResponsible(e.target.value)} placeholder="Pessoa ou equipe responsável pela execução"/></label>
   <label className="space-y-1 text-xs font-semibold sm:col-span-2">Evidências e condições comerciais<textarea maxLength={1500} rows={3} className="block w-full rounded-xl border bg-background p-2.5" value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Origem da promessa e dados que precisam ser revisados antes da campanha"/></label>
  </div>
  <p className="text-xs text-muted-foreground">Campanha: <strong>{campaign}</strong> · teto previsto: <strong>{Number.isFinite(Number(budget)*Number(days))?(Number(budget)*Number(days)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"indisponível"}</strong>. Não é despesa realizada.</p>
  <Button type="button" disabled={!campaign||saveMutation.isPending||!Number.isFinite(Number(budget))||Number(budget)<=0||!Number.isInteger(Number(days))||Number(days)<1} onClick={()=>saveMutation.mutate()}>Salvar novo rascunho</Button>
  <div className="space-y-2">
   {query.isLoading&&<p role="status" className="text-xs text-muted-foreground">Carregando planos salvos...</p>}
   {query.isError&&<p role="alert" className="text-xs text-destructive">Não foi possível carregar os planos. Confira a migração e a sessão Master.</p>}
   {plans.map(plan=><div key={plan.id} className="space-y-3 rounded-xl border bg-background/60 p-3">
    <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{plan.campaign_code} · {plan.mode}</strong><span className="text-xs font-semibold">{label[plan.status]??plan.status}</span></div>
    <p className="text-xs text-muted-foreground">{plan.audience} · {Number(plan.daily_budget).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}/dia · {plan.run_days} dias · {plan.responsible_name||"Sem responsável informado"}</p>
    {plan.approval_note&&<p className="text-xs text-muted-foreground">Nota de revisão: {plan.approval_note}</p>}
    <label className="block space-y-1 text-xs font-semibold">Nota da decisão<textarea rows={2} maxLength={1000} className="block w-full rounded-xl border bg-background p-2" value={note} onChange={e=>setNote(e.target.value)} placeholder="Evidências, direitos de mídia, riscos e justificativa de aprovação"/></label>
    <div className="flex flex-wrap gap-2">
     {plan.status==="draft"&&<Button type="button" size="sm" variant="outline" disabled={changeMutation.isPending} onClick={()=>changeMutation.mutate({id:plan.id,action:"submit"})}>Enviar para revisão</Button>}
     {plan.status==="ready_for_review"&&<Button type="button" size="sm" disabled={changeMutation.isPending||note.trim().length<10} onClick={()=>changeMutation.mutate({id:plan.id,action:"approve"})}>Aprovar planejamento</Button>}
     {plan.status==="approved"&&<Button type="button" size="sm" variant="outline" disabled={changeMutation.isPending} onClick={()=>changeMutation.mutate({id:plan.id,action:"pause"})}>Pausar plano</Button>}
    </div>
   </div>)}
   {query.data?.partial&&<p className="text-xs text-muted-foreground">Lista parcial: os 100 planos mais recentes. A consulta não representa todos os registros.</p>}
  </div>
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/> A aprovação só confirma a revisão interna da proposta. Publicação, uso de verba, remuneração de criadores e integração com Meta/TikTok exigem autorização e execução separadas.</p>
 </section>;
}
