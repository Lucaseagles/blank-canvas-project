import {useState} from "react";
import {useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {reviewRubiCreatorFitAdmin} from "@/lib/rubi-creator-fit.functions";

export type FitReview={
 prospect_id:string;revision:number;niche_fit:number;audience_overlap:number;engagement_quality:number;
 content_quality:number;compliance_readiness:number;evidence_notes:string;fit_score:number;recommendation:string;
 reviewed_at:string;
};
const fields=[
 {key:"nicheFit",title:"Nicho e produto",hint:"O conteúdo conversa com a necessidade resolvida pelo produto?"},
 {key:"audienceOverlap",title:"Público real",hint:"País, faixa etária e interesses compatíveis, com evidência?"},
 {key:"engagementQuality",title:"Engajamento autêntico",hint:"Interações relevantes e denominador verificáveis, sem seguidores artificiais?"},
 {key:"contentQuality",title:"Execução criativa",hint:"Demonstrações confiáveis, consistência e capacidade de produzir?"},
 {key:"complianceReadiness",title:"Reputação e direitos",hint:"Sem alertas pendentes; sinalização de publicidade, direitos e regras do nicho revisadas?"}
] as const;
type Key=(typeof fields)[number]["key"];
type ScoreValues=Record<Key,number>;
const labels:Record<string,string>={
 review_required:"Revisão obrigatória",low_fit:"Baixa aderência",
 needs_validation:"Validar em piloto",pilot_candidate:"Candidato a piloto"
};
export function RubiCreatorFitReviewAdmin({prospectId,review}:{prospectId:string;review?:FitReview}){
 const save=useServerFn(reviewRubiCreatorFitAdmin);
 const qc=useQueryClient();
 const [ratings,setRatings]=useState<ScoreValues>({
  nicheFit:review?.niche_fit??0,audienceOverlap:review?.audience_overlap??0,
  engagementQuality:review?.engagement_quality??0,contentQuality:review?.content_quality??0,
  complianceReadiness:review?.compliance_readiness??0
 });
 const [evidence,setEvidence]=useState(review?.evidence_notes??"");
 const score=ratings.nicheFit*10+ratings.audienceOverlap*10+
  ratings.engagementQuality*10+ratings.contentQuality*5+ratings.complianceReadiness*15;
 const gate=ratings.complianceReadiness!==2||ratings.nicheFit===0||ratings.audienceOverlap===0;
 const recommendation=gate?"review_required":score>=75?"pilot_candidate":score>=50?"needs_validation":"low_fit";
 const mutation=useMutation({
  mutationFn:()=>save({data:{prospectId,expectedRevision:review?.revision??null,
   ...ratings,evidence:evidence.trim()}}),
  onSuccess:()=>{toast.success("Diagnóstico do criador auditado.");void qc.invalidateQueries({queryKey:["rubi-creator-teams"]});},
  onError:(err:Error)=>toast.error(err.message)
 });
 return <details className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
  <summary className="cursor-pointer text-sm font-semibold">Diagnóstico de compatibilidade
   {review?<span className="ml-2 text-xs text-muted-foreground">{review.fit_score}/100 · {labels[review.recommendation]??review.recommendation}</span>:<span className="ml-2 text-xs text-muted-foreground">Pendente de avaliação</span>}
  </summary>
  <div className="mt-3 space-y-3">
   <p className="text-xs text-muted-foreground">Guia de avaliação humana: 0 = sem evidência/incompatível; 1 = evidência parcial; 2 = evidência verificada e suficiente. O porte não soma pontos. Não são dados aferidos automaticamente.</p>
   {fields.map(field=><label key={field.key} className="block space-y-1 text-xs">
    <span className="font-semibold">{field.title}</span>
    <span className="block text-muted-foreground">{field.hint}</span>
    <select aria-label={field.title} className="w-full rounded-lg border bg-background p-2" value={ratings[field.key]}
      onChange={event=>setRatings(prev=>({...prev,[field.key]:Number(event.target.value)}))}>
     <option value={0}>0 — Sem evidência ou incompatível</option><option value={1}>1 — Parcial, verificar</option><option value={2}>2 — Verificado</option>
    </select>
   </label>)}
   <label className="block space-y-1 text-xs font-semibold">Evidências e próximos passos (obrigatório)
    <textarea className="block w-full rounded-lg border bg-background p-2 font-normal" rows={4}
      minLength={30} maxLength={1500} value={evidence} onChange={event=>setEvidence(event.target.value)}
      placeholder="Descreva amostra pública observada, data da checagem, adequação ao time, riscos e o que precisa ser confirmado. Não inclua dados pessoais sensíveis."/>
   </label>
   <div className="rounded-lg border bg-background p-3 text-xs">
    <strong>Diagnóstico estimado: {score}/100 · {labels[recommendation]}</strong>
    <p className="mt-1 text-muted-foreground">Próximo passo: {gate?"Investigar adequação e revisar reputação, direitos e audiência antes de qualquer convite.":recommendation==="pilot_candidate"?"Propor piloto pequeno e mensurável ao Master, com acordo, produto autorizado e critérios de resultado.":recommendation==="needs_validation"?"Pedir exemplos adicionais e testar encaixe com conteúdo do nicho.":"Não priorizar a negociação até corrigir incompatibilidades."}</p>
   </div>
   <Button size="sm" disabled={mutation.isPending||evidence.trim().length<30}
    onClick={()=>mutation.mutate()}>{mutation.isPending?"Registrando...":"Salvar avaliação auditada"}</Button>
   <p className="text-xs text-muted-foreground">Uma nota alta não aprova o parceiro, não cria um contrato nem libera comissão, produto ou link. Toda parceria exige decisão e comprovação próprias.</p>
  </div>
 </details>;
}
