import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {listRubiAudienceEvidenceReviewsAdmin,recordRubiAudienceEvidenceReviewAdmin} from "@/lib/rubi-audience-review.functions";
import {assessRubiAudienceEvidenceStatus} from "@/lib/rubi-audience-evidence-status";

export function RubiAudienceEvidenceReviewAdmin({movementId,movementRevision,evidenceNotes}:{
 movementId:string;movementRevision:number;evidenceNotes:string
}){
 const list=useServerFn(listRubiAudienceEvidenceReviewsAdmin);
 const record=useServerFn(recordRubiAudienceEvidenceReviewAdmin);
 const cache=useQueryClient();
 const [outcome,setOutcome]=useState<"needs_more_evidence"|"document_reviewed">("needs_more_evidence");
 const [sourceReference,setSourceReference]=useState("");
 const [reviewerNote,setReviewerNote]=useState("");
 const key=["rubi-audience-evidence-reviews",movementId];
 const query=useQuery({queryKey:key,queryFn:()=>list({data:{movementId}}),retry:false});
 const evidence=assessRubiAudienceEvidenceStatus(evidenceNotes);
 const canReview=evidence.kind==="declared_pending_review"&&evidence.blockers.length===1;
 const mutation=useMutation({
  mutationFn:()=>record({data:{movementId,movementRevision,outcome,sourceReference,reviewerNote}}),
  onSuccess:()=>{toast.success("Decisão documental registrada no histórico.");setReviewerNote("");void cache.invalidateQueries({queryKey:key});},
  onError:(e:Error)=>toast.error(e.message)
 });
 return <section className="space-y-3 rounded-xl border p-4" aria-label="Histórico de revisão das evidências">
  <h4 className="text-sm font-bold">Revisão documental do público · Shadow Master</h4>
  <p className="text-xs text-muted-foreground">As decisões são registradas por versão do movimento, preservando o histórico. Revisão documental não significa público validado em mercado, campanha autorizada ou venda comprovada.</p>
  {!canReview&&<p role="alert" className="text-xs text-amber-700 dark:text-amber-300">Registre e salve um documento de evidência estruturado e completo antes de revisar.</p>}
  <label className="block space-y-1 text-xs font-semibold">Decisão documental
   <select value={outcome} onChange={e=>setOutcome(e.target.value as typeof outcome)}
    className="block w-full rounded-lg border bg-background p-2 text-sm">
    <option value="needs_more_evidence">Necessita mais evidências</option>
    <option value="document_reviewed">Documento examinado — não comprova mercado</option>
   </select>
  </label>
  <label className="block space-y-1 text-xs font-semibold">Fonte efetivamente consultada
   <input value={sourceReference} onChange={e=>setSourceReference(e.target.value)} maxLength={500}
    placeholder="URL ou referência verificável" className="block w-full rounded-lg border bg-background p-2 text-sm"/>
  </label>
  <label className="block space-y-1 text-xs font-semibold">Nota da revisão e limitações
   <textarea value={reviewerNote} onChange={e=>setReviewerNote(e.target.value)} maxLength={1000} rows={3}
    className="block w-full rounded-lg border bg-background p-2 text-sm"/>
  </label>
  <Button type="button" variant="outline" disabled={!canReview||mutation.isPending||sourceReference.trim().length<12||reviewerNote.trim().length<20}
   onClick={()=>mutation.mutate()}>Registrar decisão auditável</Button>
  {query.isLoading&&<p role="status" className="text-xs">Consultando histórico...</p>}
  {query.isError&&<p role="alert" className="text-xs text-destructive">Histórico indisponível. Confira migração e permissão Master.</p>}
  {query.data?.partial&&<p role="alert" className="text-xs">Histórico parcial: exibidas somente as 50 decisões mais recentes.</p>}
  {query.data?.rows?.map(row=><article key={row.id} className="space-y-1 rounded-lg border bg-muted/20 p-3">
   <p className="text-xs font-semibold">{row.outcome==="document_reviewed"?"Documento examinado (sem validar mercado)":"Mais evidências necessárias"}</p>
   <p className="text-xs text-muted-foreground">Versão {row.movement_revision} · {new Date(row.created_at).toLocaleString("pt-BR")}</p>
   <p className="text-xs break-words">Fonte: {row.source_reference}</p>
   <p className="text-xs whitespace-pre-wrap">{row.reviewer_note}</p>
  </article>)}
 </section>;
}
