import {useEffect,useState} from "react";
import {useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {TrendingUp,ShieldCheck} from "lucide-react";
import {saveRubiCreatorTeamGrowthTargetsAdmin} from "@/lib/rubi-creator-teams.functions";

export type GrowthTargetRow={
 team_id:string;revision:number;nano_target:number;micro_target:number;mid_target:number;
 macro_target:number;mega_target:number;expansion_evidence:string;approved_budget:number|null;
};
type Tier="nano"|"micro"|"mid"|"macro"|"mega";
const tiers:{id:Tier;label:string}[]=[
 {id:"nano",label:"Nano"},{id:"micro",label:"Micro"},{id:"mid",label:"Médio"},
 {id:"macro",label:"Macro"},{id:"mega",label:"Grande / mega"}
];
const defaults:Record<Tier,number>={nano:10,micro:5,mid:0,macro:0,mega:0};
export function RubiCreatorTeamGrowthAdmin({teamId,targets,prospectTiers}:{
 teamId:string;targets:GrowthTargetRow|undefined;prospectTiers:string[];
}){
 const save=useServerFn(saveRubiCreatorTeamGrowthTargetsAdmin);
 const qc=useQueryClient();
 const [goals,setGoals]=useState<Record<Tier,number>>(defaults);
 const [evidence,setEvidence]=useState("");
 const [budget,setBudget]=useState("");
 useEffect(()=>{
  setGoals({
   nano:targets?.nano_target??10,micro:targets?.micro_target??5,
   mid:targets?.mid_target??0,macro:targets?.macro_target??0,mega:targets?.mega_target??0
  });
  setEvidence(targets?.expansion_evidence??"");
  setBudget(targets?.approved_budget==null?"":String(targets.approved_budget));
 },[teamId,targets?.nano_target,targets?.micro_target,targets?.mid_target,targets?.macro_target,targets?.mega_target,targets?.expansion_evidence,targets?.approved_budget]);
 const mutation=useMutation({mutationFn:()=>save({data:{
  teamId,revision:targets?.revision??null,nanoTarget:goals.nano,microTarget:goals.micro,midTarget:goals.mid,
  macroTarget:goals.macro,megaTarget:goals.mega,
  expansionEvidence:evidence,approvedBudget:budget.trim()?Number(budget):null
 }}),onSuccess:(result)=>{toast.success(result.notice);void qc.invalidateQueries({queryKey:["rubi-creator-teams"]});},
 onError:(error:Error)=>toast.error(error.message)});
 return <section className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4" aria-label="Metas de expansão do time">
  <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary"/><h4 className="font-black">Plano de expansão: nano → grandes influenciadores</h4></div>
  <p className="text-xs leading-5 text-muted-foreground">Metas são objetivos de prospecção, não criadores ativos. Contagens abaixo são apenas perfis cadastrados no CRM, não vendas ou contratos.</p>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
   {tiers.map(tier=>{const found=prospectTiers.filter(t=>t===tier.id).length;return <label key={tier.id} className="space-y-2 rounded-xl border bg-background/70 p-3">
    <span className="block text-xs font-black">{tier.label}</span>
    <span className="block text-[11px] text-muted-foreground">{found} prospect(s) nesta amostra</span>
    <span className="block text-[11px] font-semibold">Meta de prospecção</span>
    <input aria-label={"Meta "+tier.label} type="number" min="0" max="100000" step="1"
     className="w-full rounded-lg border bg-background p-2 text-sm" value={goals[tier.id]}
     onChange={event=>setGoals(current=>({...current,[tier.id]:Number(event.target.value)}))}/>
   </label>})}
  </div>
  <label className="block space-y-1 text-xs font-semibold">Evidências exigidas antes de buscar criadores maiores
   <textarea className="block w-full rounded-lg border bg-background p-2.5 text-sm" maxLength={1500} rows={2}
    placeholder="Pedidos atribuídos, devoluções, margem após comissões, direitos de mídia e capacidade de entrega"
    value={evidence} onChange={event=>setEvidence(event.target.value)}/>
  </label>
  <label className="block max-w-sm space-y-1 text-xs font-semibold">Teto de patrocínios planejado (R$), opcional
   <input className="block w-full rounded-lg border bg-background p-2.5 text-sm" type="number" min="0" max="100000000" step="0.01"
    value={budget} onChange={event=>setBudget(event.target.value)}/>
  </label>
  <Button type="button" disabled={mutation.isPending||!Number.isFinite(Number(budget||0))||Object.values(goals).some(v=>!Number.isSafeInteger(v)||v<0||v>100000)}
   onClick={()=>mutation.mutate()}>Salvar metas do time</Button>
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/> Teto e metas não autorizam despesas. Expansão para macro/mega exige avaliação de resultados e aprovação separada de patrocínio ou comissão pelo Shadow Master.</p>
 </section>;
}
