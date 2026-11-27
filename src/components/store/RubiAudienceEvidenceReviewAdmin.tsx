import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {listRubiAudienceEvidenceReviewsAdmin,recordRubiAudienceEvidenceReviewAdmin} from "@/lib/rubi-audience-review.functions";
import {assessRubiAudienceEvidenceStatus} from "@/lib/rubi-audience-evidence-status";

type ReviewRow={
 id:string;outcome:string;movement_revision:number;created_at:string;
 source_reference:string;reviewer_note:string
};
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
 const reviews=(query.data?.rows??[]) as ReviewRow[];
 const latest=reviews[0];
 const alreadyReviewedCurrentVersion=latest?.movement_revision===movementRevision;
 const mutation=useMutation({
  mutationFn:()=>record({data:{movementId,movementRevision,outcome,sourceReference,reviewerNote}}),
  onSuccess:()=>{toast.success("Decisão documental registrada no histórico.");setReviewerNote("");void cache.invalidateQueries({queryKey:key});},
  onError:(e:Error)=>toast.error(e.message)
 });
 return <section className="space-y-4 rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5" aria-label="Histórico de revisão das evidências">
  <header className="space-y-2">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h4 className="text-sm font-bold">Revisão documental do público · Shadow Master</h4>
    <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">Versão atual · {movementRevision}</span>
   </div>
   <p className="text-xs leading-relaxed text-muted-foreground">Este painel registra a análise documental do Master. Não transforma uma hipótese em público validado, não autoriza campanha e não comprova vendas.</p>
  </header>

  <div className="grid gap-2 sm:grid-cols-2">
   <div className="rounded-xl border bg-muted/20 p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Integridade da evidência</p>
    <p className="mt-1 text-sm font-bold">{canReview?"Registro estruturado apto à análise":"Registro ainda não apto"}</p>
    <p className="mt-1 text-xs text-muted-foreground">{canReview?"Os campos passaram pelas verificações estruturais; a fonte ainda exige conferência humana.":"Complete e salve os campos obrigatórios antes de solicitar análise."}</p>
   </div>
   <div className="rounded-xl border bg-muted/20 p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Histórico</p>
    <p className="mt-1 text-sm font-bold">{query.isLoading?"Consultando…":reviews.length+" decisão(ões)"}</p>
    <p className="mt-1 text-xs text-muted-foreground">Decisões vinculadas à versão do movimento, sem apagar registros anteriores.</p>
   </div>
  </div>

  {!canReview&&<p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">Registre e salve uma evidência estruturada e completa antes da revisão documental.</p>}
  {alreadyReviewedCurrentVersion&&<p role="status" className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-sky-900 dark:text-sky-200">A versão {movementRevision} já possui uma decisão registrada. Para uma nova análise, atualize e salve o movimento; a nova versão manterá o histórico anterior.</p>}
  {latest&&latest.movement_revision!==movementRevision&&<p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">A decisão mais recente pertence à versão {latest.movement_revision}. A versão atual ({movementRevision}) ainda não foi analisada.</p>}

  <fieldset disabled={!canReview||alreadyReviewedCurrentVersion||mutation.isPending} className="space-y-3 disabled:opacity-60">
   <legend className="text-xs font-bold">Registrar nova decisão para a versão atual</legend>
   <label className="block space-y-1 text-xs font-semibold">Decisão documental
    <select value={outcome} onChange={e=>setOutcome(e.target.value as typeof outcome)}
     className="block w-full rounded-lg border bg-background p-2.5 text-sm">
     <option value="needs_more_evidence">Necessita mais evidências</option>
     <option value="document_reviewed">Documento examinado — não comprova mercado</option>
    </select>
   </label>
   <label className="block space-y-1 text-xs font-semibold">Fonte efetivamente consultada
    <input value={sourceReference} onChange={e=>setSourceReference(e.target.value)} maxLength={500}
     placeholder="URL ou referência verificável" className="block w-full rounded-lg border bg-background p-2.5 text-sm"/>
   </label>
   <label className="block space-y-1 text-xs font-semibold">Nota da revisão e limitações
    <textarea value={reviewerNote} onChange={e=>setReviewerNote(e.target.value)} maxLength={1000} rows={3}
     placeholder="O que foi conferido, o que permanece incerto e quais limites se aplicam."
     className="block w-full rounded-lg border bg-background p-2.5 text-sm"/>
   </label>
   <Button type="button" variant="outline" disabled={sourceReference.trim().length<12||reviewerNote.trim().length<20}
    onClick={()=>mutation.mutate()}>{mutation.isPending?"Registrando…":"Registrar decisão auditável"}</Button>
  </fieldset>

  <div className="space-y-2" aria-live="polite">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h5 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Linha do tempo de decisões</h5>
    <Button type="button" size="sm" variant="ghost" disabled={query.isFetching} onClick={()=>void query.refetch()}>
     {query.isFetching?"Atualizando…":"Atualizar histórico"}
    </Button>
   </div>
   {query.isLoading&&<p role="status" className="rounded-lg border p-3 text-xs text-muted-foreground">Consultando histórico protegido…</p>}
   {query.isError&&<div className="rounded-lg border border-destructive/30 p-3">
    <p role="alert" className="text-xs text-destructive">Não foi possível carregar o histórico. A decisão não será presumida nem exibida como concluída.</p>
    <Button type="button" size="sm" variant="outline" className="mt-2" onClick={()=>void query.refetch()}>Tentar novamente</Button>
   </div>}
   {!query.isLoading&&!query.isError&&reviews.length===0&&<p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Nenhuma decisão documental registrada. O movimento continua como hipótese privada até a análise humana.</p>}
   {query.data?.partial&&<p role="alert" className="text-xs text-amber-700 dark:text-amber-300">Histórico parcial: exibidas somente as 50 decisões mais recentes.</p>}
   <ol className="space-y-2">
    {reviews.map(row=><li key={row.id} className="space-y-2 rounded-xl border bg-muted/10 p-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs font-semibold">{row.outcome==="document_reviewed"?"Documento examinado":"Mais evidências necessárias"}</p>
      <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium">Versão {row.movement_revision}</span>
     </div>
     <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</p>
     <p className="break-words text-xs"><strong>Fonte consultada:</strong> {row.source_reference}</p>
     <p className="whitespace-pre-wrap text-xs leading-relaxed">{row.reviewer_note}</p>
     <p className="text-[11px] text-muted-foreground">Registro histórico imutável · não equivale a validação de mercado.</p>
    </li>)}
   </ol>
  </div>
 </section>;
}
